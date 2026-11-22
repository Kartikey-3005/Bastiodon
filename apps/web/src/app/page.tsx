"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  Tv,
  MessageSquareWarning,
  Download,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CreditCard,
  Compass,
  UserCheck,
  Command,
  LogIn
} from "lucide-react";
import { API_BASE_URL, Plan } from "@/types";
import { SliderRevolutionHero } from "@/components/ui/cymatic-particle-hero";
import { NotchNav, NotchItemData } from "@/components/ui/adaptive-notch-navigation-bar";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { PricingSection, PricingPlan } from "@/components/ui/pricing-section";
import Component, { BentoGrid, BentoItem } from "@/components/ui/bento-grid-01";
import { FAQ } from "@/components/ui/faq-tabs";
import { ShieldCheck, Laptop, LockKey, ChatCircleDots, UserSwitch } from "@phosphor-icons/react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>("how-it-works");
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: "1",
      name: "Basic Shield",
      tier: "BASIC",
      priceInr: 199,
      maxDevices: 1,
      popular: false,
      features: [
        "Protects 1 child laptop or browser",
        "Blocks adult and pornography websites automatically",
        "Shows visited websites in real time",
        "Sends daily browsing summaries every night",
        "Protected with your secret Parent PIN"
      ]
    },
    {
      id: "2",
      name: "Pro Guardian",
      tier: "PRO",
      priceInr: 499,
      maxDevices: 3,
      popular: true,
      features: [
        "Protects up to 3 child laptops or computers",
        "Includes everything in Basic Shield",
        "Alerts you to unsafe words in Roblox and browser chats",
        "Turn off YouTube, Netflix, Hotstar, and games during study hours",
        "Stops children from using Incognito mode to bypass rules",
        "Instant warning notifications for blocked attempts"
      ]
    },
    {
      id: "3",
      name: "Family Ultimate",
      tier: "ULTIMATE",
      priceInr: 899,
      maxDevices: 10,
      popular: false,
      features: [
        "Protects up to 10 family laptops and school computers",
        "Includes everything in Pro Guardian",
        "Add your own custom blocked websites and keywords",
        "Download Windows lock files to disable Incognito across the PC",
        "Priority phone and email assistance whenever you need help",
        "Full history of all daily reports kept permanently"
      ]
    }
  ]);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/plans`)
      .then((res) => res.json())
      .then((data) => {
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(() => { });
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const NAV_ITEMS: NotchItemData[] = [
    { id: "how-it-works", label: "How It Works", icon: Compass, href: "#how-it-works" },
    { id: "pricing", label: "Pricing", icon: CreditCard, href: "#pricing" },
    { id: "faq", label: "FAQ", icon: HelpCircle, href: "#faq" }
  ];

  const LogoSlot = (
    <Link href="/" className="flex items-center gap-1.5 sm:gap-2 h-7 sm:h-8 outline-none">
      <div className="flex size-6 sm:size-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100">
        <Command className="size-3.5 sm:size-4" />
      </div>
    </Link>
  );

  const RightContentSlot = (
    <div className="flex items-center gap-2">
      <Link href="/login" tabIndex={-1}>
        <LiquidButton
          variant="glass"
          size="sm"
          className="h-8 px-3.5 text-xs text-zinc-200 hover:text-white"
        >
          <span>Sign in</span>
          <LogIn className="size-3.5 ml-0.5 text-zinc-400 group-hover:text-white transition-colors" />
        </LiquidButton>
      </Link>
      <Link href="/register" className="hidden sm:inline-block" tabIndex={-1}>
        <LiquidButton
          variant="glass"
          size="sm"
          className="h-8 px-4 text-xs font-semibold text-zinc-200 hover:text-white"
        >
          Get Started
        </LiquidButton>
      </Link>
    </div>
  );

  const pricingPlans: PricingPlan[] = plans.map((p) => {
    const isPro = p.tier === "PRO" || p.popular;
    const isUltimate = p.tier === "ULTIMATE";
    const monthlyPrice = p.priceInr;
    const annualPrice = Math.round(monthlyPrice * 0.8);

    const iconMap: Record<string, React.ReactNode> = {
      "laptop": <Laptop weight="fill" />,
      "block": <LockKey weight="fill" />,
      "realtime": <ShieldCheck weight="fill" />,
      "summary": <ChatCircleDots weight="fill" />,
      "pin": <UserSwitch weight="fill" />,
    };

    return {
      id: p.tier.toLowerCase(),
      name: p.name,
      description:
        p.maxDevices === 1
          ? "Ideal for safeguarding 1 child laptop or school computer."
          : `Comprehensive cyber protection for up to ${p.maxDevices} devices.`,
      price: { monthly: monthlyPrice, annually: annualPrice },
      accent: "#a1a1aa",
      glow: isPro ? 0.9 : 0.6,
      featured: isPro,
      badge: isPro ? "Popular" : undefined,
      cta: {
        label: `Get Started with ${p.name}`,
        href: `/register?tier=${p.tier}`,
      },
      features: p.features.map((f, i) => {
        let icon: React.ReactNode = <ShieldCheck weight="fill" />;
        const fl = f.toLowerCase();
        if (fl.includes("laptop") || fl.includes("device")) icon = <Laptop weight="fill" />;
        else if (fl.includes("block") || fl.includes("incognito")) icon = <LockKey weight="fill" />;
        else if (fl.includes("chat") || fl.includes("alert")) icon = <ChatCircleDots weight="fill" />;
        else if (fl.includes("pin") || fl.includes("parent")) icon = <UserSwitch weight="fill" />;

        return {
          label: f,
          icon,
        };
      }),
    };
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <NotchNav
        items={NAV_ITEMS}
        activeId={activeTab}
        position="top"
        logo={LogoSlot}
        rightContent={RightContentSlot}
        showLogo={true}
        showRightContent={true}
        onActiveChange={(id) => setActiveTab(id)}
      />

      <section className="relative w-full overflow-hidden bg-black">
        <SliderRevolutionHero embedKey="ek_biqgfhte6l7dhaya3qyw" />
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto w-full bg-black">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Parental Peace of Mind
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Everything parents need for peace of mind
          </h2>
          <p className="text-[16px] text-zinc-400">
            Designed specifically for school computers and family laptops so your child stays focused on homework without opening unsafe websites.
          </p>
        </div>

        <BentoGrid
          items={[
            {
              title: "Block Adult & Streaming Sites",
              description:
                "Automatically blocks adult websites and lets you turn off YouTube, Netflix, Prime Video, Hotstar, and JioCinema during study hours with one switch.",
              icon: <ShieldAlert className="w-6 h-6 text-zinc-300" />,
              badge: "Auto-Protection",
              className: "md:col-span-2",
            },
            {
              title: "Live Search & Game Chat Alerts",
              description:
                "Checks search bars and browser game chats (like Roblox or Discord web) in real time and alerts you if unsafe messages or inappropriate words appear.",
              icon: <Eye className="w-6 h-6 text-zinc-300" />,
              badge: "Real-time AI",
              className: "md:col-span-1",
            },
            {
              title: "Incognito Lock & Parent PIN",
              description:
                "Stops kids from hiding their browsing in Incognito mode. Any change to the extension requires your 6-digit Parent PIN.",
              icon: <Lock className="w-6 h-6 text-zinc-300" />,
              badge: "Tamper Proof",
              className: "md:col-span-3",
            },
          ]}
        />
      </section>

      <section id="how-it-works" className="py-24 px-6 bg-black border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Simple 3-Minute Setup
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
              How It Works in 3 Minutes
            </h2>
            <p className="text-[16px] text-zinc-400">
              You do not need any technical knowledge. Connect your child&apos;s laptop and start safeguarding their internet in three easy steps.
            </p>
          </div>

          <BentoGrid
            items={[
              {
                title: "1. Create Your Parent Account",
                description:
                  "Sign up, choose a plan, and get a 6-digit pairing code for your child's laptop from your personal dashboard.",
                icon: <span className="font-bold text-lg text-white">01</span>,
                badge: "Step 1",
                className: "md:col-span-1",
              },
              {
                title: "2. Add the Browser Extension",
                description:
                  "Install the extension on Chrome, Edge, or Brave, enter your pairing code, and lock Incognito mode with your Parent PIN.",
                icon: <span className="font-bold text-lg text-white">02</span>,
                badge: "Step 2",
                className: "md:col-span-1",
              },
              {
                title: "3. Check Live Activity & Nightly Reports",
                description:
                  "See blocked sites and chat alerts as they happen, plus a full summary of the day's screen time every night.",
                icon: <span className="font-bold text-lg text-white">03</span>,
                badge: "Step 3",
                className: "md:col-span-1",
              },
            ]}
          />
        </div>
      </section>

      <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full bg-black">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Complete Family Protection
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            What Bastiodon Monitors & Blocks
          </h2>
          <p className="text-[16px] text-zinc-400">
            Clear, transparent protection built to stop online risks before they reach your child.
          </p>
        </div>

        <BentoGrid
          items={[
            {
              title: "Adult & Unsafe Websites",
              description:
                "Blocks thousands of explicit, gambling, and harmful sites automatically before they load on the screen.",
              icon: <ShieldAlert className="w-6 h-6 text-zinc-300" />,
              badge: "Web Safety",
              className: "md:col-span-2",
            },
            {
              title: "Entertainment & Streaming",
              description:
                "Toggle access to YouTube, Netflix, Prime Video, Hotstar, and browser gaming sites whenever you want with a single click.",
              icon: <Tv className="w-6 h-6 text-zinc-300" />,
              badge: "Focus Mode",
              className: "md:col-span-1",
            },
            {
              title: "In-Game & Web Messages",
              description:
                "Watches web-based game chats and search queries for bullying, self-harm terms, or strangers asking personal questions.",
              icon: <MessageSquareWarning className="w-6 h-6 text-zinc-300" />,
              badge: "Cyberbullying Alert",
              className: "md:col-span-1",
            },
            {
              title: "Incognito & Tamper Attempts",
              description:
                "Prevents private browsing windows and notifies you if someone tries to disable or remove the extension without your PIN.",
              icon: <Lock className="w-6 h-6 text-zinc-300" />,
              badge: "Tamper Lock",
              className: "md:col-span-2",
            },
          ]}
        />
      </section>

      {/* Animated Glowing Pricing Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full bg-black">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Real Life Protection
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Everyday Moments Parents Know Too Well
          </h2>
          <p className="text-[16px] text-zinc-400">
            Common situations every parent faces, handled simply and quietly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2">Homework time vs. YouTube & games</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              Kids say they are opening YouTube or a game site for &quot;just 5 minutes&quot;—and an hour is gone. Turn entertainment off during study hours with one click.
            </p>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2">Sneaky private tabs</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              If a child opens an Incognito window to hide what they are doing, they hit a wall unless you unlock it.
            </p>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2">Strangers in online games</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              Kids chat with strangers inside browser games all the time. Get a heads-up if someone asks where they live, asks for their number, or uses risky words.
            </p>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2">No need to stare at a screen all day</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              Check in live whenever you want, or just read the evening summary after dinner to see how the day went.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto w-full bg-black border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Built-In Safety
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Why Kids Can&apos;t Just Turn It Off
          </h2>
          <p className="text-[16px] text-zinc-400">
            Protection that stays in place even when curious fingers try to test the boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-3">Your 6-digit PIN is the key</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              Your child cannot turn off protection, change your rules, or remove the setup without your 6-digit PIN.
            </p>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-3">Works as soon as the laptop wakes up</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              As soon as the browser opens, protection is already running in the background.
            </p>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-3">Offline doesn&apos;t mean invisible</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              Even if the internet drops or the laptop goes to sleep, the extension keeps track and sends the full day&apos;s report once it reconnects.
            </p>
          </div>
        </div>
      </section>

      <PricingSection
        id="pricing"
        badge="Family Pricing"
        title="Plans and Pricing"
        description="Choose the tier tailored to your family. Protect school laptops, block unsafe sites, and keep your child focused on learning."
        plans={pricingPlans}
        currency="₹"
        periodLabel="/month"
        annualDiscountLabel="-20% OFF"
        footnote="Start your family protection risk-free — UPI, Cards & Net Banking supported. Cancel anytime."
      />

      <section className="py-20 px-6 max-w-7xl mx-auto w-full bg-black border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Simple Plan Guide
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Which Plan Fits Your Home?
          </h2>
          <p className="text-[16px] text-zinc-400">
            A quick, clear breakdown to help you pick the right plan for your family.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Basic Shield</h3>
              <p className="text-sm font-semibold text-zinc-400 mb-4">₹199/month</p>
              <p className="text-[15px] text-zinc-400 leading-relaxed">
                Best if you just want adult sites blocked, a simple end-of-day summary, and basic peace of mind for one laptop.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/register?tier=BASIC" className="block w-full outline-none" tabIndex={-1}>
                <LiquidButton variant="glass" size="default" className="w-full h-10 text-xs sm:text-sm font-semibold text-zinc-100 hover:text-white">
                  Choose Basic Shield
                </LiquidButton>
              </Link>
            </div>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Pro Guardian</h3>
              <p className="text-sm font-semibold text-zinc-400 mb-4">₹499/month</p>
              <p className="text-[15px] text-zinc-400 leading-relaxed">
                Great for families who want live chat and search alerts, streaming and game controls, and protection across up to 3 devices.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/register?tier=PRO" className="block w-full outline-none" tabIndex={-1}>
                <LiquidButton variant="glass" size="default" className="w-full h-10 text-xs sm:text-sm font-semibold text-zinc-100 hover:text-white">
                  Choose Pro Guardian
                </LiquidButton>
              </Link>
            </div>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Family Ultimate</h3>
              <p className="text-sm font-semibold text-zinc-400 mb-4">₹899/month</p>
              <p className="text-[15px] text-zinc-400 leading-relaxed">
                Built for bigger households or stricter rules, with up to 10 devices, custom blocked websites, and full Incognito lock help.
              </p>
            </div>
            <div className="pt-6">
              <Link href="/register?tier=ULTIMATE" className="block w-full outline-none" tabIndex={-1}>
                <LiquidButton variant="glass" size="default" className="w-full h-10 text-xs sm:text-sm font-semibold text-zinc-100 hover:text-white">
                  Choose Family Ultimate
                </LiquidButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto w-full bg-black border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Parent Stories
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            What Other Parents Say
          </h2>
          <p className="text-[16px] text-zinc-400">
            Real feedback from parents using Bastiodon at home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-950/80 p-8 sm:p-10 rounded-3xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <p className="text-[16px] text-zinc-300 leading-relaxed italic">
              &quot;I used to ask three times if my son was actually studying. Now I just turn off video and game sites during his study hours and check the evening report.&quot;
            </p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="font-bold text-white">Ritu S.</p>
              <p className="text-xs text-zinc-400">Mother of a 12-year-old</p>
            </div>
          </div>

          <div className="bg-zinc-950/80 p-8 sm:p-10 rounded-3xl border border-white/10 backdrop-blur-xl flex flex-col justify-between">
            <p className="text-[16px] text-zinc-300 leading-relaxed italic">
              &quot;What I liked most is the PIN lock. My kid tried opening a private window the first evening and couldn&apos;t get past it.&quot;
            </p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="font-bold text-white">Manoj K.</p>
              <p className="text-xs text-zinc-400">Father of two</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-7xl mx-auto w-full bg-black border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Straightforward Answers
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
            Quick Answers for Parents
          </h2>
          <p className="text-[16px] text-zinc-400">
            Simple answers to the questions parents ask most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2">Will this slow down my child&apos;s laptop?</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              No. It runs quietly in the browser without making pages feel heavy.
            </p>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2">Can I change rules later?</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              Yes. You can block or allow websites anytime in a couple of clicks.
            </p>
          </div>

          <div className="bg-zinc-950/80 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-bold text-white mb-2">What happens at the end of the day?</h3>
            <p className="text-[15px] text-zinc-400 leading-relaxed">
              You get a clear wrap-up of time spent online, top sites visited, and anything that got blocked or flagged.
            </p>
          </div>
        </div>
      </section>

      <section id="setup-guide" className="py-20 px-6 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="bg-zinc-950/80 p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Quick Setup Strip</span>
                <h3 className="text-2xl font-bold text-white mt-1">Enabling Incognito Lock in Chrome or Edge</h3>
                <p className="text-[15px] text-zinc-400 mt-1">
                  Ensure full protection so your child cannot browse around the safety filters in private windows.
                </p>
              </div>
              <a
                href={`${API_BASE_URL}/api/tools/download-incognito-reg`}
                download
                tabIndex={-1}
              >
                <LiquidButton
                  variant="glass"
                  size="default"
                  className="font-semibold text-sm shadow-sm text-zinc-100 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Download Windows Lock File
                </LiquidButton>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Step 1</span>
                <h4 className="text-base font-bold text-white">Open Extension Details</h4>
                <p className="text-[14px] text-zinc-400 leading-relaxed">
                  Go to <code className="bg-white/10 px-2 py-0.5 rounded text-zinc-200 text-xs font-mono">chrome://extensions</code> or right-click the Bastiodon icon and select &quot;Manage Extension&quot;.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Step 2</span>
                <h4 className="text-base font-bold text-white">Turn On &quot;Allow in Incognito&quot;</h4>
                <p className="text-[14px] text-zinc-400 leading-relaxed">
                  Toggle on the switch for &quot;Allow in Incognito&quot; so Bastiodon can monitor and block private browsing tabs automatically.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Step 3 (Optional)</span>
                <h4 className="text-base font-bold text-white">Run Windows Registry Lock</h4>
                <p className="text-[14px] text-zinc-400 leading-relaxed">
                  Double-click the downloaded Windows lock file to disable Incognito mode system-wide across all browsers on the computer.
                </p>
              </div>
            </div>
          </div>

          <div id="faq" className="pt-8">
            <FAQ
              title="Frequently Asked Questions"
              subtitle="Let's answer some questions"
              categories={{
                "general": "General & Setup",
                "security": "Security & PIN",
                "browsing": "Monitoring & Reports",
                "billing": "Plans & Billing",
              }}
              faqData={{
                "general": [
                  {
                    question: "How do I pair my child's computer?",
                    answer: "Install the Bastiodon Chrome or Edge extension on your child's laptop, open the extension, and enter the 6-digit pairing code shown in your parent dashboard.",
                  },
                  {
                    question: "Does Bastiodon work on all browsers?",
                    answer: "Yes, Bastiodon supports Google Chrome, Microsoft Edge, and Brave browsers across Windows, macOS, and Chromebooks.",
                  },
                  {
                    question: "How long does setup take?",
                    answer: "The entire setup takes under 3 minutes. No technical skills or network router configurations are required.",
                  },
                ],
                "security": [
                  {
                    question: "Can my child remove or turn off the extension?",
                    answer: "No. Changing settings, pausing protection, or unpairing the laptop requires your secret 6-digit Parent PIN. Without this PIN, the extension cannot be turned off or removed.",
                  },
                  {
                    question: "What happens if my child opens an Incognito window?",
                    answer: "If Incognito permission is enabled, the window is instantly closed or redirected to a restricted warning screen until you unlock it with your Parent PIN.",
                  },
                  {
                    question: "What if the laptop goes offline during the day?",
                    answer: "The extension continues to enforce website blocking and saves all browsing records locally on the computer. As soon as the laptop reconnects to Wi-Fi, the complete day's report is sent to your dashboard.",
                  },
                ],
                "browsing": [
                  {
                    question: "How do daily reports work?",
                    answer: "Every night at 11:55 PM, our system creates a clean summary showing total screen time, top websites visited, and any blocked attempts or flagged chat messages so you can review the day.",
                  },
                  {
                    question: "Can I customize blocked websites?",
                    answer: "Yes! In your parent dashboard, you can add custom domain URLs and keywords to block or whitelist instantly across all paired devices.",
                  },
                  {
                    question: "How does game chat monitoring work?",
                    answer: "Our real-time scanner checks web-based game chats (like Roblox web or Discord) and alerts you immediately if inappropriate keywords, bullying, or stranger danger cues are detected.",
                  },
                ],
                "billing": [
                  {
                    question: "What payment methods are supported?",
                    answer: "We support UPI (Google Pay, PhonePe, Paytm), credit/debit cards, and Net Banking.",
                  },
                  {
                    question: "Can I cancel my subscription anytime?",
                    answer: "Yes, you can cancel or switch your plan at any time directly from your parent account settings without any cancellation fees.",
                  },
                  {
                    question: "Is there a money-back guarantee?",
                    answer: "Yes, all plans include a 7-day risk-free money-back guarantee if you are not completely satisfied.",
                  },
                ],
              }}
            />
          </div>
        </div>
      </section>

      <footer className="relative w-full bg-black text-white pt-16 pb-0 overflow-hidden border-t border-white/10 select-none">
        <div className="absolute inset-0 pointer-events-none grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto border-x border-white/[0.06]">
          <div className="border-r border-white/[0.06]" />
          <div className="border-r border-white/[0.06]" />
          <div />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 text-[10px] tracking-widest text-zinc-500 uppercase">
            <div className="space-y-1">
              <p className="text-zinc-400 font-medium">ALL RIGHTS RESERVED</p>
              <p>&copy; {new Date().getFullYear()} BASTIODON TECHNOLOGIES</p>
            </div>

            <div className="space-y-1 md:text-center">
              <p className="text-zinc-400 font-medium">PURPOSE</p>
              <p>CHILD CYBER SAFETY & PARENTAL PEACE OF MIND</p>
            </div>

            <div className="space-y-1 md:text-right">
              <p className="text-zinc-400 font-medium">SECURITY</p>
              <p>256-BIT ENCRYPTION & PARENT PIN VERIFIED</p>
            </div>
          </div>

          <div className="text-center pt-8 pb-3">
            <span className="text-[10px] sm:text-xs tracking-[0.25em] text-zinc-400 uppercase font-medium">
              CHILD CYBER SAFETY & PARENTAL PEACE OF MIND
            </span>
          </div>
        </div>

        <div className="w-full flex justify-center items-center overflow-hidden leading-none select-none pt-4 pb-0">
          <h1 className="text-[14.8vw] font-black tracking-tight text-white uppercase text-center whitespace-nowrap pointer-events-none translate-y-[2%]">
            BASTIODON
          </h1>
        </div>
      </footer>
    </div>
  );
}
