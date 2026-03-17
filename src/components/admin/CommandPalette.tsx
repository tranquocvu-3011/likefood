"use client";

/**
 * LIKEFOOD - Premium Command Palette
 * Global Cmd/Ctrl + K Navigation
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Command,
  ArrowRight,
  ClipboardList,
  Package,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  Home,
  Plus,
  FileText,
  Tag,
  FolderTree,
  Truck,
  Megaphone,
  Shield,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string | number;
  label: string;
  description?: string;
  icon: any;
  href?: string;
  action?: () => void;
  category: string;
}

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: 'nav-dashboard', label: 'Go to Dashboard', icon: Home, href: '/admin', category: 'Navigation' },
  { id: 'nav-orders', label: 'Go to Orders', icon: ClipboardList, href: '/admin/orders', category: 'Navigation' },
  { id: 'nav-products', label: 'Go to Products', icon: Package, href: '/admin/products', category: 'Navigation' },
  { id: 'nav-customers', label: 'Go to Customers', icon: Users, href: '/admin/customers', category: 'Navigation' },
  { id: 'nav-inventory', label: 'Go to Inventory', icon: Database, href: '/admin/inventory', category: 'Navigation' },
  { id: 'nav-analytics', label: 'Go to Analytics', icon: BarChart3, href: '/admin/analytics', category: 'Navigation' },
  { id: 'nav-ai', label: 'Go to AI Insights', icon: Sparkles, href: '/admin/ai', category: 'Navigation' },
  { id: 'nav-settings', label: 'Go to Settings', icon: Settings, href: '/admin/settings', category: 'Navigation' },
  
  // Quick Actions
  { id: 'action-new-product', label: 'Create New Product', icon: Plus, href: '/admin/products/new', category: 'Quick Actions' },
  { id: 'action-new-order', label: 'View Recent Orders', icon: ClipboardList, href: '/admin/orders', category: 'Quick Actions' },
  { id: 'action-check-stock', label: 'Check Low Stock', icon: Package, href: '/admin/inventory', category: 'Quick Actions' },
  
  // Catalog
  { id: 'cat-categories', label: 'Manage Categories', icon: FolderTree, href: '/admin/categories', category: 'Catalog' },
  { id: 'cat-brands', label: 'Manage Brands', icon: Tag, href: '/admin/brands', category: 'Catalog' },
  { id: 'cat-coupons', label: 'Manage Coupons', icon: Megaphone, href: '/admin/coupons', category: 'Catalog' },
  
  // Operations
  { id: 'ops-shipping', label: 'Shipping Settings', icon: Truck, href: '/admin/settings', category: 'Operations' },
  { id: 'ops-payments', label: 'Payment Settings', icon: Shield, href: '/admin/settings', category: 'Operations' },
  
  // Content
  { id: 'content-posts', label: 'Manage Posts', icon: FileText, href: '/admin/posts', category: 'Content' },
  { id: 'content-pages', label: 'Manage Pages', icon: FileText, href: '/admin/pages', category: 'Content' },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const flatCommands = filteredCommands;

  const handleSelect = useCallback((command: CommandItem) => {
    if (command.href) {
      router.push(command.href);
    } else if (command.action) {
      command.action();
    }
    onOpenChange(false);
    setSearch("");
  }, [router, onOpenChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % flatCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + flatCommands.length) % flatCommands.length);
    } else if (e.key === "Enter" && flatCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatCommands[selectedIndex]);
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  }, [flatCommands, selectedIndex, handleSelect, onOpenChange]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setSelectedIndex(0);
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2">
        <div className="rounded-xl border border-zinc-800 bg-[#0A0A0B] shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
            <Search className="h-5 w-5 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search commands, pages, actions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-500">
              <Command className="h-3 w-3" />K
            </kbd>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {flatCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No results found for &quot;{search}&quot;
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-2">
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {category}
                  </div>
                  {commands.map((command) => {
                    const isSelected = flatCommands.indexOf(command) === selectedIndex;
                    return (
                      <button
                        key={command.id}
                        onClick={() => handleSelect(command)}
                        onMouseEnter={() => setSelectedIndex(flatCommands.indexOf(command))}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isSelected 
                            ? "bg-teal-600/10 text-teal-400" 
                            : "text-zinc-300 hover:bg-zinc-800/50"
                        )}
                      >
                        <command.icon className="h-4 w-4 text-zinc-500" />
                        <span className="flex-1 text-sm">{command.label}</span>
                        {isSelected && (
                          <ArrowRight className="h-4 w-4 text-teal-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2 text-[10px] text-zinc-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook to manage command palette
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
