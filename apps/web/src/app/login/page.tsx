"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check } from "lucide-react";
import { API_BASE_URL } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("mark.johnson@gmail.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("bastiodon_parent_token", "demo-parent-token-building-phase");
    localStorage.setItem(
      "bastiodon_parent_user",
      JSON.stringify({
        id: "demo-parent-account",
        name: "Demonstration Parent",
        email: email || "parent@bastiodon.local",
        subscriptionTier: "PRO",
        pinCode: "1234",
      })
    );
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center p-3 sm:p-6 md:p-10 font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,255,255,0.06),transparent_70%)]" />

      <div className="relative w-full max-w-[1080px] aspect-[4/3] min-h-[640px] bg-black rounded-[36px] sm:rounded-[44px] md:rounded-[52px] p-2.5 sm:p-3.5 border border-white/30 shadow-[0_0_50px_rgba(255,255,255,0.18),0_0_100px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.3)] flex flex-col justify-between overflow-hidden">
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
                href="/register"
                className="text-[11px] sm:text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Create an account
              </Link>
            </div>

            <div className="my-auto max-w-sm w-full mx-auto py-8">
              <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-white mb-10">
                Login
              </h1>

              {error && (
                <div className="mb-6 p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4">
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
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                        rememberMe
                          ? "border-white bg-white text-black"
                          : "border-zinc-600 bg-transparent"
                      }`}
                    >
                      {rememberMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>Remember me</span>
                  </label>

                  <a href="#forgot" className="hover:text-zinc-200 transition-colors">
                    Forgot?
                  </a>
                </div>

                <div className="flex justify-end pt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-16 h-16 rounded-full bg-white text-black font-bold text-[10px] tracking-wider uppercase flex items-center justify-center shadow-lg hover:bg-zinc-200 active:scale-95 transition-all outline-none cursor-pointer"
                  >
                    {loading ? "..." : "SIGN IN"}
                  </button>
                </div>
              </form>
            </div>

            <div />
          </div>

        </div>
      </div>
    </main>
  );
}
