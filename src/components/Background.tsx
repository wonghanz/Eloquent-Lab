import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function Background({ children, isBlack = false }: { children: React.ReactNode, isBlack?: boolean }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('.no-ripple')) {
      return;
    }

    const newRipple = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 2000);
  };

  return (
    <div 
      className={`relative min-h-screen w-full overflow-x-hidden overflow-y-auto ${isBlack ? 'bg-black text-white' : 'bg-[#E0F7FA] text-cyan-950'} font-sans selection:bg-cyan-300/50 transition-colors duration-500`}
      onPointerDown={handlePointerDown}
    >
      {/* Colorful Animated Orbs for Wow Glassmorphism */}
      {!isBlack && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div
            animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-300/60 rounded-full mix-blend-multiply filter blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-fuchsia-300/50 rounded-full mix-blend-multiply filter blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-yellow-200/50 rounded-full mix-blend-multiply filter blur-[100px]"
          />
          <motion.div
            animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.3, 1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[20%] right-[10%] w-[300px] h-[300px] bg-emerald-300/40 rounded-full mix-blend-multiply filter blur-[100px]"
          />

          {/* Caustic light reflections */}
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            <motion.div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 0%, transparent 40%)`,
                backgroundSize: '200% 200%'
              }}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        </div>
      )}

      {/* Ripples */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute rounded-full border-2 border-white/80 bg-white/30"
              style={{
                left: ripple.x - 50,
                top: ripple.y - 50,
                width: 100,
                height: 100,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full min-h-screen flex justify-center">
        <div className="w-full max-w-md min-h-screen flex flex-col relative px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
