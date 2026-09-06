import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { getAdminUser, apiSuccess, apiError } from "@/lib/server-api";
import { createAdminClient } from "@/lib/supabase/server";
import { updateMenuItemSchema } from "@/lib/validations/menu";
import type { MenuItem } from "@/lib/types/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await getAdminUser();
    const { id: itemId } = await params;

    const body: unknown = await request.json();
    const parsed = updateMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid request body", 400, "VALIDATION_ERROR");
    }

    const { data: item, error } = await supabase
      .from("menu_items")
      .update(parsed.data)
      .eq("id", itemId)
      .select()
      .single();

    if (error || !item) {
      return apiError("Menu item not found", 404);
    }

    revalidatePath("/api/menu");
    revalidatePath("/(student)/menu");
    return apiSuccess({ item: item as MenuItem });
  } catch (error) {
    if (error instanceof Response) return error;
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await getAdminUser();
    const { id: itemId } = await params;
    const { data: activeOrders, error: activeOrdersError } = await supabase
      .from("orders")
      .select("id")
      .not("status", "in", "(collected,cancelled)")
      .limit(100);

    const activeOrderIds = (activeOrders ?? []).map((o) => o.id);

    let hasActiveOrders = false;
    if (activeOrderIds.length > 0) {
      const { data: match, error: matchError } = await supabase
        .from("order_items")
        .select("id")
        .eq("menu_item_id", itemId)
        .in("order_id", activeOrderIds)
        .limit(1);
      hasActiveOrders = (match?.length ?? 0) > 0;
    }

    if (hasActiveOrders) {
      const { error: disableError } = await supabase
        .from("menu_items")
        .update({ is_available: false })
        .eq("id", itemId);

      if (disableError) {
        return apiError("Failed to disable menu item", 500);
      }

      revalidatePath("/api/menu");
      revalidatePath("/(student)/menu");
      return apiSuccess({ deleted: false, disabled: true });
    }

    const adminSupabase = createAdminClient();
    const { error: deleteItemsError } = await adminSupabase
      .from("order_items")
      .delete()
      .eq("menu_item_id", itemId);

    if (deleteItemsError) {
      return apiError("Failed to remove item references", 500);
    }

    // Now safe to delete
    const { error: deleteError } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      return apiError("Failed to delete menu item", 500);
    }

    revalidatePath("/api/menu");
    revalidatePath("/(student)/menu");
    return apiSuccess({ deleted: true, disabled: false });
  } catch (error) {
    console.error("DELETE /api/admin/menu error:", error);
    if (error instanceof Response) return error;
    return apiError("Internal server error", 500);
  }
}