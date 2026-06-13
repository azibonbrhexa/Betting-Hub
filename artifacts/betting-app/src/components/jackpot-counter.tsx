import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { formatCurrency } from "@/lib/format";

export function JackpotCounter({ value, label }: { value: number, label: string }) {
  const springValue = useSpring(value, {
    stiffness: 50,
    damping: 20,
    mass: 1,
  });

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const display = useTransform(springValue, (current) => 
    formatCurrency(current)
  );

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-black/40 rounded-2xl border border-primary/20 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
      <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1 z-10">{label}</span>
      <motion.span className="text-3xl md:text-4xl font-serif font-bold text-white tracking-wider z-10 drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]">
        {display}
      </motion.span>
    </div>
  );
}
