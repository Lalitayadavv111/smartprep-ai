"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/auth";

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user && !searchParams.get("reason")) {
        router.push("/menu");
      }
    });
  }, [supabase, router, searchParams]);

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        setAuthError("Incorrect email or password.");
      } else if (msg.includes("email not confirmed")) {
        setAuthError("Please verify your email before signing in.");
      } else {
        setAuthError("Sign in failed. Please try again.");
      }
      return;
    }
    router.push("/menu");
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        .login-page-root {
          overflow: hidden;
          height: 100vh;
          margin: 0;
          padding: 0;
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
          box-shadow: 0 0 0 1000px transparent inset !important;
          -webkit-text-fill-color: white !important;
          caret-color: white;
          transition: background-color 5000s ease-in-out 0s;
        }

        .hero-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
        }
        .hero-bg::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("/Background.jpeg");
          background-size: cover;
          background-position: center 55%;
          filter: brightness(0.92) saturate(1.15);
          transform: scale(1.02);
          z-index: -2;
        }
        .hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 45% 60% at 8% 55%, rgba(140, 60, 10, 0.20) 0%, transparent 65%),
            radial-gradient(ellipse 78% 55% at 50% 50%, transparent 38%, rgba(0,0,0,0.20) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 100%);
          z-index: -1;
        }

        .page-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 360px;
          margin-top: -40px;
        }

        .brand-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 1rem;
        }
        .brand-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2px;
        }
        .brand-name-row h1 {
          font-size: 34px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
          margin: 0;
          line-height: 1;
          text-shadow: 0 2px 14px rgba(0,0,0,0.55);
        }
        .brand-tagline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-weight: 500;
          font-size: 15px;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.88);
          margin: 0;
          line-height: 1.2;
        }

        .card-heading {
          font-size: 21px;
          font-weight: 500;
          color: rgba(255,255,255,0.95);
          margin: 1.8rem 0 1rem 0;
          text-align: center;
          letter-spacing: 0.02em;
          width: 100%;
        }

        .form-card {
          background: rgba(6, 4, 2, 0.55);
          backdrop-filter: blur(4px) saturate(1.1);
          -webkit-backdrop-filter: blur(4px) saturate(1.1);
          border: 1px solid rgba(255,255,255,0.14);
          border-top-color: rgba(255,255,255,0.28);
          border-left-color: rgba(255,255,255,0.16);
          border-radius: 1.4rem;
          padding: 1.75rem 1.75rem 1.85rem;
          box-shadow:
            0 16px 48px rgba(0,0,0,0.28),
            0 0 0 1px rgba(255,255,255,0.04) inset;
          width: 100%;
        }

        .field-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(255, 255, 255, 0.82);
          font-weight: 600;
          margin-bottom: 6px;
          display: block;
        }

        .input-underline {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1.5px solid rgba(255,255,255,0.22);
          border-radius: 0;
          color: white;
          padding: 8px 0;
          outline: none;
          font-size: 15px;
          transition: border-color 0.25s;
          box-sizing: border-box;
        }
        .input-underline:focus { border-bottom-color: #FF7A42; }
        .input-underline::placeholder { color: rgba(255,255,255,0.45); }

        .input-with-icon { position: relative; }
        .input-with-icon .input-underline { padding-right: 28px; }

        .eye-btn {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.30);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          padding: 0;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.75); }

        .sign-in-btn {
          width: 100%;
          padding: 13px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.12em;
          color: white;
          border: none;
          cursor: pointer;
          background: linear-gradient(to right, #FF7A42, #FF5230);
          box-shadow: 0 6px 24px rgba(255,100,50,0.40);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          margin-top: 4px;
          position: relative;
          overflow: hidden;
        }
        .sign-in-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.5s;
        }
        .sign-in-btn:hover:not(:disabled)::after { left: 140%; }
        .sign-in-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 10px 32px rgba(255,100,50,0.55);
        }
        .sign-in-btn:active:not(:disabled) { transform: scale(0.98); }
        .sign-in-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .divider {
          border-top: 1px solid rgba(255,255,255,0.07);
          margin-top: 0.5rem;
          padding-top: 1.1rem;
        }

        .legal-text {
          text-align: center;
          font-size: 10px;
          letter-spacing: 0.02em;
          color: rgba(255,255,255,0.72);
        }
        .legal-text a {
          color: rgba(255,255,255,0.88);
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s;
        }
        .legal-text a:hover { color: rgba(255,255,255,0.90); }
      `}</style>

      <div className="hero-bg" />

      <main className="login-page-root relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-white">
        <div className="page-stack">
          <div className="brand-row">
            <div className="brand-name-row">
              <Image src="/logo.png" height={68} width={68} alt="Bansal Eats logo" style={{ width: "auto", height: "auto" }} loading="eager" priority />
              <h1>Bansal Eats</h1>
            </div>
            <p className="brand-tagline">Where Quality Meets Flavour</p>
          </div>

          <h2 className="card-heading">Sign in &amp; savour</h2>

          <section className="form-card flex flex-col">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div>
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="input-underline"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="field-label">Password</label>
                <div className="input-with-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="input-underline"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="eye-btn"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <div className="text-right -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#FF7A42] hover:text-[#ff9166] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button type="submit" disabled={isSubmitting} className="sign-in-btn">
                {isSubmitting ? "Signing in..." : "SIGN IN "}
              </button>

              {authError && (
                <p className="text-center text-sm text-red-400 -mt-1">{authError}</p>
              )}
            </form>

            <div className="divider flex flex-col gap-2.5">
              <p className="text-center text-sm">
                <span className="text-white/80">Don&apos;t have an account? </span>
                <Link
                  href="/register"
                  className="font-semibold text-[#FF7A42] hover:text-[#ff9166] transition-colors underline underline-offset-2"
                >
                  Register
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}