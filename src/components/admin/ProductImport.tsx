"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Product Import/Export with CSV & Templates
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { useState, useCallback, useRef } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImportResult {
    row: number;
    status: "success" | "error";
    message: string;
    data?: any;
}

interface ProductImportProps {
    onImport: (products: any[]) => Promise<void>;
    categories?: { id: string; name: string }[];
    onExport?: (products: any[]) => void;
    maxRows?: number;
}

const SAMPLE_CSV = `name,price,original_price,sale_price,inventory,category,description,sku,weight,tags,is_visible,is_featured,is_on_sale
"Premium Dried Fish - Chau Doc Style",29.99,39.99,24.99,100,"Dried Seafood","Authentic dried fish from Chau Doc...","DF-001","500g","giftable,premium",1,1,1
"Dried Shrimp - Khanh Hoa",19.99,24.99,,200,"Dried Seafood","Premium dried shrimp...","DS-002","250g","ready-to-serve",1,0,1
"Vietnamese Fish Sauce - Phu Quoc",15.99,,,150,"Spices","100% natural fish sauce...","FS-003","500ml","authentic",1,1,0`;

const REQUIRED_FIELDS = ["name", "price"];
const OPTIONAL_FIELDS = [
    "original_price", "sale_price", "inventory", "category", 
    "description", "sku", "weight", "tags", 
    "is_visible", "is_featured", "is_on_sale"
];

