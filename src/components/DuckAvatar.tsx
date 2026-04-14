import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Mic } from 'lucide-react';

export type Persona = 'default' | 'supporter' | 'skeptic' | 'aggressor';

interface DuckAvatarProps {
  persona?: Persona;
  isSpeaking?: boolean;
  isThinking?: boolean;
  className?: string;
}

export const DuckAvatar: React.FC<DuckAvatarProps> = ({ 
  persona = 'default', 
  isSpeaking = false, 
  isThinking = false,
  className = '' 
}) => {
  return (
    <motion.div 
      className={`relative flex flex-col items-center justify-center ${className}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
    >
      {/* Outer Rotating Glass Ring */}
      <motion.div 
        className="absolute inset-0 -m-8 rounded-full border border-white/20 bg-gradient-to-tr from-white/5 to-transparent backdrop-blur-[2px]"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
      />

      {/* Glassmorphism Aura/Orb */}
      <div className="absolute inset-0 -m-6 bg-gradient-to-tr from-cyan-400/30 via-blue-400/20 to-fuchsia-400/30 rounded-full blur-2xl animate-pulse" />
      <div className="absolute inset-0 -m-2 bg-white/10 rounded-full backdrop-blur-md border border-white/30 shadow-[0_0_40px_rgba(34,211,238,0.4)]" />

      {/* Thinking Bubble */}
      <AnimatePresence>
        {isThinking && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 10, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10, rotate: 10 }}
            className="absolute -top-16 -right-12 bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl p-3 flex items-center space-x-1.5 z-30"
          >
            <motion.div animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <motion.div animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2.5 h-2.5 bg-fuchsia-400 rounded-full shadow-[0_0_8px_rgba(232,121,249,0.8)]" />
            <motion.div animate={{ y: [0, -6, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            
            {/* Bubble Tail */}
            <div className="absolute -bottom-2 left-4 w-4 h-4 bg-white/70 backdrop-blur-xl border-b border-r border-white/60 transform rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking Indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: 10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: -10 }}
            className="absolute -top-12 -right-8 bg-gradient-to-br from-emerald-400 to-cyan-500 text-white shadow-[0_0_20px_rgba(52,211,153,0.6)] border border-white/50 rounded-full p-2 z-30 flex items-center justify-center backdrop-blur-md"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              <Mic className="w-5 h-5 drop-shadow-md" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.svg 
        width="120" 
        height="120" 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="relative z-10 drop-shadow-2xl"
        animate={{ scaleY: [1, 0.97, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id="duckBody" x1="20" y1="30" x2="100" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="duckHead" x1="30" y1="0" x2="90" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEF08A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="beakGrad" x1="50" y1="45" x2="70" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FB923C" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id="glossyHighlight" x1="40" y1="10" x2="60" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.6" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bodyHighlight" x1="30" y1="40" x2="50" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" stopOpacity="0.4" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Duck Body */}
        <path d="M60 110C82.0914 110 100 92.0914 100 70C100 47.9086 82.0914 30 60 30C37.9086 30 20 47.9086 20 70C20 92.0914 37.9086 110 60 110Z" fill="url(#duckBody)"/>
        <path d="M30 70C30 55 40 40 60 40C45 45 35 55 35 70C35 85 45 95 60 100C40 95 30 85 30 70Z" fill="url(#bodyHighlight)"/>
        
        {/* Duck Head */}
        <path d="M60 60C76.5685 60 90 46.5685 90 30C90 13.4315 76.5685 0 60 0C43.4315 0 30 13.4315 30 30C30 46.5685 43.4315 60 60 60Z" fill="url(#duckHead)"/>
        <path d="M40 30C40 20 45 10 60 5C50 10 45 18 45 30C45 42 50 50 60 55C45 50 40 40 40 30Z" fill="url(#glossyHighlight)"/>
        
        {/* Eyes */}
        {persona === 'aggressor' ? (
          <>
            <path d="M40 25 L50 30" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round"/>
            <path d="M80 25 L70 30" stroke="#7F1D1D" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="45" cy="35" r="4" fill="#7F1D1D"/>
            <circle cx="75" cy="35" r="4" fill="#7F1D1D"/>
          </>
        ) : persona === 'skeptic' ? (
          <>
            {/* Glasses */}
            <rect x="35" y="25" width="20" height="15" rx="4" stroke="#1E3A8A" strokeWidth="3" fill="rgba(255,255,255,0.3)"/>
            <rect x="65" y="25" width="20" height="15" rx="4" stroke="#1E3A8A" strokeWidth="3" fill="rgba(255,255,255,0.3)"/>
            <path d="M55 32 L65 32" stroke="#1E3A8A" strokeWidth="3"/>
            <circle cx="45" cy="32" r="3" fill="#1E3A8A"/>
            <circle cx="75" cy="32" r="3" fill="#1E3A8A"/>
            {/* Raised Eyebrow */}
            <path d="M65 20 Q75 15 85 20" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" fill="none"/>
          </>
        ) : persona === 'supporter' ? (
          <>
            <path d="M40 30 Q45 25 50 30" stroke="#065F46" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <path d="M70 30 Q75 25 80 30" stroke="#065F46" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <circle cx="45" cy="35" r="4" fill="#065F46"/>
            <circle cx="75" cy="35" r="4" fill="#065F46"/>
          </>
        ) : (
          <>
            <circle cx="45" cy="30" r="5" fill="#1E3A8A"/>
            <circle cx="75" cy="30" r="5" fill="#1E3A8A"/>
          </>
        )}

        {/* Beak */}
        <motion.path 
          d="M50 45 Q60 55 70 45 Q60 60 50 45Z" 
          fill="url(#beakGrad)"
          animate={isSpeaking ? { d: ["M50 45 Q60 55 70 45 Q60 60 50 45Z", "M50 45 Q60 65 70 45 Q60 70 50 45Z", "M50 45 Q60 55 70 45 Q60 60 50 45Z"] } : {}}
          transition={{ repeat: Infinity, duration: 0.3 }}
        />

        {/* Hairstyle/Accessories */}
        {persona === 'aggressor' && (
          <path d="M50 0 L55 -15 L60 0 L65 -20 L70 0" stroke="#EF4444" strokeWidth="4" strokeLinejoin="round" fill="none"/>
        )}
        {persona === 'supporter' && (
          <circle cx="60" cy="-5" r="15" fill="#34D399" opacity="0.8"/>
        )}
      </motion.svg>

      {/* Lotus Mic */}
      <motion.div 
        className="absolute z-30 drop-shadow-[0_10px_15px_rgba(236,72,153,0.4)]"
        animate={{ 
          y: isSpeaking ? -40 : 10,
          x: isSpeaking ? 20 : 30,
          rotate: isSpeaking ? -20 : 0,
          scale: isSpeaking ? 1.1 : 1
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lotusGlow" x1="20" y1="5" x2="20" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F472B6" />
              <stop offset="1" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id="lotusInner" x1="20" y1="10" x2="20" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FBCFE8" />
              <stop offset="1" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          {/* Stem */}
          <rect x="18" y="20" width="4" height="40" fill="#4B5563" rx="2"/>
          {/* Lotus Head */}
          <path d="M20 5 C10 15 10 25 20 30 C30 25 30 15 20 5Z" fill="url(#lotusGlow)"/>
          <path d="M20 10 C5 15 5 25 20 30 C35 25 35 15 20 10Z" fill="url(#lotusInner)" opacity="0.9"/>
          <circle cx="20" cy="20" r="4" fill="#FDF2F8" className="animate-pulse"/>
        </svg>
      </motion.div>
    </motion.div>
  );
};
