"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Brain, CircleDollarSign, Gauge,
  Receipt, Repeat, ShieldCheck, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fadeUp, fadeScale, SectionTitle, TiltCard } from "@/components/landing-animations";

const featureTiles = [
  {
    title: "Split math that feels invisible",
    description: "Equal, percentage, and exact splits all stay in the same flow.",
    icon: CircleDollarSign,
    span: "lg:col-span-6",
    tone: "from-emerald-500/16 via-white/80 to-cyan-500/10",
  },
  {
    title: "Approval mode",
    description: "Group expenses wait for review before affecting balances.",
    icon: ShieldCheck,
    span: "lg:col-span-3",
    tone: "from-slate-950 via-slate-900 to-emerald-900",
    inverted: true,
  },
  {
    title: "Budget goals",
    description: "Set a number, show progress, let the group see room left.",
    icon: Gauge,
    span: "lg:col-span-3",
    tone: "from-amber-200/70 via-white/85 to-emerald-100/60",
  },
  {
    title: "Recurring + favorites",
    description: "Save common expenses and let future instances auto-generate.",
    icon: Repeat,
    span: "lg:col-span-4",
    tone: "from-slate-950 via-slate-900 to-cyan-950",
    inverted: true,
  },
  {
    title: "Receipt uploads",
    description: "Attach JPG, PNG, WEBP, or PDF receipts without leaving the form.",
    icon: Receipt,
    span: "lg:col-span-4",
    tone: "from-white/90 via-amber-50 to-emerald-50",
  },
  {
    title: "Insights + reminders",
    description: "Smart settle, spending insights, and reminders keep the app moving.",
    icon: Brain,
    span: "lg:col-span-4",
    tone: "from-slate-950 via-slate-900 to-cyan-950",
    inverted: true,
  },
];

export function ProductSection() {
  return (
    <section id="product" className="premium-shell py-16 sm:py-20">
      <SectionTitle
        eyebrow="SplitSync"
        title="A smarter way to manage shared expenses without confusion."
        description="Track expenses, split bills, and settle balances in real-time with a clean and intuitive system."
      />
      <div className="mt-10 grid gap-5 lg:grid-cols-12">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true, amount: 0.2 }} custom={1}
          className="lg:col-span-7"
        >
          <TiltCard className="premium-surface panel-glow group h-full overflow-hidden bg-background/80 p-6">
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="space-y-4">
                <Badge variant="outline" className="border-border/70 bg-background/75 text-foreground">
                  People, groups, and settlement flows
                </Badge>
                <h3 className="font-display text-3xl tracking-[-0.06em] text-slate-950 sm:text-4xl">
                  A central dashboard for all your expenses and balances.
                </h3>
                <p className="text-sm leading-7 text-slate-600">
                  View groups, track spending, monitor balances, and manage settlements all in one place.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,rgba(124,207,170,0.24),transparent_46%)] blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.6rem] border border-border/70 bg-slate-950 text-white">
                  <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-white/55">Live snapshot</div>
                  <div className="space-y-3 p-4">
                    {["Dashboard totals, spending charts, and groups", "1:1 balances with settle-up paths", "Group budgets, approvals, and pending items"].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>
        </motion.div>

        <motion.div
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true, amount: 0.2 }} custom={2}
          className="lg:col-span-5"
        >
          <TiltCard className="premium-surface panel-glow group h-full overflow-hidden bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/55">Built for demos</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">The interface has presence.</div>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {["Premium spacing and typography", "Sticky sections and motion layers", "Dark interludes for visual contrast", "Light mode internals with a dark toggle"].map((item) => (
                <motion.div key={item} whileHover={{ x: 6 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72"
                >{item}</motion.div>
              ))}
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="premium-shell py-16 sm:py-20">
      <SectionTitle
        eyebrow="Feature atlas"
        title="Everything you need to manage shared expenses efficiently."
        description="Designed to simplify tracking, splitting, and settling expenses with clarity and accuracy."
      />
      <div className="mt-10 grid gap-5 lg:grid-cols-12">
        {featureTiles.map((feature, index) => {
          const Icon = feature.icon;
          const dirs = ["left", "right", "up", "left", "right", "up"];
          return (
            <motion.div
              key={feature.title}
              variants={fadeScale}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              custom={index + 1}
              className={feature.span}
            >
              <TiltCard
                className={`premium-surface panel-glow group h-full overflow-hidden p-5 transition-shadow duration-500 hover:shadow-[0_30px_80px_-40px_rgba(16,185,129,0.25)] ${feature.inverted ? "bg-slate-950 text-white" : "bg-background/80 text-slate-950"}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.tone} opacity-80`} />
                <div className="relative flex h-full flex-col justify-between gap-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${feature.inverted ? "border-white/10 bg-white/5 text-white/70" : "border-border/70 bg-white/70 text-slate-600"}`}>
                        <Icon className="h-3.5 w-3.5" /> Live now
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight">{feature.title}</h3>
                      <p className={`max-w-xl text-sm leading-7 ${feature.inverted ? "text-white/72" : "text-slate-600"}`}>{feature.description}</p>
                    </div>
                    <motion.div
                      whileHover={{ rotate: 12, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${feature.inverted ? "border-white/10 bg-white/10 text-white" : "border-border/70 bg-white/80 text-primary"}`}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                  </div>
                  <div className={`h-20 rounded-[1.35rem] border ${feature.inverted ? "border-white/10 bg-gradient-to-br from-white/10 to-black/15" : "border-border/70 bg-gradient-to-br from-white/80 to-emerald-50/40"}`} />
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
