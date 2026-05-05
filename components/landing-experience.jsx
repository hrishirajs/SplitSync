"use client";

import { useState, useEffect } from "react";
import { motion, MotionConfig, useScroll } from "framer-motion";
import { ScrollProgress, CursorGlow, GradientOrbs } from "@/components/landing-animations";
import { Navbar, HeroSection } from "@/components/landing-sections/hero";
import { ProductSection, FeaturesSection } from "@/components/landing-sections/features";
import { ProcessSection, TestimonialsSection, FAQSection, CTASection } from "@/components/landing-sections/lower";

export function LandingExperience() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {/* scroll progress bar */}
      <ScrollProgress />

      {/* cursor glow (desktop only) */}
      <CursorGlow />

      {/* page entrance animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, filter: "blur(12px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden bg-[#f5eddc] text-[#101317]"
      >
        {/* hero area with animated gradient background */}
        <div className="relative">
          <GradientOrbs />
          <Navbar scrolled={scrolled} />
          <HeroSection />
        </div>

        {/* content sections */}
        <ProductSection />
        <FeaturesSection />
        <ProcessSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </motion.div>
    </MotionConfig>
  );
}
