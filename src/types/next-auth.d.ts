/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: number;
            role: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: number;
        role: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: number;
        role: string;
        image?: string | null;
    }
}
