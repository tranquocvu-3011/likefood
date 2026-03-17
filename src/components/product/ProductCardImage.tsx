"use client";

/**
 * ProductCardImage — Image section with fallback, skeleton, elegant hover
 * Sub-component of ProductCard
 *
 * Hover effect: smooth zoom (1.08x) + brightness boost + warm glow
 * No overlay buttons — tap/click navigates directly to product
 */

import Image from "next/image";
import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import WishlistButton from "./WishlistButton";
import { useLanguage } from "@/lib/i18n/context";

interface ProductCardImageProps {
    productId: number;
    name: string;
    image?: string | null;
    inventory: number;
    onQuickView: (e: React.MouseEvent) => void;
    onNavigate: () => void;
    lastAddedId: string | null;
}

function ProductCardImageComponent({
    productId,
    name,
    image,
    inventory,
    lastAddedId,
}: ProductCardImageProps) {
    const { t } = useLanguage();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
            <div className="p-0 relative aspect-[4/3] overflow-hidden group/img">
                {/* Wishlist Button */}
                <div className="absolute top-2 right-2 z-20">
                    <WishlistButton productId={productId} />
                </div>

                {/* Out of Stock Overlay */}
                {inventory <= 0 && (
                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-slate-900/90 backdrop-blur-sm px-6 py-3 rounded-full">
                            <span className="text-sm font-black text-white uppercase tracking-wider">
                                {t("shop.outOfStock")}
                            </span>
                        </div>
                    </div>
                )}

                {/* Image Container */}
                <div className="relative w-full h-full">
                    {/* Skeleton */}
                    {!imageLoaded && !imgError && (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 animate-pulse">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                        </div>
                    )}

                    {/* Image with CSS-only hover: zoom + brightness — works on desktop, no stuck state on mobile */}
                    <div className="relative w-full h-full transition-transform duration-500 ease-out group-hover/img:scale-[1.08]">
                        {image && !imgError ? (
                            <Image
                                src={image}
                                alt={name}
                                fill
                                className={`object-cover transition-all duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"} group-hover/img:brightness-[1.05]`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => { setImgError(true); setImageLoaded(true); }}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 gap-3">
                                <Package className="w-14 h-14 text-slate-300" />
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">No image</span>
                            </div>
                        )}
                    </div>

                    {/* Subtle bottom gradient on hover — pure CSS, no stuck state */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

                    {/* Shine sweep on hover — pure CSS animation */}
                    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-200%] group-hover/img:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                    </div>
                </div>

                {/* Fly to Cart Animation */}
                <AnimatePresence>
                    {String(productId) === String(lastAddedId) && image && (
                        <motion.div
                            initial={{ opacity: 1, scale: 1, x: 0, y: 0, position: "absolute", zIndex: 100 }}
                            animate={{ opacity: 0, scale: 0.2, x: 300, y: -400, rotate: 30 }}
                            transition={{ duration: 0.7, ease: "circIn" }}
                            className="pointer-events-none w-full h-full"
                        >
                            <Image src={image} alt={name} fill className="object-cover rounded-full shadow-2xl border-4 border-white" sizes="200px" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default memo(ProductCardImageComponent);

