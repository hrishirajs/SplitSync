"use client";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, BadgeCheck, BellRing, CircleDollarSign,
  Gauge, ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fadeUp, GradientOrbs, FloatingStat, Marquee,
} from "@/components/landing-animations";

const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Process", href: "#process" },
  { label: "FAQ", href: "#faq" },
];

const heroSignals = [
  "Equal, percentage & exact splits",
  "Approval mode & budget goals",
  "Recurring templates & favorites",
  "Receipt uploads & reminders",
];

const marqueeItems = [
  "Smart settle", "Expense approvals", "Budget goals",
  "Auto-categorization", "Recurring templates", "Receipt uploads",
  "People + groups", "Monthly insights",
];

const surfaceStats = [
  { value: "3", label: "split modes", icon: CircleDollarSign },
  { value: "1", label: "shared ledger", icon: Gauge },
  { value: "24/7", label: "automation", icon: BellRing },
  { value: "100%", label: "traceable history", icon: ShieldCheck },
];

const heroWords = "A shared money app that feels like a".split(" ");

export function Navbar({ scrolled }) {
  return (
    <section className="premium-shell relative z-30 pt-5">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`premium-surface panel-glow flex items-center justify-between gap-4 px-4 py-3 transition-all duration-500 ${scrolled ? "bg-background/95 shadow-lg" : "bg-background/60"}`}
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-full border border-border/70 bg-background/80 p-1.5">
            <Image src="/logos/logo-s.png" alt="SplitSync" fill className="object-contain p-1" sizes="44px" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-xl tracking-[-0.05em] text-slate-950">SplitSync</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Shared money, beautifully managed</div>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => (
            <a key={item.href} href={item.href} className="rounded-full px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-black/5 hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/dashboard">Open app</Link>
          </Button>
          <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
            <Link href="/dashboard">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

export function HeroSection() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  return (
    <>
      <section ref={heroRef} className="premium-shell relative z-10 pb-8 pt-16 sm:pb-12 sm:pt-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="flex flex-wrap justify-center gap-2"
          >
            {heroSignals.map((signal, i) => (
              <motion.div key={signal} variants={fadeUp} custom={i + 1}>
                <Badge variant="outline" className="border-border/70 bg-background/75 text-slate-700">
                  <BadgeCheck className="h-3.5 w-3.5" /> {signal}
                </Badge>
              </motion.div>
            ))}
          </motion.div>

          <motion.h1
            className="mt-8 max-w-4xl font-display text-5xl leading-[0.92] tracking-[-0.08em] text-slate-950 sm:text-6xl lg:text-7xl xl:text-[5.2rem]"
            initial="hidden" animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.3 } } }}
          >
            {heroWords.map((word, i) => (
              <motion.span
                key={i}
                variants={{ hidden: { opacity: 0, y: 24, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } }}
                className="mr-[0.28em] inline-block"
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              variants={{ hidden: { opacity: 0, y: 24, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }}
              className="inline-block bg-gradient-to-r from-emerald-800 via-slate-950 to-cyan-900 bg-clip-text text-transparent"
            >
              luxury&nbsp;finance&nbsp;stage
            </motion.span>
            <motion.span
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }}
              className="inline-block"
            >.</motion.span>
          </motion.h1>

          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={12}
            className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg"
          >
            SplitSync keeps every expense, receipt, approval, recurring payment, budget goal, and settlement in one polished control center.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={14} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-slate-950 text-white hover:bg-slate-800">
              <Link href="/dashboard">Enter the app <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contacts">Start a group</Link>
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={16} className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {surfaceStats.map((stat, i) => (
              <FloatingStat key={stat.label} {...stat} index={i} />
            ))}
          </motion.div>
        </div>

        {/* full-width dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-14"
        >
          <motion.div style={{ y: imgY, scale: imgScale }} className="premium-surface panel-glow relative overflow-hidden border-border/70 bg-slate-950 text-white">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/55">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                Live product canvas
              </div>
              <div className="text-xs text-white/40">Balances · Receipts · Approvals · Recurring</div>
            </div>
            <div className="relative p-4">
              <Image src="/hero.png" width={1920} height={1080} alt="SplitSync dashboard" className="h-auto w-full rounded-2xl border border-white/10" priority />


            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="premium-shell relative z-10 pb-16">
        <Marquee items={marqueeItems} />
      </section>
    </>
  );
}
