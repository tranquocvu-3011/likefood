/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import ChatbotAI from "@/components/shared/ChatbotAI";
import ContactLauncher from "@/components/shared/ContactLauncher";
import MobileBottomNav from "@/components/navbar/MobileBottomNav";
import IdleSessionWrapper from "@/components/auth/IdleSessionWrapper";
import { AbandonedCartTracker } from "@/components/cart/AbandonedCartTracker";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AnalyticsProvider>
            <div className="compact-ui flex flex-col min-h-screen">
                <header>
                    <Navbar />
                </header>
                <main id="main-content" className="flex-1 pb-16 lg:pb-0">
                    <IdleSessionWrapper>
                        {children}
                    </IdleSessionWrapper>
                </main>
                <Footer />
                <ChatbotAI />
                <ContactLauncher />
                <MobileBottomNav />
                <AbandonedCartTracker />
            </div>
        </AnalyticsProvider>
    );
}
