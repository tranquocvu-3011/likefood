"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { useWishlistCount } from "@/hooks/useWishlistCount";

export default function MobileBottomNav() {
    const pathname = usePathname();
    const { totalItems } = useCart();
    const { data: session } = useSession();
    const { t } = useLanguage();
    const wishlistCount = useWishlistCount();
    const [isMounted, setIsMounted] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const navItems = [
        { icon: Home, label: t("mobileNav.home"), href: "/" },
        { icon: Search, label: t("mobileNav.products"), href: "/products" },
        { icon: ShoppingBag, label: t("mobileNav.cart"), href: "/cart", hasBadge: true },
        { icon: Heart, label: t("mobileNav.wishlist"), href: "/profile/wishlist", hasWishlistBadge: true },
        { icon: User, label: t("mobileNav.account"), href: "/profile" },
    ];

    useEffect(() => {
        const id = requestAnimationFrame(() => setIsMounted(true));
        return () => cancelAnimationFrame(id);
    }, []);

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    // Don't show on admin pages
    if (pathname.startsWith("/admin")) return null;

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: isVisible ? 0 : 100 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-safe"
            role="navigation"
            aria-label={t("mobileNav.navigation") || "Mobile navigation"}
        >
            {/* Nav items container */}
            <div>
                <div className="flex items-center justify-around h-16 px-2">
                    {navItems.map((item) => {
                        // More precise route matching: exact match for root, startsWith for others but with exclusions
                        const isExactMatch = pathname === item.href;
                        const isSubRoute = item.href !== "/" && 
                            (pathname.startsWith(item.href + "/") || 
                             (item.href === "/profile" && pathname.startsWith("/profile")));
                        const isActive = isExactMatch || (item.href !== "/" && isSubRoute);
                        
                        // Redirect to login for protected routes when not authenticated
                        let userHref = item.href;
                        const isProtectedRoute = item.href === "/profile" || item.href === "/profile/wishlist";
                        if (isProtectedRoute && !session) {
                            userHref = "/login";
                        }

                        return (
                            <Link
                                key={item.href}
                                href={userHref}
                                className="relative flex flex-col items-center justify-center flex-1 h-full group"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className={`relative flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all ${isActive ? "bg-primary/10" : ""
                                        }`}
                                >
                                    {/* Glass Glow Effect for Active/Hover */}
                                    <AnimatePresence>
                                        {(isActive) && (
                                            <motion.div
                                                layoutId="glow"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1.1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="absolute inset-0 bg-primary/20 blur-xl rounded-full z-0"
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Icon Container with Floating Effect */}
                                    <motion.div
                                        animate={{
                                            y: isActive ? -6 : 0,
                                            scale: isActive ? 1.15 : 1
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 25
                                        }}
                                        className="relative z-10"
                                    >
                                        <item.icon
                                            className={`w-6 h-6 transition-colors duration-300 ${isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
                                                }`}
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                        {/* Badge for Cart */}
                                        {item.hasBadge && isMounted && totalItems > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-lg"
                                            >
                                                {totalItems > 99 ? "99+" : totalItems}
                                            </motion.span>
                                        )}
                                        {/* Badge for Wishlist */}
                                        {item.hasWishlistBadge && isMounted && wishlistCount > 0 && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white shadow-lg"
                                            >
                                                {wishlistCount > 99 ? "99+" : wishlistCount}
                                            </motion.span>
                                        )}
                                    </motion.div>

                                    {/* Label */}
                                    <span
                                        className={`text-[10px] font-bold mt-1 transition-colors ${isActive ? "text-primary" : "text-slate-400"
                                            }`}
                                    >
                                        {item.label}
                                    </span>

                                    {/* Active Indicator - Premium Pill Style */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottomNavIndicator"
                                            className="absolute -bottom-1 w-6 h-1 bg-primary rounded-full shadow-[0_4px_10px_rgba(16,185,129,0.4)]"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </motion.nav>
    );
}

