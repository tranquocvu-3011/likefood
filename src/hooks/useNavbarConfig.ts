/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 */

"use client";

import { useState, useEffect } from "react";

type NavItem = {
    label: string;
    href: string;
    icon?: string;
    highlight?: boolean;
};

interface NavbarConfig {
    supportPhone: string | null;
    navLinks: NavItem[] | null;
}

export function useNavbarConfig(): NavbarConfig {
    const [supportPhone, setSupportPhone] = useState<string | null>(null);
    const [navLinks, setNavLinks] = useState<NavItem[] | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const { getPublicSettings } = await import("@/lib/public-settings");
                const data = await getPublicSettings();

                if (data.SITE_SUPPORT_PHONE) setSupportPhone(data.SITE_SUPPORT_PHONE);

                if (data.NAV_PRIMARY_LINKS) {
                    try {
                        const parsed = JSON.parse(data.NAV_PRIMARY_LINKS) as NavItem[];
                        if (Array.isArray(parsed) && parsed.length > 0) setNavLinks(parsed);
                    } catch {
                        // invalid JSON → keep null → render default links
                    }
                }
            } catch {
                // silently fallback
            }
        };
        load();
    }, []);

    return { supportPhone, navLinks };
}
