import type { NextRequest } from "next/server";

import { getAdminUser, apiSuccess, apiError } from "@/lib/server-api";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await getAdminUser();

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || !ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE) {
      return apiError("Invalid file", 400, "INVALID_FILE");
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("menu-images")
      .upload(filename, await file.arrayBuffer(), { contentType: file.type });

    if (uploadError) {
      return apiError("Upload failed", 500);
    }

    const { data: urlData } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filename);

    return apiSuccess({ url: urlData.publicUrl });
  } catch (error) {
    if (error instanceof Response) return error;
    return apiError("Internal server error", 500);
  }
}
