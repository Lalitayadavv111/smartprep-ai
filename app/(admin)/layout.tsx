import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { Navbar } from "@/components/common/Navbar";
import { createClient } from "@/lib/supabase/server";

type ProfileRoleRow = { role: string };

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const row = profile as ProfileRoleRow | null;
  if (!row || row.role !== "admin") {
    redirect("/login?reason=unauthorized");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#FAFAF9]">
      <Navbar />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-r-[#92400E]/30 bg-[#FDF6EE] md:block">
          <div className="flex h-14 items-center border-b border-[#92400E]/15 px-4">
            <span className="text-lg font-bold text-[#5A3E28]">NoQ</span>
          </div>
          <AdminSidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <nav className="flex gap-2 border-b border-border bg-card px-3 py-2 md:hidden">
            <Link
              href="/admin/orders"
              className="rounded-md px-2 py-1 text-sm font-medium hover:bg-muted"
            >
              Orders Queue
            </Link>
            <Link
              href="/admin/menu"
              className="rounded-md px-2 py-1 text-sm font-medium hover:bg-muted"
            >
              Menu
            </Link>
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
