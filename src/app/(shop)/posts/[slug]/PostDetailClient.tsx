"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ChevronLeft,
    Facebook,
    Twitter,
    Sparkles,
    Copy,
    Check,
    X,
    ChevronRight as RightArrow,
    Images,
    Share2,
    BookOpen,
    ArrowUp,
} from "lucide-react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/lib/i18n/context";

interface PostImage {
    id: number;
    imageUrl: string;
    altText?: string | null;
    order: number;
}

interface Post {
    id: number;
    title: string;
    slug: string;
    summary?: string;
    content: string;
    image?: string;
    authorName?: string;
    category?: string;
    publishedAt: string;
    images?: PostImage[];
}

// Stagger animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    },
};

// Lightbox slide directions
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 400 : -400,
        opacity: 0,
        scale: 0.9,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 400 : -400,
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.3 },
    }),
};

export default function PostDetailClient({ slug }: { slug: string }) {
    const { t, language } = useLanguage();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [[slideDirection], setSlideDirection] = useState([0]);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const articleRef = useRef<HTMLElement>(null);

    // Reading progress
    const { scrollYProgress } = useScroll();
    const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    // Parallax for hero
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 600], [0, 150]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

    // Combine cover image + gallery images for lightbox
    const allImages: string[] = post
        ? [
            ...(post.image ? [post.image] : []),
            ...(post.images?.map((img) => img.imageUrl) || []),
        ]
        : [];

    const openLightbox = useCallback((index: number) => {
        setLightboxIndex(index);
        setSlideDirection([0]);
        setLightboxOpen(true);
        document.body.style.overflow = "hidden";
    }, []);

    const closeLightbox = useCallback(() => {
        setLightboxOpen(false);
        document.body.style.overflow = "";
    }, []);

    const nextImage = useCallback(() => {
        setSlideDirection([1]);
        setLightboxIndex((prev) => (prev + 1) % allImages.length);
    }, [allImages.length]);

    const prevImage = useCallback(() => {
        setSlideDirection([-1]);
        setLightboxIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }, [allImages.length]);

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (!lightboxOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") nextImage();
            if (e.key === "ArrowLeft") prevImage();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxOpen, closeLightbox, nextImage, prevImage]);

    // Scroll to top button visibility
    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 600);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Share functions
    const shareToFacebook = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
    };

    const shareToTwitter = () => {
        const text = encodeURIComponent(post?.title || "");
        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=600,height=400");
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await fetch(`/api/posts/${slug}`);
                const data = await res.json();
                setPost(data);
            } catch (error) {
                console.error("Fetch post detail error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f1ea]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                        <BookOpen className="w-6 h-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-slate-500 font-semibold text-sm animate-pulse">
                        {isVi ? "Đang tải bài viết..." : "Loading article..."}
                    </p>
                </motion.div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-[#f4f1ea]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-slate-200/50 rotate-6">
                        <Sparkles className="w-10 h-10 text-slate-400 -rotate-6" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
                        {t("shopPage.postNotFound")}
                    </h1>
                    <p className="text-slate-500 font-medium mb-8">
                        {t("shopPage.postNotFoundDesc")}
                    </p>
                    <Link href="/posts">
                        <button className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 hover:shadow-emerald-700/40 transition-all hover:-translate-y-0.5">
                            {t("shopPage.backToAllPosts")}
                        </button>
                    </Link>
                </motion.div>
            </div>
        );
    }

    const galleryImages = post.images || [];
    const hasGallery = galleryImages.length > 0;

    return (
        <div className="min-h-screen bg-[#f4f1ea] pb-24 selection:bg-emerald-200 selection:text-emerald-900 w-full overflow-x-hidden">
            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 z-[100] origin-left"
                style={{ width: progressWidth }}
            />

            {/* Full-width Hero Banner with Parallax */}
            <div
                ref={heroRef}
                className="relative h-[58vh] lg:h-[76vh] w-full overflow-hidden bg-slate-900 flex items-center justify-center"
            >
                {post.image ? (
                    <motion.div
                        className="absolute inset-0"
                        style={{ y: heroY }}
                    >
                        <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover scale-110"
                            priority
                            sizes="100vw"
                        />
                        <motion.div
                            className="absolute inset-0 bg-black/40"
                            style={{ opacity: heroOpacity }}
                        />
                    </motion.div>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900" />
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#f4f1ea] via-transparent to-slate-900/70" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-transparent to-transparent" />

                {/* Decorative elements */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 md:px-10 text-center z-10 pb-20 md:pb-24 lg:pb-28">
                    {/* Category badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 bg-white/15 backdrop-blur-xl rounded-full text-white text-xs sm:text-sm font-bold uppercase tracking-[0.15em] border border-white/25 shadow-2xl mb-6 md:mb-8"
                    >
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>{post.category || t("shopPage.specialtyStories")}</span>
                    </motion.div>

                    {/* Title with reveal animation */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.12] tracking-tight max-w-[1100px] drop-shadow-2xl px-2"
                    >
                        {post.title}
                    </motion.h1>

                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-20 w-full mx-auto px-4 sm:px-6 lg:px-10 max-w-[1600px] -mt-10 md:-mt-14 lg:-mt-20">
                <main className="bg-white rounded-[2rem] lg:rounded-[3rem] shadow-2xl shadow-slate-900/10 border border-slate-100 flex flex-col lg:flex-row p-6 md:p-10 lg:p-14 xl:p-16 overflow-hidden">

                    {/* Left/Main Column: Article */}
                    <article ref={articleRef} className="w-full lg:w-8/12 xl:w-9/12 lg:pr-12 xl:pr-20">
                        {/* Mobile back button */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-6 block lg:hidden"
                        >
                            <Link href="/posts" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors">
                                <ChevronLeft className="w-5 h-5" /> {t("shopPage.allPosts")}
                            </Link>
                        </motion.div>

                        {/* Summary / Blockquote */}
                        {post.summary && (
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="relative text-lg md:text-xl font-medium text-slate-700 leading-relaxed pl-6 py-4 mb-10 italic"
                            >
                                {/* Gradient border */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500" />
                                <div className="bg-gradient-to-r from-emerald-50/80 to-transparent rounded-r-2xl p-4">
                                    &ldquo;{post.summary}&rdquo;
                                </div>
                            </motion.div>
                        )}

                        {/* Image Gallery with staggered animations */}
                        {hasGallery && (
                            <motion.div
                                className="mb-12"
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-50px" }}
                                variants={containerVariants}
                            >
                                <motion.div variants={itemVariants} className="flex items-center gap-2.5 mb-5">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <Images className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {t("shopPage.articleImages")} <span className="text-emerald-600 font-extrabold">({galleryImages.length})</span>
                                    </h3>
                                </motion.div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                    {galleryImages.map((img, index) => (
                                        <motion.button
                                            key={img.id}
                                            type="button"
                                            variants={itemVariants}
                                            onClick={() => openLightbox(post.image ? index + 1 : index)}
                                            className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 hover:ring-2 hover:ring-emerald-400 transition-all shadow-sm hover:shadow-xl"
                                            whileHover={{ y: -4 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <Image
                                                src={img.imageUrl}
                                                alt={img.altText || `${t("shopPage.imageLabel")} ${index + 1}`}
                                                fill
                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                                sizes="(max-width: 768px) 50vw, 33vw"
                                            />
                                            {/* Hover overlay with glassmorphism */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-4">
                                                <span className="text-white text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                    {t("shopPage.viewFullImage")}
                                                </span>
                                            </div>
                                            {/* Image number badge */}
                                            <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                                                {index + 1}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Prose Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="prose prose-slate prose-lg md:prose-xl max-w-none text-slate-800 leading-relaxed prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-emerald-600 prose-img:rounded-2xl prose-img:shadow-lg prose-strong:font-bold prose-p:leading-[1.8] prose-li:leading-[1.8] prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-3 prose-h2:mt-12 prose-h3:mt-8 prose-blockquote:border-emerald-400 prose-blockquote:bg-emerald-50/30 prose-blockquote:rounded-r-xl prose-blockquote:py-1"
                        >
                            <div className="break-words space-y-4">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {post.content}
                                </ReactMarkdown>
                            </div>
                        </motion.div>

                        {/* Social Share Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="mt-16 p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 rounded-3xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                        >
                            {/* Decorative blur */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

                            <div className="space-y-2 text-center md:text-left relative z-10">
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <Share2 className="w-5 h-5 text-emerald-600" />
                                    <h4 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                        {t("shopPage.shareTheValue")}
                                    </h4>
                                </div>
                                <p className="text-slate-600 font-medium text-sm max-w-md">
                                    {t("shopPage.shareDescription")}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 relative z-10">
                                <motion.button
                                    onClick={shareToFacebook}
                                    className="w-12 h-12 rounded-xl bg-white shadow-md text-[#1877F2] flex items-center justify-center border border-slate-100 hover:shadow-lg"
                                    whileHover={{ y: -3, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={t("shopPage.shareOnFacebook")}
                                >
                                    <Facebook className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={shareToTwitter}
                                    className="w-12 h-12 rounded-xl bg-white shadow-md text-[#1DA1F2] flex items-center justify-center border border-slate-100 hover:shadow-lg"
                                    whileHover={{ y: -3, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={t("shopPage.shareOnTwitter")}
                                >
                                    <Twitter className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={copyLink}
                                    className={`w-12 h-12 rounded-xl shadow-md flex items-center justify-center border border-slate-100 hover:shadow-lg transition-colors ${copied ? "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-200" : "bg-white text-emerald-600"}`}
                                    whileHover={{ y: -3, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={t("shopPage.copyLink")}
                                >
                                    <AnimatePresence mode="wait">
                                        {copied ? (
                                            <motion.div key="check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                                                <Check className="w-5 h-5" />
                                            </motion.div>
                                        ) : (
                                            <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                <Copy className="w-5 h-5" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </div>
                        </motion.div>
                    </article>

                    {/* Right Column: Sticky Sidebar */}
                    <aside className="w-full lg:w-4/12 xl:w-3/12 mt-12 lg:mt-0 relative">
                        <div className="sticky top-32 space-y-6">

                            {/* Return Button Desktop */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="hidden lg:block"
                            >
                                <Link href="/posts">
                                    <button className="w-full py-3.5 px-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/20 hover:shadow-emerald-600/30 flex items-center justify-center gap-3 group">
                                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t("shopPage.allPosts")}
                                    </button>
                                </Link>
                            </motion.div>

                            {/* Cover image preview with Ken Burns effect */}
                            {post.image && (
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    type="button"
                                    onClick={() => openLightbox(0)}
                                    className="w-full relative aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-slate-200 hover:ring-2 hover:ring-emerald-400 transition-all group cursor-pointer shadow-lg hover:shadow-xl"
                                >
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-[8s] ease-out group-hover:scale-110"
                                        sizes="300px"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-4">
                                        <span className="text-white text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            {t("shopPage.viewFullImage")}
                                        </span>
                                    </div>
                                </motion.button>
                            )}

                            {/* Discover More Box */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-gradient-to-b from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 text-center text-white shadow-2xl shadow-emerald-900/30 relative overflow-hidden group"
                            >
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-cyan-300/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000 delay-200" />

                                <div className="relative z-10 space-y-4">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto border border-white/30 rotate-3 group-hover:rotate-0 transition-transform">
                                        <Sparkles className="w-7 h-7 text-emerald-100" />
                                    </div>
                                    <h3 className="text-xl font-extrabold tracking-tight">
                                        {t("shopPage.curatedSpecialties")}<br />{t("shopPage.curatedSubtitle")}
                                    </h3>
                                    <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                                        {t("shopPage.curatedDescription")}
                                    </p>
                                    <Link href="/products" className="block mt-3">
                                        <motion.button
                                            className="w-full py-3.5 bg-white text-emerald-800 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-amber-400 hover:text-slate-900 transition-all shadow-lg"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {t("shopPage.shopNow")}
                                        </motion.button>
                                    </Link>
                                </div>
                            </motion.div>

                        </div>
                    </aside>
                </main>
            </div>

            {/* Scroll to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white shadow-2xl shadow-slate-900/30 flex items-center justify-center hover:bg-emerald-600 transition-colors border border-white/10"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ArrowUp className="w-5 h-5" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Lightbox Modal with Slide Transitions */}
            <AnimatePresence>
                {lightboxOpen && allImages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center"
                        onClick={closeLightbox}
                    >
                        {/* Close button */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 z-50 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors flex items-center justify-center border border-white/20"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </motion.button>

                        {/* Counter */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="absolute top-4 left-4 z-50 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-white text-sm font-bold border border-white/20"
                        >
                            {lightboxIndex + 1} / {allImages.length}
                        </motion.div>

                        {/* Thumbnail strip */}
                        {allImages.length > 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 max-w-[90vw] overflow-x-auto"
                            >
                                {allImages.map((imgSrc, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSlideDirection([idx > lightboxIndex ? 1 : -1]);
                                            setLightboxIndex(idx);
                                        }}
                                        className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ${idx === lightboxIndex
                                            ? "ring-2 ring-emerald-400 scale-110 shadow-lg shadow-emerald-400/30"
                                            : "ring-1 ring-white/20 opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <Image
                                            src={imgSrc}
                                            alt={`${t("shopPage.imageLabel")} ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="60px"
                                        />
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* Previous button */}
                        {allImages.length > 1 && (
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-4 z-50 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all flex items-center justify-center border border-white/20 hover:scale-110"
                                aria-label="Previous"
                            >
                                <ChevronLeft className="w-7 h-7" />
                            </motion.button>
                        )}

                        {/* Image with slide transition */}
                        <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                            <motion.div
                                key={lightboxIndex}
                                custom={slideDirection}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                className="relative max-w-[85vw] max-h-[75vh] w-full h-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Image
                                    src={allImages[lightboxIndex]}
                                    alt={`${t("shopPage.imageLabel")} ${lightboxIndex + 1}`}
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    sizes="85vw"
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Next button */}
                        {allImages.length > 1 && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-4 z-50 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all flex items-center justify-center border border-white/20 hover:scale-110"
                                aria-label="Next"
                            >
                                <RightArrow className="w-7 h-7" />
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
