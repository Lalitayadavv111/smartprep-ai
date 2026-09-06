import { apiError, apiSuccess } from "@/lib/server-api";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

/** Public menu listing (categories + all items, including unavailable). */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });

    const { data: items, error: itemsError } = await supabase
      .from("menu_items")
      .select("id, name, description, price, category_id, image_url, is_available")
      .order("name", { ascending: true });

    if (categoriesError || itemsError) {
      return apiError("Failed to fetch menu", 500);
    }

    return apiSuccess({
      categories: categories ?? [],
      items: items ?? [],
    });
  } catch {
    return apiError("Failed to fetch menu", 500);
  }
}
