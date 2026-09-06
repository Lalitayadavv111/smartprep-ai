import "server-only";

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { Database, Profile } from "@/lib/types/database";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** Authenticated Supabase user from the server session; throws 401 NextResponse if missing. */
export async function getServerUser(): Promise<{
  supabase: ServerSupabaseClient;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { supabase, user };
}

/** Admin profile from session; throws 401 or 403 NextResponse if not allowed. */
export async function getAdminUser(): Promise<{
  supabase: ServerSupabaseClient;
  user: User;
  profile: Database["public"]["Tables"]["profiles"]["Row"];
}> {
  const { supabase, user } = await getServerUser();

  const { data: profileRow, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, created_at")
    .eq("id", user.id)
    .single();

  const profile = profileRow as Profile | null;

  if (error || !profile || profile.role !== "admin") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { supabase, user, profile };
}

/** Standard JSON error for API routes. */
export function apiError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, {
    status,
  });
}

/** Standard JSON success envelope for API routes. */
export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}
