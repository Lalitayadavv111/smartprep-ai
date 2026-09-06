"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});
type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotFormValues) {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setServerError("Failed to send reset email. Please try again.");
      return;
    }
    setSuccess(true);
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
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
          margin-top: -80px;
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
          margin: 1rem 0 1rem 0;
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
          padding: 1.25rem 1.25rem 1.4rem;
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

        .submit-btn {
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
        .submit-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
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

        .divider {
          border-top: 1px solid rgba(255,255,255,0.07);
          margin-top: 0.5rem;
          padding-top: 1rem;
        }
      `}</style>

      <div className="hero-bg" />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-10 text-white">
        <div className="page-stack">

          <div className="brand-row">
            <div className="brand-name-row">
              <Image src="/logo.png" height={68} width={68} alt="Bansal Eats logo" style={{ width: "auto", height: "auto" }} loading="eager" priority />
              <h1>Bansal Eats</h1>
            </div>
            <p className="brand-tagline">Where Quality Meets Flavour</p>
          </div>

          <h2 className="card-heading">
            {success ? "Check your email" : "Reset your password"}
          </h2>

          <section className="form-card flex flex-col">

            {success ? (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF7A42"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
                <p className="text-sm text-white/80 leading-relaxed">
                  A password reset link has been sent to your email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
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

                <button type="submit" disabled={isSubmitting} className="submit-btn">
                  {isSubmitting ? "Sending..." : "SEND RESET LINK"}
                </button>

                {serverError && (
                  <p className="text-center text-sm text-red-400 -mt-1" role="alert">
                    {serverError}
                  </p>
                )}
              </form>
            )}

            <div className="divider">
              <p className="text-center text-sm">
                <span className="text-white/80">Remembered it? </span>
                <Link
                  href="/login"
                  className="font-semibold text-[#FF7A42] hover:text-[#ff9166] transition-colors underline underline-offset-2"
                >
                  Back to sign in
                </Link>
              </p>
            </div>

          </section>
        </div>
      </main>
    </>
  );
}