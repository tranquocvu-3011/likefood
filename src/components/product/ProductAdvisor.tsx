"use client";

/**
 * LIKEFOOD — Product Advisor Widget
 * Widget tư vấn & so sánh sản phẩm trên trang chi tiết
 * Copyright (c) 2026 LIKEFOOD Team
 */

import React, { useState, useCallback } from "react";

interface ProductAdvice {
  type: string;
  content: string;
  comparison?: {
    products: Array<{
      id: number; name: string; price: number;
      rating: number; reviewCount: number; soldCount: number;
      strengths: string[]; weaknesses: string[]; bestFor: string[];
    }>;
    recommendation: string;
    summary: string;
  };
  products?: Array<{
    id: number; name: string; slug: string;
    price: number; image?: string | null; category: string;
  }>;
}

interface ProductAdvisorProps {
  productId?: number;
  productName?: string;
  className?: string;
}

export default function ProductAdvisor({
  productId,
  productName,
  className = "",
}: ProductAdvisorProps) {
  const [activeTab, setActiveTab] = useState<"strengths" | "compare" | "advice">("strengths");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProductAdvice | null>(null);
  const [query, setQuery] = useState("");
  const [compareIds, setCompareIds] = useState("");

  const fetchAdvice = useCallback(async (action: string, body: Record<string, unknown>) => {
    try {
      setLoading(true);
      setResult(null);
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.response ?? data.analysis ?? data.comparison ?? null);
      }
    } catch (error) {
      console.error("[ProductAdvisor] Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStrengths = () => {
    if (!productId) return;
    setActiveTab("strengths");
    fetchAdvice("strengths", { productId });
  };

  const handleCompare = () => {
    setActiveTab("compare");
    const ids = compareIds.split(",").map(s => parseInt(s.trim())).filter(Boolean);
    if (ids.length >= 2) {
      fetchAdvice("compare", { productIds: ids });
    }
  };

  const handleAdvice = () => {
    setActiveTab("advice");
    if (query.trim()) {
      fetchAdvice("advise", { query: query.trim() });
    }
  };

  return (
    <div className={`product-advisor ${className}`}>
      <div className="advisor-header">
        <h3 className="advisor-title">🤖 Trợ Lý AI</h3>
        <div className="advisor-tabs">
          <button
            className={`advisor-tab ${activeTab === "strengths" ? "active" : ""}`}
            onClick={handleStrengths}
          >
            💪 Điểm Mạnh
          </button>
          <button
            className={`advisor-tab ${activeTab === "compare" ? "active" : ""}`}
            onClick={() => setActiveTab("compare")}
          >
            ⚖️ So Sánh
          </button>
          <button
            className={`advisor-tab ${activeTab === "advice" ? "active" : ""}`}
            onClick={() => setActiveTab("advice")}
          >
            💡 Tư Vấn
          </button>
        </div>
      </div>

      <div className="advisor-content">
        {activeTab === "compare" && !loading && !result && (
          <div className="advisor-input-group">
            <p className="advisor-hint">Nhập ID sản phẩm cần so sánh (cách nhau bằng dấu phẩy):</p>
            <div className="advisor-input-row">
              <input
                type="text"
                value={compareIds}
                onChange={(e) => setCompareIds(e.target.value)}
                placeholder={productId ? `${productId}, ...` : "1, 2, 3"}
                className="advisor-input"
              />
              <button className="advisor-btn" onClick={handleCompare}>So Sánh</button>
            </div>
          </div>
        )}

        {activeTab === "advice" && !loading && !result && (
          <div className="advisor-input-group">
            <p className="advisor-hint">Bạn cần tư vấn gì?</p>
            <div className="advisor-input-row">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="VD: nên mua gì cho gia đình?"
                className="advisor-input"
                onKeyDown={(e) => e.key === "Enter" && handleAdvice()}
              />
              <button className="advisor-btn" onClick={handleAdvice}>Tư Vấn</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="advisor-loading">
            <div className="advisor-spinner" />
            <span>AI đang phân tích...</span>
          </div>
        )}

        {result && !loading && (
          <div className="advisor-result">
            {/* Comparison view */}
            {result.comparison && (
              <div className="advisor-comparison">
                <p className="advisor-summary">{result.comparison.summary}</p>
                <div className="comparison-grid">
                  {result.comparison.products.map((p) => (
                    <div key={p.id} className="comparison-item">
                      <h5>{p.name}</h5>
                      <div className="comparison-meta">
                        <span>⭐ {p.rating}/5 ({p.reviewCount})</span>
                        <span>📦 {p.soldCount} sold</span>
                        <span>💰 ${p.price}</span>
                      </div>
                      <div className="comparison-details">
                        <div className="strengths">
                          <strong>✅ Điểm mạnh:</strong>
                          <ul>{p.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                        </div>
                        {p.weaknesses.length > 0 && (
                          <div className="weaknesses">
                            <strong>⚠️ Lưu ý:</strong>
                            <ul>{p.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                          </div>
                        )}
                        <div className="best-for">
                          <strong>👤 Phù hợp:</strong>
                          {p.bestFor.map((b, i) => <span key={i} className="best-tag">{b}</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="advisor-recommendation">
                  💡 {result.comparison.recommendation}
                </div>
              </div>
            )}

            {/* General advice / strengths view */}
            {!result.comparison && result.content && (
              <div className="advisor-text">
                <p>{result.content}</p>
              </div>
            )}

            {/* Product suggestions */}
            {result.products && result.products.length > 0 && (
              <div className="advisor-products">
                <h5>Gợi ý sản phẩm:</h5>
                <div className="advisor-product-grid">
                  {result.products.map((p) => (
                    <a key={p.id} href={`/product/${p.slug}`} className="advisor-product-card">
                      <span className="ap-name">{p.name}</span>
                      <span className="ap-price">${p.price.toFixed(2)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button className="advisor-reset" onClick={() => setResult(null)}>
              ↩ Hỏi lại
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .product-advisor {
          border: 1px solid #e8e8e8; border-radius: 12px;
          background: #fff; overflow: hidden;
        }
        .advisor-header { padding: 12px 16px; background: linear-gradient(135deg, #f8f6ff, #fff0eb); }
        .advisor-title {
          font-size: 16px; font-weight: 700; color: #1a1a1a;
          margin: 0 0 10px;
        }
        .advisor-tabs { display: flex; gap: 6px; }
        .advisor-tab {
          padding: 6px 12px; border: 1px solid #ddd; border-radius: 20px;
          background: #fff; font-size: 12px; cursor: pointer;
          transition: all 0.2s; font-weight: 500;
        }
        .advisor-tab.active, .advisor-tab:hover {
          background: linear-gradient(135deg, #ff6b35, #ff8e53);
          color: #fff; border-color: transparent;
        }
        .advisor-content { padding: 16px; }
        .advisor-input-group { margin-bottom: 12px; }
        .advisor-hint { font-size: 13px; color: #666; margin: 0 0 8px; }
        .advisor-input-row { display: flex; gap: 8px; }
        .advisor-input {
          flex: 1; padding: 8px 12px; border: 1px solid #ddd;
          border-radius: 8px; font-size: 13px; outline: none;
        }
        .advisor-input:focus { border-color: #ff6b35; }
        .advisor-btn {
          padding: 8px 16px;
          background: linear-gradient(135deg, #ff6b35, #ff8e53);
          color: #fff; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          white-space: nowrap;
        }
        .advisor-btn:hover { opacity: 0.9; }
        .advisor-loading {
          display: flex; align-items: center; gap: 10px;
          justify-content: center; padding: 30px; color: #666;
        }
        .advisor-spinner {
          width: 20px; height: 20px;
          border: 2px solid #e8e8e8; border-top-color: #ff6b35;
          border-radius: 50%; animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .advisor-result { font-size: 14px; line-height: 1.6; color: #333; }
        .advisor-summary { color: #666; margin: 0 0 12px; font-style: italic; }
        .comparison-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px; margin-bottom: 12px;
        }
        .comparison-item {
          padding: 12px; background: #f8f8f8; border-radius: 8px;
          border: 1px solid #e8e8e8;
        }
        .comparison-item h5 { margin: 0 0 6px; font-size: 14px; color: #1a1a1a; }
        .comparison-meta {
          display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;
          font-size: 11px; color: #888;
        }
        .comparison-details ul {
          margin: 4px 0; padding-left: 16px; font-size: 12px;
        }
        .comparison-details li { margin-bottom: 2px; }
        .strengths { color: #27ae60; }
        .weaknesses { color: #e67e22; }
        .best-for { margin-top: 6px; }
        .best-tag {
          display: inline-block; padding: 2px 6px; margin: 2px;
          background: #e8f5e9; color: #27ae60; border-radius: 4px;
          font-size: 11px;
        }
        .advisor-recommendation {
          padding: 10px; background: #fffbf0; border-radius: 8px;
          border-left: 3px solid #ff6b35; font-size: 13px; color: #555;
        }
        .advisor-text p { margin: 0; white-space: pre-wrap; }
        .advisor-products { margin-top: 12px; }
        .advisor-products h5 { margin: 0 0 8px; font-size: 13px; }
        .advisor-product-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .advisor-product-card {
          display: flex; justify-content: space-between;
          padding: 6px 10px; background: #f0f0f0; border-radius: 6px;
          text-decoration: none; color: #333; font-size: 12px;
          transition: background 0.2s;
        }
        .advisor-product-card:hover { background: #e0e0e0; }
        .ap-name { font-weight: 500; }
        .ap-price { color: #ff6b35; font-weight: 600; margin-left: 8px; }
        .advisor-reset {
          margin-top: 12px; border: none; background: none;
          color: #ff6b35; font-size: 12px; cursor: pointer;
          text-decoration: underline;
        }
        @media (max-width: 768px) {
          .comparison-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
