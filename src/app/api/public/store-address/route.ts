/**
 * LIKEFOOD - Public Store Address API
 * Returns the store address from system settings for client-side use.
 * Used by checkout form (pickup mode) to display dynamic store address.
 */

import { NextResponse } from "next/server";
import { getSystemSettingTrimmed } from "@/lib/system-settings";
import { STORE_ADDRESS } from "@/lib/commerce";

export async function GET() {
    try {
        const dbAddress = await getSystemSettingTrimmed("contact_address");
        const address = dbAddress || STORE_ADDRESS;
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

        return NextResponse.json({ address, mapsUrl });
    } catch {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(STORE_ADDRESS)}`;
        return NextResponse.json({ address: STORE_ADDRESS, mapsUrl });
    }
}
