"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  title?: string;
  subtitle?: string;
  categories: Record<string, string>;
  faqData: Record<string, FAQItem[]>;
  className?: string;
}

export function FAQ({
  title = "Frequently Asked Questions",
  subtitle = "Let's answer some questions",
  categories,
  faqData,
  className,
}: FAQProps) {
  const categoryKeys = Object.keys(categories);
  const [activeTab, setActiveTab] = useState<string>(categoryKeys[0] || "");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const currentQuestions = faqData[activeTab] || [];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setOpenIndex(0);
  };

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={cn("w-full py-16 px-4 sm:px-6 max-w-5xl mx-auto", className)}>
      <div className="text-center space-y-3 mb-12">
        {subtitle && (
          <span className="text-xs font-bold uppercase tracking-widest text-secondary">
            {subtitle}
          </span>
        )}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
          {title}
        </h2>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {categoryKeys.map((key) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={cn(
                "relative cursor-pointer px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 outline-none select-none",
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFaqTab"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-white/[0.12] border border-white/20 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.35)] backdrop-blur-xl"
                />
              )}
              <span className="relative z-10">{categories[key]}</span>
            </button>
          );
        })}
      </div>

      {/* Animated Accordion List */}
      <div className="space-y-3.5 max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-3.5"
          >
            {currentQuestions.map((item, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={idx}
                  className={cn(
                    "rounded-2xl border transition-all duration-300 overflow-hidden",
                    "bg-zinc-950/70 backdrop-blur-xl",
                    isOpen
                      ? "border-white/25 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "border-white/10 hover:border-white/20"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleQuestion(idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-white transition-colors text-sm sm:text-base cursor-pointer outline-none"
                  >
                    <span>{item.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 text-zinc-400"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1 text-sm sm:text-[15px] text-zinc-400 leading-relaxed border-t border-white/[0.06]">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export default FAQ;
