import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
  supabase: ReturnType<typeof createServerClient>;
}> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user, supabase };
}

function copyCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie;
    to.cookies.set(name, value, options);
  });
}

function isStudentProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/menu") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/order") ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/dashboard")
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

function isAuthCallbackPath(pathname: string): boolean {
  return pathname.startsWith("/auth/callback");
}

export async function middleware(request: NextRequest) {
  const { response: sessionResponse, user, supabase } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (isAuthCallbackPath(pathname)) {
    return sessionResponse;
  }

  const needsSession =
    isStudentProtectedPath(pathname) || isAdminPath(pathname);

  if (needsSession && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(sessionResponse, redirectResponse);
    return redirectResponse;
  }

  // Role-based routing
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Admin on root or student routes → redirect to admin orders
    if (role === "admin" && (pathname === "/" || isStudentProtectedPath(pathname))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/orders";
      url.search = "";
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(sessionResponse, redirectResponse);
      return redirectResponse;
    }

    // Student on admin routes → redirect to menu
    // if (role === "student" && isAdminPath(pathname)) {
    //   const url = request.nextUrl.clone();
    //   url.pathname = "/menu";
    //   url.search = "";
    //   const redirectResponse = NextResponse.redirect(url);
    //   copyCookies(sessionResponse, redirectResponse);
    //   return redirectResponse;
    // }

    // Admin on login/register → redirect to admin orders
    if (role === "admin" && isAuthPage(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/orders";
      url.search = "";
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(sessionResponse, redirectResponse);
      return redirectResponse;
    }
  }

  if (isAuthPage(pathname) && user && !request.nextUrl.searchParams.get('reason')) {
    const url = request.nextUrl.clone();
    url.pathname = "/menu";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(sessionResponse, redirectResponse);
    return redirectResponse;
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};