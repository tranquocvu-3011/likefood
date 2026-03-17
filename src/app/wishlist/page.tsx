/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function WishlistRedirectPage() {
    redirect("/profile/wishlist");
}
