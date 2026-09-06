import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

import { getAdminUser, apiSuccess, apiError } from "@/lib/server-api";
import type { Order, OrderItem, OrderStatus } from "@/lib/types/database";

const statusParamSchema = z
  .enum(["scheduled", "placed", "preparing", "ready", "collected", "cancelled"])
  .optional();

export interface AdminOrder extends Order {
  student_name: string | null;
  items: OrderItem[];
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getAdminUser();

    const rawStatus =
      request.nextUrl.searchParams.get("status") ?? undefined;

    const parsed = statusParamSchema.safeParse(rawStatus);
    if (!parsed.success) {
      return apiError("Invalid status value", 400, "INVALID_STATUS");
    }

    const statusFilter = parsed.data as OrderStatus | undefined;

    // Query 1 — fetch orders with items
    const baseQuery = supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: true });

    const { data, error } = await (statusFilter
      ? baseQuery.eq("status", statusFilter)
      : baseQuery.not("status", "in", '("collected","cancelled")'));

    if (error) {
      return apiError("Failed to fetch orders", 500);
    }

    const rows = (data ?? []) as unknown as (Order & { order_items: OrderItem[] })[];

    if (rows.length === 0) {
      return apiSuccess({ orders: [] });
    }

    // Query 2 — fetch student names for all unique student IDs
    const studentIds = [...new Set(rows.map((r) => r.student_id))];
    const adminSupabase = createAdminClient();

    const { data: profiles, error: profilesError } = await adminSupabase
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds);

    if (profilesError) {
      return apiError("Failed to fetch student profiles", 500);
    }

    const typedProfiles = (profiles ?? []) as { id: string; full_name: string }[];

    const nameMap = new Map(
      typedProfiles.map((p) => [p.id, p.full_name])
    );

    // Merge
    const orders: AdminOrder[] = rows.map(({ order_items, ...rest }) => ({
      ...rest,
      student_name: nameMap.get(rest.student_id) ?? null,
      items: order_items ?? [],
    }));

    return apiSuccess({ orders });

  } catch (error) {
    if (error instanceof Response) return error;
    return apiError("Internal server error", 500);
  }
}