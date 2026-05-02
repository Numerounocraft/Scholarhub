"use client";

import { motion } from "framer-motion";
import AnimatedWord from "@/components/AnimatedWord";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const, delay },
});

export default function HeroSection() {
  return (
    <div className="mb-8">
      <motion.p
        {...fadeUp(0)}
        className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground"
      >
        Global Scholarship Aggregator
      </motion.p>

      <motion.h1
        {...fadeUp(0.1)}
        className="text-3xl font-semibold tracking-tighter sm:text-4xl"
      >
        Find your next <AnimatedWord />
      </motion.h1>

      <motion.p
        {...fadeUp(0.2)}
        className="mt-2 text-sm text-muted-foreground"
      >
        Hundreds of global opportunities updated daily. Filter by country, field, or degree — and get alerts for new matches.
      </motion.p>
    </div>
  );
}
