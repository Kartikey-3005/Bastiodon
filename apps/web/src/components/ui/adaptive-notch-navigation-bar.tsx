"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface NotchItemData {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  href?: string;
}

export type NotchPosition = "top" | "bottom";

export interface NotchNavProps {
  items: NotchItemData[];
  activeId?: string;
  position?: NotchPosition;
  logo?: React.ReactNode;
  rightContent?: React.ReactNode;
  showLogo?: boolean;
  showRightContent?: boolean;
  onActiveChange?: (id: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export function NotchNav({
  items,
  activeId,
  position = "top",
  logo,
  rightContent,
  showLogo = true,
  showRightContent = true,
  onActiveChange,
  children,
  className = "",
}: NotchNavProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const isTop = position === "top";

  return (
    <header
      className={`fixed left-0 right-0 z-50 pointer-events-none flex justify-center px-4 ${
        isTop ? "top-4" : "bottom-4"
      } ${className}`}
    >
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 transition-all duration-300 max-w-full">
        {/* Left Island (Logo / Branding) */}
        {showLogo && logo && (
          <div className="flex items-center bg-zinc-900/90 hover:bg-zinc-900 text-zinc-100 border border-white/10 rounded-full px-3.5 py-1.5 shadow-2xl backdrop-blur-xl transition-all duration-200">
            {logo}
          </div>
        )}

        {/* Center Island (Notch Navigation Items) */}
        <nav
          aria-label="Main Navigation"
          className="flex items-center bg-zinc-950/90 text-zinc-300 border border-white/10 rounded-full p-1.5 shadow-2xl backdrop-blur-xl transition-all duration-200 gap-1"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            const isHovered = hoveredId === item.id;

            const content = (
              <>
                {/* Specular top curved liquid reflection highlight */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-2 top-0.5 h-[40%] rounded-full bg-gradient-to-b from-white/30 via-white/10 to-transparent transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-75"
                  }`}
                />

                <span className="flex items-center gap-1.5 relative z-10">
                  {Icon && (
                    <Icon
                      className={`size-4 transition-transform duration-200 ${
                        isActive ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    />
                  )}
                  <span className="font-medium tracking-tight whitespace-nowrap text-xs sm:text-sm">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-secondary text-white leading-none">
                      {item.badge}
                    </span>
                  )}
                </span>
              </>
            );

            const itemClass = `group relative cursor-pointer px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-300 flex items-center select-none outline-none overflow-hidden ${
              isActive
                ? "text-white bg-white/[0.14] border border-white/25 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-xl"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-white/15 border border-transparent backdrop-blur-lg"
            }`;

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => onActiveChange?.(item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={itemClass}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onActiveChange?.(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={itemClass}
              >
                {content}
              </button>
            );
          })}
        </nav>

        {/* Right Island (Actions / Sign In / User Profile) */}
        {showRightContent && rightContent && (
          <div className="flex items-center bg-zinc-900/90 text-zinc-100 border border-white/10 rounded-full px-3 sm:px-3.5 py-1.5 shadow-2xl backdrop-blur-xl transition-all duration-200">
            {rightContent}
          </div>
        )}
      </div>

      {children && (
        <div className="absolute top-full mt-4 pointer-events-auto">
          {children}
        </div>
      )}
    </header>
  );
}

export default NotchNav;
