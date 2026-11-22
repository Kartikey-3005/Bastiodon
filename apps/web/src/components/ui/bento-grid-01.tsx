"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BentoItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
  badge?: string;
}

export interface BentoGridProps {
  items?: BentoItem[];
  className?: string;
  badge?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export const BentoGrid = ({ items = [], className }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-5 max-w-7xl mx-auto w-full",
        className
      )}
    >
      {items.map((item, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.2 }}
          className={cn(
            "group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-hidden",
            "bg-zinc-950/80 border border-white/10 text-white backdrop-blur-xl",
            "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]",
            "hover:border-white/20 transition-all duration-300 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)]",
            item.className
          )}
        >
          {/* Subtle top-left glass wash */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_0%_0%,rgba(255,255,255,0.06),transparent_60%)] opacity-80 group-hover:opacity-100 transition-opacity"
          />

          {/* Half-lit subtle rim */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />

          {item.header && (
            <div className="relative z-10 mb-4 w-full overflow-hidden rounded-2xl">
              {item.header}
            </div>
          )}

          <div className="relative z-10 flex flex-col space-y-3 mt-auto">
            <div className="flex items-center justify-between">
              {item.icon && (
                <div className="w-11 h-11 rounded-xl bg-white/[0.08] border border-white/10 text-white flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:border-white/25 transition-all duration-200">
                  {item.icon}
                </div>
              )}
              {item.badge && (
                <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  {item.badge}
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-zinc-100 transition-colors">
              {item.title}
            </h3>

            <p className="text-sm leading-relaxed text-zinc-400">
              {item.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default function Component({
  items,
  className,
}: {
  items?: BentoItem[];
  className?: string;
}) {
  return <BentoGrid items={items} className={className} />;
}
