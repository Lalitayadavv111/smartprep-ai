"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/lib/types/database";
import useCartStore from "@/store/cart";
import { MinusIcon, PlusIcon } from "lucide-react";

type MenuItemCardProps = {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
};

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const initial = item.name.trim().charAt(0).toUpperCase() || "?";
  const quantity = useCartStore((s) =>
    s.items.find((i) => i.id === item.id)?.quantity ?? 0
  );
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm ring-1 ring-foreground/5 transition-transform duration-200 hover:scale-105 hover:-translate-y-1 hover:shadow-md transition-all duration-200",
        !item.is_available && "opacity-50",
      )}
    >
      <div className="relative w-full h-[100px] shrink-0 flex items-center justify-center">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt=""
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[#3D2B1F] text-2xl font-semibold text-white">
            {initial}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1 p-2">
        <div>
          <h3 className="text-sm font-bold leading-snug">{item.name}</h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {item.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold text-[#F97316]">
            ₹{Math.round(item.price)}
          </span>

          {item.is_available ? (
            quantity === 0 ? (
              // Add button
              <Button
                type="button"
                size="sm"
                className="bg-[#F97316] text-white h-7 text-xs px-3"
                onClick={() => onAddToCart(item)}
              >
                Add
              </Button>
            ) : (
              // Stepper
              <div className="flex items-center gap-1 rounded-lg border border-[#3D2B1F]/20 bg-[#FFF4EC] p-0.5">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  className="flex size-6 items-center justify-center rounded-md text-[#3D2B1F] transition-colors hover:bg-[#3D2B1F] hover:text-white"
                  onClick={() =>
                    quantity === 1
                      ? removeItem(item.id)
                      : updateQuantity(item.id, quantity - 1)
                  }
                >
                  <MinusIcon className="size-3" />
                </button>
                <span className="min-w-5 text-center text-xs font-bold tabular-nums text-[#3D2B1F]">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= 10}
                  className="flex size-6 items-center justify-center rounded-md text-[#3D2B1F] transition-colors hover:bg-[#3D2B1F] hover:text-white disabled:opacity-40"
                  onClick={() => updateQuantity(item.id, quantity + 1)}
                >
                  <PlusIcon className="size-3" />
                </button>
              </div>
            )
          ) : (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Unavailable
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}