import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { getAdminUser, apiSuccess, apiError } from "@/lib/server-api";
import { menuItemSchema } from "@/lib/validations/menu";
import type { MenuItem } from "@/lib/types/database";

type MenuItemInsert = {
  name: string;
  price: number;
  category_id: string;
  is_available: boolean;
  description?: string;
  image_url?: string;
};

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await getAdminUser();

    const body: unknown = await request.json();
    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Invalid request body", 400, "VALIDATION_ERROR");
    }

    const insertPayload: MenuItemInsert = parsed.data;

    const { data: item, error } = await supabase
      .from("menu_items")
      .insert(insertPayload)
      .select()
      .single();

    if (error || !item) {
      return apiError("Failed to create menu item", 500);
    }

    revalidatePath("/api/menu");
    revalidatePath("/(student)/menu");
    return apiSuccess({ item: item as MenuItem }, 201);
  } catch (error) {
    if (error instanceof Response) return error;
    return apiError("Internal server error", 500);
  }
}