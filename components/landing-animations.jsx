"use client";

import { useRef, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useMotionTemplate,
} from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ── shared animation variants ── */
export const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.06 * i,
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export const fadeScale = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
  show: (i = 1) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: 0.08 * i,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export const slideIn = (direction = "left") => ({
  hidden: {
    opacity: 0,
    x: direction === "left" ? -60 : direction === "right" ? 60 : 0,
    y: direction === "up" ? 40 : direction === "down" ? -40 : 0,
    filter: "blur(4px)",
  },
  show: (i = 1) => ({
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.07 * i,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
});

/* ── scroll progress bar ── */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className="fixed left-0 right-0 top-0 z-[100] h-[2px] origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400"
    />
  );
}

/* ── cursor glow ── */
export function CursorGlow() {
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const springX = useSpring(mouseX, { stiffness: 40, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 25 });

  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window;
    if (isTouchDevice) return;
    const handler = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 z-[1] h-[420px] w-[420px] rounded-full bg-emerald-400/[0.07] blur-[100px]"
    />
  );
}

/* ── 3D tilt card ── */
export function TiltCard({ children, className = "", ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), {
    stiffness: 280,
    damping: 28,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), {
    stiffness: 280,
    damping: 28,
  });

  const sheenX = useTransform(x, [-0.5, 0.5], [0, 100]);
  const sheenY = useTransform(y, [-0.5, 0.5], [0, 100]);
  const sheenBg = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.12), transparent 55%)`;

  function handleMouseMove(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`relative ${className}`}
      {...props}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: sheenBg }}
      />
    </motion.div>
  );
}

/* ── animated gradient orbs ── */
export function GradientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ x: [0, 35, -25, 0], y: [0, -25, 20, 0], scale: [1, 1.06, 0.94, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-28 top-8 h-[30rem] w-[30rem] rounded-full bg-emerald-400/20 blur-[140px]"
      />
      <motion.div
        animate={{ x: [0, -30, 20, 0], y: [0, 30, -15, 0], scale: [1, 0.95, 1.05, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-32 top-20 h-[28rem] w-[28rem] rounded-full bg-cyan-300/15 blur-[140px]"
      />
      <motion.div
        animate={{ x: [0, 20, -30, 0], y: [0, -20, 25, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-amber-200/20 blur-[140px]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,19,23,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,19,23,0.05)_1px,transparent_1px)] bg-[size:74px_74px] opacity-[0.04]" />
    </div>
  );
}

/* ── section title ── */
export function SectionTitle({ eyebrow, title, description, align = "left", dark = false }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      custom={1}
      className={`flex max-w-3xl flex-col gap-3 ${align === "center" ? "mx-auto items-center text-center" : ""}`}
    >
      <Badge
        variant="outline"
        className={dark ? "border-white/15 bg-white/5 text-white/80" : "border-border/70 bg-background/70 text-foreground"}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </Badge>
      <h2
        className={`font-display text-3xl tracking-[-0.06em] sm:text-4xl lg:text-5xl ${dark ? "text-white" : "text-foreground"}`}
      >
        {title}
      </h2>
      <p className={`text-sm leading-7 sm:text-base ${dark ? "text-white/65" : "text-muted-foreground"}`}>
        {description}
      </p>
    </motion.div>
  );
}

/* ── marquee strip ── */
export function Marquee({ items }) {
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden rounded-full border border-border/70 bg-background/75 backdrop-blur-md">
      <motion.div
        className="flex w-max items-center gap-3 px-3 py-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="rounded-full border border-border/70 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.22em] text-slate-600"
          >
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ── floating stat card ── */
export function FloatingStat({ value, label, icon: Icon, index = 0 }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{
        duration: 5 + index * 0.8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.4,
      }}
      whileHover={{ scale: 1.05, y: -4 }}
      className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xl font-semibold tracking-tight text-slate-950">{value}</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border/70 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
