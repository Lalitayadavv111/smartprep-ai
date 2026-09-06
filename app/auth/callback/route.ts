import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const validOtpTypes = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const;

type OtpType = (typeof validOtpTypes)[number];

function isOtpType(value: string): value is OtpType {
  return validOtpTypes.includes(value as OtpType);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const failRedirect = NextResponse.redirect(
    new URL("/login?error=callback_failed", url.origin)
  );

  const supabase = await createClient();

  if (token_hash && type && isOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL("/menu", url.origin));
    }

    return failRedirect;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL("/menu", url.origin));
    }
  }

  return failRedirect;
}