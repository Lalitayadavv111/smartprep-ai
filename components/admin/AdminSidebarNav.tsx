"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebarNav() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/orders", label: "Orders Queue" },
    { href: "/admin/menu", label: "Menu Management" },
  ];

  return (
    <nav className="flex flex-col gap-1 p-3">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg border-l-[3px] px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-l-[#C87941] bg-[#F5E6D3] text-[#5A3E28]"
                : "border-l-transparent text-[#3D2B1F] hover:bg-[#F5E6D3]/80 hover:text-[#7A4A1E]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
