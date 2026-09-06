"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations/auth";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/menu");
    });
  }, [router]);

  async function onSubmit(values: RegisterFormValues) {
    setAuthError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.full_name } },
    });
    if (error) {
      setAuthError(error.message);
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
          min-height: calc(100vh - 64px);
          justify-content: center;
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
          margin: 0.8rem 0 1rem 0;
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
          padding: 0;
        }

        .sign-in-btn {
          width: 100%;
          padding: 13px;
          border-radius: 9999px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.12em;
          color: white;
          border: none;
          background: linear-gradient(to right, #FF7A42, #FF5230);
          margin-top: 4px;
        }

        .divider {
          border-top: 1px solid rgba(255,255,255,0.07);
          margin-top: 0.5rem;
          padding-top: 1rem;
        }

        .legal-text {
          text-align: center;
          font-size: 10px;
          letter-spacing: 0.02em;
          color: rgba(255,255,255,0.72);
        }
      `}</style>

      <div className="hero-bg" />

      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-6 pt-10 pb-16 text-white">
        <div className="page-stack">

          <div className="brand-row">
            <div className="brand-name-row">
              <Image src="/logo.png" height={68} width={68} alt="Bansal Eats logo" style={{ width: "auto", height: "auto" }} loading="eager" priority />
              <h1>Bansal Eats</h1>
            </div>
            <p className="brand-tagline">Where Quality Meets Flavour</p>
          </div>

          
          {!success && <h2 className="card-heading">Create your account</h2>}

          <section className="form-card flex flex-col">
            {success ? (
              // Fix #2: more breathing room around the icon
              <div className="flex flex-col items-center text-center gap-4 py-6">
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
                  Check your email to verify your account.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">

                {authError && (
                  <p className="text-sm text-red-400 text-center">{authError}</p>
                )}

                <div>
                  <label className="field-label">Full Name</label>
                  <input type="text" placeholder="Enter your full name" className="input-underline" {...register("full_name")} />
                  {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>}
                </div>

                <div>
                  <label className="field-label">Email Address</label>
                  <input type="email" placeholder="Enter your email" className="input-underline" {...register("email")} />
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="field-label">Password</label>
                  <div className="input-with-icon">
                    <input type={showPassword ? "text" : "password"} placeholder="Create a password" className="input-underline" {...register("password")} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="eye-btn">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="field-label">Confirm Password</label>
                  <div className="input-with-icon">
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" className="input-underline" {...register("confirm_password")} />
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="eye-btn">
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-xs text-red-400 mt-1">{errors.confirm_password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="sign-in-btn"
                  style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                  {isSubmitting ? "CREATING..." : "CREATE ACCOUNT"}
                </button>

              </form>
            )}

            
            <div className={`divider flex flex-col gap-2.5 ${success ? "mt-2" : ""}`}>
              <p className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-[#FF7A42] underline">
                  Sign in
                </Link>
              </p>

              <p className="legal-text">
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-2 decoration-white/60 hover:decoration-white"
                >
                  Terms & Privacy Policy
                </Link>
              </p>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}