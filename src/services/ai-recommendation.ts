/**
 * LIKEFOOD — AI Recommendation Service
 * Refactored to use centralized ai-provider
 * Copyright (c) 2026 LIKEFOOD Team
 */

import { callGPTJSON } from "@/lib/ai/ai-provider";

interface Product {
    id: number;
    name: string;
    category: string;
    description: string;
}

export async function getAIRecommendations(baseProduct: Product, allProducts: Product[]) {
    const prompt = `
Dựa trên sản phẩm đang xem: "${baseProduct.name}" (Danh mục: ${baseProduct.category}, Mô tả: ${baseProduct.description}).
Hãy chọn ra 3 sản phẩm liên quan nhất từ danh sách sau:
${allProducts.map(p => `- ID: ${p.id}, Tên: ${p.name}, Danh mục: ${p.category}`).join("\n")}

Trả về JSON array các ID: [1, 2, 3]
`;

    try {
        const ids = await callGPTJSON<number[]>(prompt, {
            task: "recommend",
            maxTokens: 50,
            temperature: 0.4,
        });

        if (ids && Array.isArray(ids)) {
            const matched = allProducts.filter(p => ids.includes(p.id));
            if (matched.length > 0) return matched;
        }

        // Fallback: same-category products
        return allProducts
            .filter(p => p.category === baseProduct.category && p.id !== baseProduct.id)
            .slice(0, 3);
    } catch (error) {
        console.error("AI Recommendation Error:", error);
        return allProducts.slice(0, 3);
    }
}
