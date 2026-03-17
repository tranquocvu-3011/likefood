"use client";

/**
 * LIKEFOOD — Combo Recommendation Widget
 * Hiển thị combo gợi ý trên trang sản phẩm hoặc trang chủ
 * Copyright (c) 2026 LIKEFOOD Team
 */

import React, { useState, useEffect, useCallback } from "react";

interface ComboProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image?: string | null;
  category: string;
  quantity: number;
}

interface Combo {
  id?: number;
  name: string;
  type: string;
  description: string;
  products: ComboProduct[];
  totalPrice: number;
  discountPct: number;
  finalPrice: number;
  reason: string;
  savings: number;
}

interface ComboRecommendationProps {
  type?: string;
  productId?: number;
  limit?: number;
  title?: string;
  className?: string;
}

export default function ComboRecommendation({
  type = "bestseller",
  productId,
  limit = 3,
  title,
  className = "",
}: ComboRecommendationProps) {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCombo, setExpandedCombo] = useState<number | null>(null);

  const fetchCombos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (productId) params.set("productId", String(productId));
      params.set("limit", String(limit));

      const res = await fetch(`/api/ai/combo?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCombos(data.combos ?? []);
      }
    } catch (error) {
      console.error("[ComboRecommendation] Error:", error);
    } finally {
      setLoading(false);
    }
  }, [type, productId, limit]);

  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

  if (loading) {
    return (
      <div className={`combo-recommendation ${className}`}>
        <div className="combo-loading">
          <div className="combo-loading-spinner" />
          <span>Đang tạo combo gợi ý...</span>
        </div>
        <style jsx>{`
          .combo-recommendation { padding: 20px; }
          .combo-loading {
            display: flex; align-items: center; gap: 12px;
            justify-content: center; padding: 40px;
            color: #666; font-size: 14px;
          }
          .combo-loading-spinner {
            width: 24px; height: 24px;
            border: 3px solid #e8e8e8; border-top-color: #ff6b35;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (combos.length === 0) return null;

  return (
    <div className={`combo-recommendation ${className}`}>
      {title && <h3 className="combo-title">{title}</h3>}

      <div className="combo-grid">
        {combos.map((combo, index) => (
          <div
            key={combo.id ?? index}
            className={`combo-card ${expandedCombo === index ? "expanded" : ""}`}
          >
            <div className="combo-header">
              <div className="combo-badge">{combo.type.toUpperCase()}</div>
              <h4 className="combo-name">{combo.name}</h4>
              <p className="combo-desc">{combo.description}</p>
            </div>

            <div className="combo-products">
              {combo.products.slice(0, expandedCombo === index ? undefined : 3).map((product) => (
                <div key={product.id} className="combo-product-item">
                  <div className="combo-product-img">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="combo-product-placeholder">🛒</div>
                    )}
                  </div>
                  <div className="combo-product-info">
                    <span className="combo-product-name">{product.name}</span>
                    <span className="combo-product-price">${product.price.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {combo.products.length > 3 && expandedCombo !== index && (
                <button
                  className="combo-show-more"
                  onClick={() => setExpandedCombo(index)}
                >
                  +{combo.products.length - 3} sản phẩm khác
                </button>
              )}
            </div>

            <div className="combo-pricing">
              <div className="combo-prices">
                <span className="combo-original">${combo.totalPrice.toFixed(2)}</span>
                <span className="combo-discount">-{combo.discountPct}%</span>
                <span className="combo-final">${combo.finalPrice.toFixed(2)}</span>
              </div>
              <span className="combo-savings">Tiết kiệm ${combo.savings.toFixed(2)}</span>
            </div>

            <div className="combo-reason">
              <span>💡 {combo.reason}</span>
            </div>

            <button
              className="combo-add-btn"
              onClick={() => {
                // TODO: integrate with cart
                alert(`Đã thêm combo "${combo.name}" — sẽ tích hợp giỏ hàng`);
              }}
            >
              🛒 Thêm Combo Vào Giỏ
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .combo-recommendation { padding: 16px 0; }
        .combo-title {
          font-size: 20px; font-weight: 700; margin-bottom: 16px;
          color: #1a1a1a; display: flex; align-items: center; gap: 8px;
        }
        .combo-title::before { content: "🔥"; }
        .combo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .combo-card {
          border: 1px solid #e8e8e8; border-radius: 12px;
          padding: 16px; background: #fff;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .combo-card:hover {
          border-color: #ff6b35; box-shadow: 0 4px 16px rgba(255,107,53,0.1);
        }
        .combo-header { margin-bottom: 12px; }
        .combo-badge {
          display: inline-block; padding: 2px 8px;
          background: linear-gradient(135deg, #ff6b35, #ff8e53);
          color: #fff; font-size: 10px; font-weight: 700;
          border-radius: 4px; margin-bottom: 8px; letter-spacing: 0.5px;
        }
        .combo-name { font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0; }
        .combo-desc { font-size: 13px; color: #666; margin: 4px 0 0; line-height: 1.4; }
        .combo-products { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .combo-product-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px; background: #f8f8f8; border-radius: 8px;
        }
        .combo-product-img { width: 40px; height: 40px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
        .combo-product-img img { width: 100%; height: 100%; object-fit: cover; }
        .combo-product-placeholder {
          width: 100%; height: 100%; display: flex;
          align-items: center; justify-content: center;
          background: #eee; font-size: 18px;
        }
        .combo-product-info { display: flex; justify-content: space-between; flex: 1; align-items: center; }
        .combo-product-name { font-size: 13px; color: #333; font-weight: 500; }
        .combo-product-price { font-size: 13px; color: #ff6b35; font-weight: 600; }
        .combo-show-more {
          border: none; background: none; color: #ff6b35;
          font-size: 12px; cursor: pointer; text-align: left;
          padding: 4px 8px;
        }
        .combo-pricing { margin-bottom: 8px; text-align: center; }
        .combo-prices {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 4px;
        }
        .combo-original { font-size: 14px; color: #999; text-decoration: line-through; }
        .combo-discount {
          font-size: 12px; color: #fff; background: #e74c3c;
          padding: 1px 6px; border-radius: 4px; font-weight: 600;
        }
        .combo-final { font-size: 20px; color: #e74c3c; font-weight: 700; }
        .combo-savings { font-size: 12px; color: #27ae60; font-weight: 500; }
        .combo-reason {
          font-size: 12px; color: #666; margin-bottom: 12px;
          padding: 8px; background: #fffbf0; border-radius: 6px;
          border-left: 3px solid #ff6b35;
        }
        .combo-add-btn {
          width: 100%; padding: 10px;
          background: linear-gradient(135deg, #ff6b35, #ff8e53);
          color: #fff; border: none; border-radius: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease;
        }
        .combo-add-btn:hover {
          background: linear-gradient(135deg, #e55a2b, #ff6b35);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255,107,53,0.3);
        }
        @media (max-width: 768px) {
          .combo-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
