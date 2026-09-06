"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { MenuItemCard } from "@/components/student/MenuItemCard";
import { cn } from "@/lib/utils";
import type { Category, MenuItem } from "@/lib/types/database";
import useCartStore from "@/store/cart";

const ALL = "all";

type MenuPageProps = {
  categories: Category[];
  items: MenuItem[];
};

export function MenuPage({ categories, items }: MenuPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const phrases = [
    "Search for dishes...",
    "Craving something spicy?",
    "Find your chai...",
    "What's for lunch?",
    "Something sweet today?",
  ];
  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const current = phrases[phraseIndex];

      if (!deleting) {
        charIndex++;
        setPlaceholder(current.slice(0, charIndex));
        if (charIndex === current.length) {
          deleting = true;
          timeout = setTimeout(tick, 1800);
        } else {
          timeout = setTimeout(tick, 55);
        }
      } else {
        charIndex--;
        setPlaceholder(current.slice(0, charIndex));
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          timeout = setTimeout(tick, 400);
        } else {
          timeout = setTimeout(tick, 30);
        }
      }
    }

    timeout = setTimeout(tick, 800);
    return () => clearTimeout(timeout);
  }, []);

  const addItem = useCartStore((s) => s.addItem);

  const countsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categories) {
      map.set(
        c.id,
        items.filter((i) => i.category_id === c.id).length,
      );
    }
    return map;
  }, [categories, items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === ALL || item.category_id === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  function handleAddToCart(item: MenuItem) {
    addItem(item);
    toast.success(`${item.name} added to cart`);
  }

  return (
    <div className="px-4 pt-5 pb-12 min-h-screen">

      {/* Header */}
      <motion.div
        className="mb-5"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-[#3D2B1F] flex items-center gap-2">
          <span className="inline-block w-1 h-6 rounded-full bg-[#F97316]" />
          Our Menu
        </h1>
        <p className="mt-0.5 text-[15px] font-medium tracking-[0.01em] text-[#5A3E28]">
          {items.length} dishes crafted with care
        </p>
      </motion.div>

      {/* Category pills */}
      <motion.div
        className="flex gap-2 overflow-x-auto pb-1 mb-4"
        style={{ scrollbarWidth: "none" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
      >
        <button
          onClick={() => setSelectedCategory(ALL)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 shadow-sm",
            selectedCategory === ALL
            ? "bg-[#3D2B1F] text-white"
              : "bg-[#FDF6EE] text-[#92400E] border border-[#92400E] shadow-none hover:bg-[#F5E6D3]",
          )}
        >
          All
        </button>

        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 shadow-sm",
              selectedCategory === c.id
              ? "bg-[#3D2B1F] text-white"
                : "bg-[#FDF6EE] text-[#92400E] border border-[#92400E] shadow-none hover:bg-[#F5E6D3]",
            )}
          >
            {c.name}
          </button>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div
        className="relative mb-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 }}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full px-4 py-3 pl-11 text-sm outline-none transition-all text-[#111111] placeholder:text-[#9CA3AF]"
          style={{
            background: "#FDF6EE",
            border: "1.5px solid rgba(146,64,14,0.35)",
            boxShadow: "0 2px 8px rgba(107,79,58,0.10), inset 0 1px 3px rgba(146,64,14,0.06)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#F97316";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.10)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(107,79,58,0.2)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(107,79,58,0.08)";
          }}
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#9CA3AF]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111111] transition-colors"
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* Results count when searching */}
      {searchQuery && (
        <p className="text-xs mb-4 text-[#6B4F3A]">
          {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
        </p>
      )}

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <svg
            viewBox="0 0 120 120"
            className="w-32 h-32 mb-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bowl */}
            <ellipse cx="60" cy="72" rx="38" ry="10" fill="#F5E6D3" />
            <path d="M22 62 Q22 90 60 90 Q98 90 98 62 Z" fill="#FDF6EE" stroke="#92400E" strokeWidth="2"/>
            {/* Steam lines — drooping/sad */}
            <path d="M44 52 Q40 44 44 38" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5"/>
            <path d="M60 48 Q56 40 60 34" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5"/>
            <path d="M76 52 Q72 44 76 38" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5"/>
            {/* Sad face on bowl */}
            <circle cx="50" cy="70" r="2.5" fill="#92400E"/>
            <circle cx="70" cy="70" r="2.5" fill="#92400E"/>
            <path d="M50 80 Q60 74 70 80" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>

          {searchQuery ? (
            <>
              <p className="text-base font-semibold text-[#3D2B1F] mb-1">
                No results for &quot;{searchQuery}&quot;
              </p>
              <p className="text-sm text-[#6B4F3A] mb-4">
                Try a different word or browse by category
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-5 py-2 rounded-full bg-[#F97316] text-white text-sm font-semibold"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-[#3D2B1F] mb-1">
                Nothing here right now
              </p>
              <p className="text-sm text-[#6B4F3A]">
                Try another category or check back soon
              </p>
            </>
          )}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 gap-3 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.35, ease: "easeOut" },
                },
              }}
            >
              <MenuItemCard
                item={item}
                onAddToCart={handleAddToCart}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}