/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import type { Metadata } from "next";
import AuthLayoutClient from "./AuthLayoutClient";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
