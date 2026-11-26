"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "@/types";

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "400844110983-q97hi24vf5s72pgvjtclpv1dg6ra6vi3.apps.googleusercontent.com";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTier = searchParams.get("tier") || "PRO";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pinCode, setPinCode] = useState("1234");
  const [tier, setTier] = useState(defaultTier);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("bastiodon_parent_token", data.token);
        localStorage.setItem("bastiodon_parent_user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.error || "Google sign-up failed");
      }
    } catch {
      setError("Failed to connect to authentication server");
    } finally {
      setLoading(false);
    }
  };

  const initGoogleAuth = () => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
      });

      const buttonContainer = document.getElementById("google-signup-btn");
      if (buttonContainer) {
        buttonContainer.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "signup_with",
          width: 320
        });
      }
    }
  };

  useEffect(() => {
    initGoogleAuth();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          pin: pinCode.trim() || "123456",
          plan: tier || "PRO"
        })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("bastiodon_parent_token", data.token);
        localStorage.setItem("bastiodon_parent_user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Unable to connect to authentication server. Please check that the server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1080px] aspect-[4/3] min-h-[640px] bg-black rounded-[36px] sm:rounded-[44px] md:rounded-[52px] p-2.5 sm:p-3.5 border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.18),0_0_100px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)] flex flex-col justify-between overflow-hidden relative">
      <div className="w-full h-full rounded-[30px] sm:rounded-[38px] md:rounded-[44px] overflow-hidden grid grid-cols-1 md:grid-cols-2 relative bg-black">
        
        <div className="relative flex flex-col justify-between p-8 sm:p-12 md:p-14 border-b md:border-b-0 md:border-r border-white/[0.08] overflow-hidden bg-black">
          <div className="absolute inset-0 pointer-events-none opacity-25">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-white/20" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/20" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-white/5 rotate-45" />
          </div>

          <div className="relative z-10 flex items-center">
            <Link href="/" className="inline-block group outline-none">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                Bastiodon
              </span>
              <span className="text-[9px] align-super text-zinc-400 ml-0.5">&reg;</span>
            </Link>
          </div>

          <div className="relative z-10 my-auto flex items-center justify-center py-12">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
              <div className="absolute top-1/2 left-0 w-12 h-1 bg-white -translate-y-1/2 rounded-full" />
              <div className="absolute top-1/2 right-0 w-12 h-1 bg-white -translate-y-1/2 rounded-full" />
              <div className="absolute left-1/2 top-0 h-12 w-1 bg-white -translate-x-1/2 rounded-full" />
              <div className="absolute left-1/2 bottom-0 h-12 w-1 bg-white -translate-x-1/2 rounded-full" />

              <div className="absolute top-[18%] left-[18%] w-10 h-1 bg-white -rotate-45 origin-center rounded-full" />
              <div className="absolute top-[18%] right-[18%] w-10 h-1 bg-white rotate-45 origin-center rounded-full" />
              <div className="absolute bottom-[18%] left-[18%] w-10 h-1 bg-white rotate-45 origin-center rounded-full" />
              <div className="absolute bottom-[18%] right-[18%] w-10 h-1 bg-white -rotate-45 origin-center rounded-full" />
            </div>
          </div>

          <div className="relative z-10 text-[10px] text-zinc-500 uppercase tracking-widest">
            &copy; Bastiodon {new Date().getFullYear()}. All rights reserved.
          </div>
        </div>

        <div className="relative flex flex-col justify-between p-8 sm:p-12 md:p-14 bg-zinc-950/80">
          <div className="flex justify-end">
            <Link
              href="/login"
              className="text-[11px] sm:text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Sign In to account
            </Link>
          </div>

          <div className="my-auto max-w-sm w-full mx-auto py-6">
            <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white mb-8">
              Sign Up
            </h1>

            {error && (
              <div className="mb-6 p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                <div className="border-b border-zinc-700 pb-2">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base text-zinc-100 outline-none placeholder:text-zinc-600 font-light"
                    placeholder="Parent name"
                  />
                </div>

                <div className="border-b border-zinc-700 pb-2">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base text-zinc-100 outline-none placeholder:text-zinc-600 font-light"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-4">
                <div className="border-b border-zinc-700 pb-2 relative">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                    Password
                  </label>
                  <div className="flex items-center justify-between">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm sm:text-base text-zinc-100 outline-none placeholder:text-zinc-600 font-light pr-6"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 bottom-2 text-zinc-500 hover:text-zinc-300 outline-none"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="border-b border-zinc-700 pb-2">
                  <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                    Master PIN (4-6 Digits)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full bg-transparent text-sm sm:text-base text-zinc-100 outline-none placeholder:text-zinc-600 font-light"
                    placeholder="1234"
                  />
                </div>
              </div>

              <div className="border-b border-zinc-700 pb-2">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                  Subscription Tier
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-200 outline-none font-light cursor-pointer"
                >
                  <option value="BASIC" className="bg-zinc-900 text-white">Basic Shield (₹199 / mo) - 1 Device</option>
                  <option value="PRO" className="bg-zinc-900 text-white">Pro Guardian (₹499 / mo) - 3 Devices</option>
                  <option value="ULTIMATE" className="bg-zinc-900 text-white">Family Ultimate (₹899 / mo) - 10 Devices</option>
                </select>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-20 h-20 rounded-full bg-white text-black font-bold text-[10px] tracking-wider uppercase flex items-center justify-center shadow-lg hover:bg-zinc-200 active:scale-95 transition-all outline-none cursor-pointer"
                >
                  {loading ? "..." : "SIGN UP"}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-zinc-800">
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-zinc-500 mb-4">
                <span className="bg-zinc-950 px-2">Or continue with</span>
              </div>
              <div id="google-signup-btn" className="flex justify-center min-h-[44px]" />
            </div>
          </div>

          <div />
        </div>

      </div>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleAuth}
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center p-3 sm:p-6 md:p-10 font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,255,255,0.06),transparent_70%)]" />
      <Suspense fallback={<div className="text-white text-sm">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
