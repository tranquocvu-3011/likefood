/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { redirect } from "next/navigation";

export default async function OrderDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/profile/orders/${id}`);
}
