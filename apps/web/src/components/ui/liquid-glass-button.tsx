"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "default" | "accent" | "outline" | "ghost" | "glass";
  size?: "sm" | "default" | "lg" | "xl";
  asChild?: boolean;
}

export const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-7 px-3 text-xs gap-1.5",
      default: "h-9 px-4 text-xs sm:text-sm gap-2",
      lg: "h-11 px-6 text-sm sm:text-base gap-2.5",
      xl: "h-14 px-8 text-base sm:text-lg gap-3",
    }[size];

    const variantClasses = {
      default:
        "bg-white/[0.08] hover:bg-white/[0.16] text-white border-white/20 hover:border-white/40 shadow-[0_4px_24px_-4px_rgba(255,255,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.35)]",
      glass:
        "bg-white/[0.06] hover:bg-white/[0.14] text-zinc-100 border-white/15 hover:border-white/30 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5),inset_0_1px_0.5px_rgba(255,255,255,0.4)]",
      accent:
        "bg-gradient-to-r from-rose-500/80 via-pink-600/80 to-purple-600/80 hover:from-rose-500 hover:via-pink-600 hover:to-purple-600 text-white border-white/30 hover:border-white/50 shadow-[0_0_24px_rgba(236,72,153,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)]",
      outline:
        "bg-transparent hover:bg-white/[0.08] text-zinc-200 border-white/20 hover:border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]",
      ghost:
        "bg-transparent hover:bg-white/[0.08] text-zinc-300 hover:text-white border-transparent",
    }[variant];

    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center select-none whitespace-nowrap rounded-full border font-medium outline-none backdrop-blur-xl transition-all duration-300",
          "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
          "focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses,
          sizeClasses,
          className
        )}
        {...props}
      >
        {/* Specular curved liquid top reflection */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-0.5 h-[40%] rounded-full bg-gradient-to-b from-white/35 via-white/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Content slot */}
        <span className="relative z-10 flex items-center gap-1.5 font-medium tracking-tight">
          {children}
        </span>
      </button>
    );
  }
);

LiquidButton.displayName = "LiquidButton";

export default LiquidButton;
