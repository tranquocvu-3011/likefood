"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfileVouchersRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/vouchers");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
}
