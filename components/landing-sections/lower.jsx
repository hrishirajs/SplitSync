"use client";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, BadgeCheck, ChevronDown, FileText,
  Lock, ShieldCheck, Users, WandSparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fadeUp, SectionTitle, TiltCard } from "@/components/landing-animations";

const workflow = [
  { step: "01", title: "Create a group or choose a person", text: "Trips, roommates, and one-off shared bills all begin from the same contact model.", icon: Users },
  { step: "02", title: "Add the expense with context", text: "Type the note, attach a receipt, choose the category, and pick the split style.", icon: FileText },
  { step: "03", title: "Let automation handle repetitive parts", text: "Favorites, recurring templates, auto-categorization, and approval flows.", icon: WandSparkles },
  { step: "04", title: "Settle cleanly and move on", text: "The app surfaces the best payment path so settlement feels organized.", icon: BadgeCheck },
];

const testimonials = [
  { quote: "SplitSync made it really easy to track group expenses. No more confusion about who owes what.", name: "Babu Rao", image: "/testimonials/babubhaiya.png", role: "Rental Property Manager" },
  { quote: "The real-time balance updates are super helpful, especially during trips and shared expenses.", name: "Raju", image: "/testimonials/raju.jpg", role: "Stock Market Expert" },
  { quote: "Simple interface and accurate calculations, it just works without any hassle.", name: "Shyam", image: "/testimonials/shyam.png", role: "Job Searcher" },
];

const faqs = [
  { q: "Does SplitSync support both people and groups?", a: "Yes. The same ledger powers 1:1 balances, group balances, and settlement flows so the numbers stay consistent." },
  { q: "Can I save common expenses?", a: "Yes. You can mark expenses as favorites, reuse them quickly, or turn them into recurring templates." },
  { q: "Can groups review expenses before they count?", a: "Yes. Approval mode lets a group keep new expenses pending until an admin or creator approves them." },
  { q: "What makes the app feel premium?", a: "A cleaner visual system, stronger motion, better hierarchy, and a more polished story across the whole experience." },
];

const securityItems = [
  "Clerk auth protects account access",
  "Convex queries keep data scoped to the right user",
  "Group and settlement views reveal only what the feature needs",
  "Receipts, templates, and reminders stay attached to the right record",
];

export function ProcessSection() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section id="process" ref={sectionRef} className="relative bg-slate-950 py-16 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 top-20 h-[24rem] w-[24rem] rounded-full bg-emerald-500/10 blur-[120px]"
        />
      </div>
      <div className="premium-shell relative z-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-5 lg:sticky lg:top-28">
            <SectionTitle
              dark
              eyebrow="Process"
              title="How SplitSync works"
              description=""
            />
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <Button asChild className="bg-white text-slate-950 hover:bg-white/90">
                <Link href="/dashboard">Open the app <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
          </div>

          <div className="relative">
            {/* glowing timeline spine */}
            <div className="absolute bottom-0 left-6 top-0 w-px bg-white/10 sm:left-8">
              <motion.div style={{ height: lineHeight }} className="w-full bg-gradient-to-b from-emerald-400 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
            </div>

            <div className="grid gap-5 pl-14 sm:pl-20">
              {workflow.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    custom={index + 1}
                    className="group"
                  >
                    {/* step dot on timeline */}
                    <div className="absolute left-[18px] sm:left-[26px]" style={{ marginTop: "1.1rem" }}>
                      <motion.div
                        whileInView={{ scale: [0.5, 1.3, 1] }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.15 }}
                        className="h-3.5 w-3.5 rounded-full border-2 border-emerald-400 bg-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      />
                    </div>
                    <motion.div
                      whileHover={{ x: 8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-colors duration-300 hover:bg-white/[0.08]"
                    >
                      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-white/40">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10">
                          <Icon className="h-5 w-5 text-emerald-300" />
                        </div>
                        Step {item.step}
                      </div>
                      <h3 className="mt-3 text-xl font-semibold tracking-tight">{item.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">{item.text}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section className="premium-shell py-16 sm:py-20">
      <SectionTitle
        eyebrow="Feedback"
        title="Simple, transparent, and reliable expense tracking"
        description=""
        align="center"
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <motion.div
            key={item.name}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            custom={index + 1}
          >
            <TiltCard className="premium-surface panel-glow group h-full overflow-hidden bg-background/80 p-6">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-emerald-400/40">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                </div>
                <div>
                  <div className="font-semibold text-slate-950">{item.name}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.role}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">"{item.quote}"</p>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* Security block */}
      <motion.div
        variants={fadeUp} initial="hidden" whileInView="show"
        viewport={{ once: true, amount: 0.2 }} custom={1}
        className="mt-8"
      >
        <TiltCard className="premium-surface panel-glow group overflow-hidden bg-slate-950 p-5 text-white sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/10">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-white/45">Security posture</div>
              <div className="mt-1 text-lg font-semibold">Controlled, private, and access-aware</div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {securityItems.map((item) => (
              <motion.div
                key={item}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                {item}
              </motion.div>
            ))}
          </div>
        </TiltCard>
      </motion.div>
    </section>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="premium-shell py-16 sm:py-20">
      <SectionTitle
        eyebrow="FAQ"
        title="A couple of questions, answered directly."
        description="The product is designed to be clear enough for a demo and useful after the presentation."
      />
      <div className="mt-10 grid gap-4">
        {faqs.map((item, index) => (
          <motion.details
            key={item.q}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            custom={index + 1}
            className="premium-surface panel-glow group overflow-hidden p-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="mt-4 max-w-3xl border-l-2 border-emerald-400/40 pl-4 text-sm leading-7 text-muted-foreground">{item.a}</p>
          </motion.details>
        ))}
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="premium-shell pb-20 pt-4 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="premium-surface panel-glow relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-10 text-center text-white sm:px-10 sm:py-14"
      >
        {/* animated gradient mesh */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -right-20 -top-20 h-[28rem] w-[28rem] rounded-full bg-emerald-500/10 blur-[100px]"
          />
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 h-[24rem] w-[24rem] rounded-full bg-cyan-400/8 blur-[100px]"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl space-y-5">
          <Badge variant="secondary" className="bg-white/10 text-white">Ready for launch</Badge>
          <h2 className="font-display text-3xl tracking-[-0.06em] sm:text-4xl lg:text-5xl">
            Start managing your shared expenses the smarter way.
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-7 text-white/65">
            Open the app, show the flow, and let the design carry the story while the product logic stays trustworthy underneath.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
              <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-white/90">
                <Link href="/dashboard">Open SplitSync <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </motion.div>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href="/privacy-policy">Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
