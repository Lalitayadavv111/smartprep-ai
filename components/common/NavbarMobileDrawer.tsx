"use client";

import Link from "next/link";
import { LogOutIcon, MenuIcon, ShoppingCartIcon, UserIcon, WalletIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type NavbarMobileDrawerProps = {
  isAdmin: boolean;
  email: string | null;
  balanceLabel: string | null;
  cartCount: number;
  onOpenCart: () => void;
  onSignOut: () => void;
};

export function NavbarMobileDrawer({
  isAdmin,
  email,
  balanceLabel,
  cartCount,
  onOpenCart,
  onSignOut,
}: NavbarMobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isWalletActive = pathname === "/wallet";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <MenuIcon className="size-5" />
      </Button>
      <SheetContent
        side="left"
        className="w-[min(100%,20rem)] border-r border-[#E8D5C4] bg-[#FDF7F0] px-0 [background-image:radial-gradient(circle_at_top,_#FFF6EA_0%,_#FDF7F0_42%)]"
      >
        <SheetHeader className="px-4 pb-2 pt-[14px]">
          <SheetTitle className="flex items-center gap-2 text-[16px] font-semibold text-[#3D2A13]">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-xs font-semibold text-white">
              N
            </span>
            Menu
          </SheetTitle>
          <div className="mt-2 h-px bg-gradient-to-r from-[#C87941] to-transparent" />
        </SheetHeader>
        <div className="flex h-full flex-col gap-[10px] bg-[#FDF7F0] px-4 pb-5 pt-1">
          {isAdmin ? (
            <p className="px-4 py-[14px] text-sm font-medium text-[#6B4A38]">
              Admin Panel
            </p>
          ) : (
            <>
              <Link
                href="/wallet"
                onClick={() => setOpen(false)}
                className={`block rounded-[10px] border-[0.5px] border-[#C9A77A] bg-[#F5EDE0] p-3 transition-colors hover:bg-[#EFE3D3] ${
                  isWalletActive
                    ? "border-l-[3px] border-l-[#F97316] pl-[9px]"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <WalletIcon className="mt-0.5 size-[18px] shrink-0 text-[#3D2A13]" aria-hidden />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9A7A58]">
                        My Wallet
                      </p>
                      <p className="text-[14px] font-medium text-[#3D2A13]">Wallet</p>
                    </div>
                  </div>
                  {balanceLabel ? (
                    <span className="text-[20px] font-bold leading-none text-[#C87941]">
                      {balanceLabel}
                    </span>
                  ) : null}
                </div>
              </Link>
              <Button
                type="button"
                variant="ghost"
                className="h-auto min-h-11 justify-start gap-2 rounded-[10px] border-[0.5px] border-[#E8D5BE] bg-[#F5EDE0] p-3 text-[14px] font-medium text-[#3D2A13] hover:bg-[#EFE3D3] hover:text-[#3D2A13]"
                onClick={() => {
                  setOpen(false);
                  onOpenCart();
                }}
              >
                <ShoppingCartIcon className="size-[18px] shrink-0 text-[#3D2A13]" aria-hidden />
                Cart{cartCount > 0 ? ` (${cartCount})` : ""}
              </Button>
            </>
          )}
          {email ? (
            <p className="flex min-h-11 items-center gap-2 truncate rounded-[10px] border-[0.5px] border-[#E8D5BE] bg-[#F5EDE0] p-3 text-[12px] font-medium text-[#9A7A58]">
              <UserIcon className="size-[18px] shrink-0 text-[#9A7A58]" aria-hidden />
              <span className="truncate">{email}</span>
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-h-11 w-full justify-start gap-2 rounded-[10px] border-[0.5px] border-[#F0C4B4] bg-[#FDF0EB] p-3 text-[14px] font-medium text-[#B94A2A] hover:bg-[#F9E4DD] hover:text-[#B94A2A]"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOutIcon className="size-4 shrink-0 text-[#B94A2A]" aria-hidden />
            Sign Out
          </Button>
          <p className="mt-auto pt-1 text-center text-[11px] text-[#B8976B]">NoQ · Skip the queue</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
