"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, Loader2, User, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/context";

interface QA {
    id: number;
    question: string;
    answer?: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        name?: string | null;
        image?: string | null;
    };
}

interface ProductQAProps {
    productSlug: string;
    productName: string;
}

export function ProductQA({ productSlug, productName }: ProductQAProps) {
    const { data: session } = useSession();
    const { t, language } = useLanguage();
    const [questions, setQuestions] = useState<QA[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);

    const fetchQuestions = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/products/${productSlug}/qa`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data || []);
            }
        } catch (err) {
            logger.error("Failed to fetch Q&A", err as Error, { productSlug });
        } finally {
            setIsLoading(false);
        }
    }, [productSlug]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!session) {
            setError(t("productQA.loginRequired"));
            return;
        }

        if (newQuestion.trim().length < 5) {
            setError(t("productQA.questionMinLength"));
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            
            const res = await fetch(`/api/products/${productSlug}/qa`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: newQuestion.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit question");
            }

            const newQA = await res.json();
            setQuestions([newQA, ...questions]);
            setNewQuestion("");
        } catch (err) {
            logger.error("Failed to submit question", err as Error, { productSlug });
            setError(err instanceof Error ? err.message : t("productQA.submitError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const displayedQuestions = showAll ? questions : questions.slice(0, 5);

    return (
        <section className="mt-16">
            <div className="flex items-center gap-3 mb-8">
                <MessageCircle className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                    {t("productQA.title")} {productName}
                </h2>
                <span className="text-sm font-medium text-slate-500">
                    ({questions.length} {t("productQA.questionCount")})
                </span>
            </div>

            {/* Ask Question Form */}
            <Card className="rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 bg-white overflow-hidden mb-8">
                <CardContent className="p-6">
                    <h3 className="font-bold text-slate-900 mb-4">{t("productQA.askQuestion")}</h3>
                    
                    {!session ? (
                        <div className="text-center py-4">
                            <p className="text-slate-500 mb-4">{t("productQA.loginRequired")}</p>
                            <a 
                                href={`/login?callbackUrl=/products/${productSlug}`}
                                className="inline-block px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:bg-primary/90 transition-colors"
                            >
                                {t("productQA.loginBtn")}
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <textarea
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder={t("productQA.questionPlaceholder")}
                                className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm"
                                maxLength={500}
                            />
                            
                            {error && (
                                <p className="text-red-500 text-sm mt-2">{error}</p>
                            )}
                            
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-xs text-slate-400">
                                    {newQuestion.length}/500 {t("productQA.charCount")}
                                </p>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || newQuestion.trim().length < 5}
                                    className="rounded-full bg-primary hover:bg-primary/90 font-bold px-6"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            {t("productQA.submitQuestion")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>

            {/* Questions List */}
            {isLoading ? (
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </div>
            ) : questions.length === 0 ? (
                <Card className="rounded-3xl border border-slate-100 bg-slate-50">
                    <CardContent className="p-8 text-center">
                        <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">{t("productQA.noQuestions")}</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {displayedQuestions.map((qa) => {
                        const isExpanded = expandedId === qa.id;
                        
                        return (
                            <Card 
                                key={qa.id} 
                                className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden"
                            >
                                <CardContent className="p-5">
                                    {/* Question */}
                                    <div 
                                        className="flex items-start gap-3 cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : qa.id)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <HelpCircle className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium text-slate-900">{qa.question}</p>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs text-slate-400">
                                                    {qa.user.name || t("productQA.defaultUser")}
                                                </p>
                                                <span className="text-slate-200">•</span>
                                                <p className="text-xs text-slate-400">
                                                    {formatDate(qa.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Answer */}
                                    {isExpanded && qa.answer && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-green-700 mb-1">{t("productQA.adminShop")}</p>
                                                    <p className="text-sm text-slate-700 leading-relaxed">{qa.answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}

                    {questions.length > 5 && !showAll && (
                        <button
                            onClick={() => setShowAll(true)}
                            className="w-full py-3 text-primary font-bold text-sm hover:underline"
                        >
                            {t("productQA.viewAll")} {questions.length} {t("productQA.questionCount")}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}
