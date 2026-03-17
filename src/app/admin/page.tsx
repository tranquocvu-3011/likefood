import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminIndexPage() {
    const session = await getServerSession(authOptions);
    
    // If already logged in as admin, go to dashboard
    if (session?.user?.role === "ADMIN") {
        redirect("/admin/dashboard");
    }
    
    // Otherwise, go to admin login
    redirect("/admin/login");
}