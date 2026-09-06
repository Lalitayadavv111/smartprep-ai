"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";

// ── Schema ────────────────────────────────────────────────────────────────────
const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;
type PageState = "checking" | "ready" | "invalid";

// ── Component ─────────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("checking");
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Detect recovery session — either already active or fired via email link
  useEffect(() => {
    let resolved = false;

    supabase.auth.getSession().then(({ data }) => {
      if (resolved) return;
      if (data.session) {
        resolved = true;
        setPageState("ready");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (resolved) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        resolved = true;
        setPageState("ready");
      }
    });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setPageState("invalid");
      }
    }, 2500);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm_password: "" },
  });

  async function onSubmit(values: ResetFormValues) {
    setServerError(null);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setServerError(error.message ?? "Failed to update password. Please try again.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        html, body { height: 100%; margin: 0; padding: 0; }
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

        /* ── Background ── */
        .hero-bg { position: fixed; inset: 0; z-index: 0; }
        .hero-bg::before {
          content: "";
          position: absolute; inset: 0;
          background-image: url("/Background.jpeg");
          background-size: cover;
          background-position: center 55%;
          filter: brightness(0.92) saturate(1.15);
          transform: scale(1.02);
          z-index: -2;
        }
        .hero-bg::after {
          content: "";
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 45% 60% at 8% 55%, rgba(140,60,10,0.20) 0%, transparent 65%),
            radial-gradient(ellipse 78% 55% at 50% 50%, transparent 38%, rgba(0,0,0,0.20) 100%),
            linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 100%);
          z-index: -1;
        }

        /* ── Layout ── */
        .page-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 360px;
        }

        /* ── Brand ── */
        .brand-row {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          margin-bottom: 1rem;
        }
        .brand-name-row {
          display: flex; align-items: center;
          gap: 10px; margin-bottom: 2px;
        }
        .brand-name-row h1 {
          font-size: 34px; font-weight: 700;
          color: #ffffff; letter-spacing: -0.01em;
          margin: 0; line-height: 1;
          text-shadow: 0 2px 14px rgba(0,0,0,0.55);
        }
        .brand-tagline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic; font-weight: 500;
          font-size: 15px; letter-spacing: 0.06em;
          color: rgba(255,255,255,0.88);
          margin: 0; line-height: 1.2;
        }

        /* ── Headings ── */
        .card-heading {
          font-size: 21px; font-weight: 500;
          color: rgba(255,255,255,0.95);
          margin: 1.8rem 0 0.3rem;
          text-align: center; letter-spacing: 0.02em;
          width: 100%;
        }
        .card-subheading {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          text-align: center;
          margin: 0 0 1rem;
          line-height: 1.5; width: 100%;
        }

        /* ── Glass card ── */
        .form-card {
          background: rgba(6,4,2,0.55);
          backdrop-filter: blur(4px) saturate(1.1);
          -webkit-backdrop-filter: blur(4px) saturate(1.1);
          border: 1px solid rgba(255,255,255,0.14);
          border-top-color: rgba(255,255,255,0.28);
          border-left-color: rgba(255,255,255,0.16);
          border-radius: 1.4rem;
          padding: 1.75rem 1.75rem 1.85rem;
          box-shadow:
            0 16px 48px rgba(0,0,0,0.28),
            inset 0 0 0 1px rgba(255,255,255,0.04);
          width: 100%;
        }

        /* ── Fields ── */
        .field-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(255,255,255,0.82);
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
          position: absolute; right: 0; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.30);
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center;
          transition: color 0.2s; padding: 0;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.75); }

        /* ── Submit button ── */
        .submit-btn {
          width: 100%; padding: 13px;
          border-radius: 9999px;
          font-weight: 700; font-size: 13px;
          letter-spacing: 0.12em;
          color: white; border: none; cursor: pointer;
          background: linear-gradient(to right, #FF7A42, #FF5230);
          box-shadow: 0 6px 24px rgba(255,100,50,0.40);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          margin-top: 4px;
          position: relative; overflow: hidden;
        }
        .submit-btn::after {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.5s;
        }
        .submit-btn:hover:not(:disabled)::after { left: 140%; }
        .submit-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 10px 32px rgba(255,100,50,0.55);
        }
        .submit-btn:active:not(:disabled) { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Divider / footer ── */
        .divider {
          border-top: 1px solid rgba(255,255,255,0.07);
          margin-top: 0.5rem; padding-top: 1rem;
        }
        .legal-text {
          text-align: center; font-size: 10px;
          letter-spacing: 0.02em; color: rgba(255,255,255,0.72);
        }
        .legal-text a {
          color: rgba(255,255,255,0.88);
          text-decoration: underline; text-underline-offset: 2px;
          transition: color 0.2s;
        }
        .legal-text a:hover { color: #fff; }

        /* ── State: checking (pulse dots) ── */
        .dots span {
          display: inline-block;
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.5);
          margin: 0 3px;
          animation: pulse-dot 1.2s ease-in-out infinite;
        }
        .dots span:nth-child(2) { animation-delay: 0.2s; }
        .dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }

        /* ── State: invalid ── */
        .invalid-box {
          text-align: center;
          padding: 0.5rem 0 0.25rem;
          display: flex; flex-direction: column; align-items: center; gap: 14px;
        }
        .invalid-icon {
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(255,80,48,0.15);
          border: 1.5px solid rgba(255,80,48,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
        }

        /* ── State: success ── */
        .success-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(255,122,66,0.15);
          border: 1.5px solid rgba(255,122,66,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin: 0.25rem auto 0.75rem;
        }
      `}</style>

      <div className="hero-bg" />

      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-6 pt-20 pb-20 text-white">
        <div className="page-stack">

          {/* ── Brand ── */}
          <div className="brand-row">
            <div className="brand-name-row">
              <Image src="/logo.png" height={68} width={68} alt="Bansal Eats logo" style={{ width: "auto", height: "auto" }} loading="eager" priority />
              <h1>Bansal Eats</h1>
            </div>
            <p className="brand-tagline">Where Quality Meets Flavour</p>
          </div>

          <h2 className="card-heading">Set new password</h2>
          <p className="card-subheading">Choose a strong password to secure your account.</p>

          <section className="form-card flex flex-col">

            {/* ── Checking ── */}
            {pageState === "checking" && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="dots">
                  <span /><span /><span />
                </div>
                <p className="text-sm text-white/55 tracking-wide">Verifying reset link…</p>
              </div>
            )}

            {/* ── Invalid / expired ── */}
            {pageState === "invalid" && (
              <div className="invalid-box">
                <div className="invalid-icon">✕</div>
                <p className="text-sm text-white/80 leading-relaxed">
                  This reset link is <span className="text-[#FF7A42] font-medium">invalid or expired</span>.<br />
                  Please request a new one.
                </p>
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-[#FF7A42] hover:text-[#ff9166] transition-colors underline underline-offset-2"
                >
                  Request a new reset link
                </Link>
              </div>
            )}

            {/* ── Ready ── */}
            {pageState === "ready" && (
              success ? (
                <div className="flex flex-col items-center text-center py-1 gap-2">
                  <div className="success-icon">✓</div>
                  <p className="text-white font-medium text-base">Password updated!</p>
                  <p className="text-sm text-white/65 leading-relaxed">
                    Your password has been reset successfully.<br />
                    Redirecting you to sign in…
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">

                  {/* New Password */}
                  <div>
                    <label className="field-label">New Password</label>
                    <div className="input-with-icon">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Min. 8 characters"
                        className="input-underline"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
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

                  {/* Confirm Password */}
                  <div>
                    <label className="field-label">Confirm Password</label>
                    <div className="input-with-icon">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Repeat your password"
                        className="input-underline"
                        {...register("confirm_password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="eye-btn"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-xs text-red-400 mt-1.5">{errors.confirm_password.message}</p>
                    )}
                  </div>

                  <button type="submit" disabled={isSubmitting} className="submit-btn">
                    {isSubmitting ? "Updating password..." : "RESET PASSWORD"}
                  </button>

                  {serverError && (
                    <p className="text-center text-sm text-red-400 -mt-1" role="alert">
                      {serverError}
                    </p>
                  )}
                </form>
              )
            )}

            {/* ── Footer ── */}
            {pageState !== "checking" && (
              <div className="divider flex flex-col gap-2.5">
                <p className="text-center text-sm">
                  <span className="text-white/80">Remember your password? </span>
                  <Link
                    href="/login"
                    className="font-semibold text-[#FF7A42] hover:text-[#ff9166] transition-colors underline underline-offset-2"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            )}

          </section>
        </div>
      </main>
    </>
  );
}