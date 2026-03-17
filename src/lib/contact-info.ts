/**
 * LIKEFOOD - Server-side contact info helper
 * Reads contact info from systemsetting table for use in Server Components
 * (policies pages, structured data, etc.)
 */

import prisma from "@/lib/prisma";

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
}

const DEFAULTS: ContactInfo = {
  email: "tranquocvu3011@gmail.com",
  phone: "+1 402-315-8105",
  address: "Omaha, NE 68136, United States",
};

let cachedInfo: ContactInfo | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Get contact info from the systemsetting table (server-side only).
 * Falls back to defaults if database is unavailable.
 * Cached for 1 minute to reduce DB queries on static pages.
 */
export async function getContactInfo(): Promise<ContactInfo> {
  const now = Date.now();
  if (cachedInfo && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedInfo;
  }

  try {
    const settings = await prisma.systemsetting.findMany({
      where: {
        key: { in: ["contact_email", "contact_phone", "contact_address"] },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    cachedInfo = {
      email: map.contact_email || DEFAULTS.email,
      phone: map.contact_phone || DEFAULTS.phone,
      address: map.contact_address || DEFAULTS.address,
    };
    cacheTimestamp = now;
    return cachedInfo;
  } catch {
    return DEFAULTS;
  }
}
