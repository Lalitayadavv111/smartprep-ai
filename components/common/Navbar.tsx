"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOutIcon, ScrollTextIcon, ShoppingCartIcon, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { NavbarMobileDrawer } from "@/components/common/NavbarMobileDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { createClient } from "@/lib/supabase/client";
import useCartStore, { useCartItemCount } from "@/store/cart";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname.startsWith("/admin");
  const [email, setEmail] = useState<string | null>(null);
  const balance = useWalletBalance(isAdmin);
  const cartCount = useCartItemCount();
  const openCartDrawer = useCartStore((s) => s.openCartDrawer);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const homeHref = isAdmin ? "/admin/orders" : "/menu";
  const balanceLabel = balance !== null && !isAdmin ? formatInr(balance) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8D5C4] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">

        {/* Left — logo */}
        <div className="flex min-w-0 items-center gap-3">
          <NavbarMobileDrawer
            isAdmin={isAdmin}
            email={email}
            balanceLabel={balanceLabel}
            cartCount={cartCount}
            onOpenCart={() => openCartDrawer()}
            onSignOut={() => void handleSignOut()}
          />
          <Link href={homeHref} className="flex items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-sm font-semibold text-white">
              U
            </span>
            <span className="text-lg font-semibold text-[#F97316]">NoQ</span>
          </Link>
        </div>

        {/* Right — actions */}
        <div className="hidden items-center gap-2 md:flex">
          {isAdmin ? (
            <span className="text-sm font-medium text-muted-foreground">
              Admin Panel
            </span>
          ) : (
            <>
              {/* Wallet chip */}
              <Link
                href="/wallet"
                className="group relative flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1.5 text-sm font-medium text-[#3D2B1F] transition-all hover:bg-[#3D2B1F] hover:text-white"
              >
                <WalletIcon className="size-4 shrink-0" aria-hidden />
                <span>{balanceLabel ?? "Wallet"}</span>
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#3D2B1F] px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-0 pointer-events-none">
                  Wallet Balance
                </span>
              </Link>

              {/* Divider */}
              <div className="h-5 w-px bg-[#E8D5C4]" />

              {/* Order History */}
              <Link
                href="/history"
                aria-label="Order History"
                className="group relative flex size-9 items-center justify-center rounded-full bg-[#FFF4EC] text-[#3D2B1F] transition-all hover:bg-[#3D2B1F] hover:text-white"
              >
                <ScrollTextIcon className="size-4" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#3D2B1F] px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 pointer-events-none">
                  Order History
                </span>
              </Link>

              {/* Cart */}
              <button
                type="button"
                className="group relative flex size-9 items-center justify-center rounded-full bg-[#FFF4EC] text-[#3D2B1F] transition-all hover:bg-[#3D2B1F] hover:text-white"
                aria-label="Open cart"
                onClick={() => openCartDrawer()}
              >
                <ShoppingCartIcon className="size-4" />
                {cartCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex size-5 min-w-5 items-center justify-center rounded-full bg-[#3D2B1F] p-0 text-[10px] text-white border-2 border-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                )}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#3D2B1F] px-2 py-1 text-xs text-white opacity-0 shadow transition-opacity group-hover:opacity-100 pointer-events-none">
                  Cart
                </span>
              </button>

              {/* Divider */}
              <div className="h-5 w-px bg-[#E8D5C4]" />
            </>
          )}

          {/* Account dropdown */}
          <div
            className="relative"
            onMouseLeave={() => setProfileOpen(false)}
          >
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-full text-sm"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
              aria-haspopup="true"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#3D2B1F] text-sm font-semibold text-white ring-2 ring-[#3D2B1F]/20 transition-all hover:ring-[#3D2B1F]/50">
                {email ? email.charAt(0).toUpperCase() : "?"}
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E8D5C4] bg-white p-2 shadow-lg">
                {email && (
                  <p className="truncate px-2 py-1.5 text-xs text-muted-foreground border-b border-[#E8D5C4] mb-1">
                    {email}
                  </p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-[#FFF4EC] hover:text-[#3D2B1F]"
                  onClick={() => void handleSignOut()}
                >
                  <LogOutIcon className="size-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}