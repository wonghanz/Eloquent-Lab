import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '../lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function GlassCard({ children, className, delay = 0, ...props }: GlassCardProps) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{
        repeat: Infinity,
        duration: 4 + Math.random() * 2,
        ease: "easeInOut",
        delay: delay,
      }}
      className={cn(
        "bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl p-6 overflow-hidden relative text-white",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-60 pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