export default function ProductImport({ 
    onImport, 
    categories = [], 
    maxRows = 500 
}: ProductImportProps) {
    const [isImporting, setIsImporting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parse CSV
    const parseCSV = (content: string): any[] => {
        const lines = content.trim().split("\n");
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
        const products: any[] = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
            const product: any = {};
            
            headers.forEach((header, index) => {
                let value: any = values[index] || "";
                
                // Convert types
                if (["price", "original_price", "sale_price", "inventory"].includes(header)) {
                    value = value ? parseFloat(value) : null;
                } else if (["is_visible", "is_featured", "is_on_sale"].includes(header)) {
                    value = value === "1" || value === "true" || value === "1";
                }
                
                product[header] = value;
            });
            
            if (product.name) {
                products.push(product);
            }
        }
        
        return products;
    };

    // Validate product
    const validateProduct = (product: any, row: number): ImportResult => {
        // Check required fields
        for (const field of REQUIRED_FIELDS) {
            if (!product[field]) {
                return { 
                    row, 
                    status: "error", 
                    message: `Missing required field: ${field}` 
                };
            }
        }
        
        // Validate price
        if (product.price && product.price < 0) {
            return { row, status: "error", message: "Price must be positive" };
        }
        
        // Validate inventory
        if (product.inventory && product.inventory < 0) {
            return { row, status: "error", message: "Inventory cannot be negative" };
        }
        
        return { row, status: "success", message: "Valid", data: product };
    };

    // Handle file drop
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (!file) return;
        
        if (!file.name.endsWith(".csv")) {
            toast.error("Please upload a CSV file");
            return;
        }
        
        await processFile(file);
    }, []);

    // Process file
    const processFile = async (file: File) => {
        setIsImporting(true);
        setResults([]);
        
        try {
            const content = await file.text();
            const products = parseCSV(content);
            
            if (products.length === 0) {
                toast.error("No valid products found in file");
                return;
            }
            
            if (products.length > maxRows) {
                toast.error(`Maximum ${maxRows} products allowed per import`);
                return;
            }
            
            // Preview
            setPreviewData(products);
            setShowPreview(true);
            
        } catch (error) {
            toast.error("Failed to parse file");
        } finally {
            setIsImporting(false);
        }
    };

    // Handle import
    const handleImport = async () => {
        if (previewData.length === 0) return;
        
        setIsImporting(true);
        
        const validationResults: ImportResult[] = [];
        const validProducts: any[] = [];
        
        // Validate all
        previewData.forEach((product, index) => {
            const result = validateProduct(product, index + 1);
            validationResults.push(result);
            if (result.status === "success" && result.data) {
                validProducts.push(result.data);
            }
        });
        
        setResults(validationResults);
        
        if (validProducts.length > 0) {
            try {
                await onImport(validProducts);
                toast.success(`Successfully imported ${validProducts.length} products`);
                setShowPreview(false);
                setPreviewData([]);
            } catch (error) {
                toast.error("Import failed");
            }
        }
        
        setIsImporting(false);
    };

    // Download template
    const downloadTemplate = () => {
        const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "product_template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Export current data
    const handleExport = () => {
        const csv = SAMPLE_CSV;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "products_export.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Upload Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                    ${isDragging 
                        ? "border-teal-500 bg-teal-500/10" 
                        : "border-zinc-700 hover:border-teal-500/50"
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                    className="hidden"
                />
                
                <div className="flex flex-col items-center gap-4">
                    {isImporting ? (
                        <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
                    ) : (
                        <div className={`p-4 rounded-full ${isDragging ? "bg-teal-500/20" : "bg-zinc-800"}`}>
                            <Upload className={`h-8 w-8 ${isDragging ? "text-teal-500" : "text-zinc-500"}`} />
                        </div>
                    )}
                    
                    <div>
                        <p className="text-lg font-semibold text-zinc-200">
                            {isImporting ? "Processing..." : "Drop CSV file here"}
                        </p>
                        <p className="text-sm text-zinc-500 mt-1">
                            or click to browse • Max {maxRows} products
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                </Button>
                
                <Button
                    variant="outline"
                    onClick={handleExport}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Sample
                </Button>
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/50 overflow-hidden">
                    <div className="p-4 border-b border-zinc-700/40">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-zinc-200">Import Results</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-emerald-400">
                                    <CheckCircle className="h-4 w-4" />
                                    {results.filter(r => r.status === "success").length} success
                                </span>
                                <span className="flex items-center gap-1 text-red-400">
                                    <AlertCircle className="h-4 w-4" />
                                    {results.filter(r => r.status === "error").length} errors
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                        {results.map((result, index) => (
                            <div 
                                key={index}
                                className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800"
                            >
                                {result.status === "success" ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm text-zinc-400">Row {result.row}</span>
                                <span className={`text-sm ${result.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                                    {result.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreview && previewData.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
                    
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 rounded-2xl border border-zinc-700/40 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-700/40">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100">Import Preview</h2>
                                <p className="text-sm text-zinc-500 mt-1">
                                    {previewData.length} products ready to import
                                </p>
                            </div>
                            <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-zinc-800 rounded-xl">
                                <X className="h-5 w-5 text-zinc-400" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-zinc-900">
                                    <tr className="border-b border-zinc-700/40">
                                        <th className="p-3 text-left text-xs font-semibold text-zinc-500 uppercase">Name</th>
                                        <th className="p-3 text-left text-xs font-semibold text-zinc-500 uppercase">Price</th>
                                        <th className="p-3 text-left text-xs font-semibold text-zinc-500 uppercase">Stock</th>
                                        <th className="p-3 text-left text-xs font-semibold text-zinc-500 uppercase">Category</th>
                                        <th className="p-3 text-left text-xs font-semibold text-zinc-500 uppercase">SKU</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((product, index) => (
                                        <tr key={index} className="border-b border-zinc-800">
                                            <td className="p-3 text-sm text-zinc-200">{product.name}</td>
                                            <td className="p-3 text-sm text-zinc-200">${product.price}</td>
                                            <td className="p-3 text-sm text-zinc-200">{product.inventory || "-"}</td>
                                            <td className="p-3 text-sm text-zinc-200">{product.category || "-"}</td>
                                            <td className="p-3 text-sm text-zinc-200">{product.sku || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-700/40">
                            <Button variant="outline" onClick={() => setShowPreview(false)} className="border-zinc-700">
                                Cancel
                            </Button>
                            <Button onClick={handleImport} disabled={isImporting} className="bg-teal-600">
                                {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Import {previewData.length} Products
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
