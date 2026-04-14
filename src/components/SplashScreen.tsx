import React, { useEffect } from 'react';
import { motion } from 'motion/react';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    // Play subtle "AirPods connect" style chime
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        
        // First tone (C5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.3);

        // Second tone (E5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
        gain2.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // Ignore audio errors
    }

    // 3.5s -> enter home page (we use 3.5s to allow exit animation)
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 bg-[#0B0B0F] flex flex-col items-center justify-center z-50 overflow-hidden font-sans"
    >
      {/* Subtle background glow (00E5FF, 5-10% opacity) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 2.0, delay: 0.3 }}
        className="absolute w-[800px] h-[800px] bg-[#00E5FF] rounded-full blur-[120px] pointer-events-none"
      />

      {/* Logo Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        {/* The Loop + Wave Icon */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-8">
          {/* Outer Loop */}
          <svg className="absolute inset-0 w-full h-full text-white/20" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          
          {/* Inner Waveform */}
          <div className="flex items-center space-x-1.5 h-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                initial={{ height: '20%' }}
                animate={{ height: ['20%', i % 2 === 0 ? '100%' : '60%', '20%'] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.0 + (i * 0.1) // Waveform starts moving at 1.0s
                }}
                className="w-1 bg-white rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Brand Text */}
        <motion.h1 
          className="text-white text-2xl font-medium tracking-[0.15em] mb-3"
        >
          Eloquent Lab
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.0, delay: 1.5 }}
          className="text-white text-sm tracking-wide font-light"
        >
          Speak. Don't translate.
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
