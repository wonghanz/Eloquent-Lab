import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, PenTool, BookOpen, Headphones, Network, Activity, Sparkles, Zap } from 'lucide-react';

// Sound effect helper
const playClickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio errors
  }
};

interface HomeProps {
  onNavigate: (module: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const subtitles = [
    "Speak before you think.",
    "No translation. Just reaction.",
    "Your English is evolving."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleNav = (module: string) => {
    playClickSound();
    onNavigate(module);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative min-h-full w-full flex flex-col items-center py-4 text-white selection:bg-fuchsia-500/30"
    >
      {/* Background Particles (AI Flow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-500/20 blur-2xl"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col space-y-6">
        
        {/* Hero Section */}
        <div className="text-center space-y-2 mt-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-2"
          >
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-white/80">Speak. Don't translate.</span>
          </motion.div>
          <h1 className="text-5xl font-black tracking-tight flex justify-center overflow-hidden py-2">
            {"Eloquent Lab".split('').map((char, index) => (
              <motion.span
                key={index}
                animate={{ 
                  y: [0, -15, 0],
                  color: ['#ffffff', '#06b6d4', '#d946ef', '#ffffff']
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  delay: index * 0.1,
                  ease: "easeInOut"
                }}
                className="inline-block drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </h1>
          <div className="h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={subtitleIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm font-medium text-cyan-400/80"
              >
                {subtitles[subtitleIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Daily Loop (Start Speaking) */}
        <motion.button
          onClick={() => handleNav('tiktoklish')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-cyan-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500 animate-pulse" />
          <div className="relative bg-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center overflow-hidden">
            {/* Ripple effect container */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%] ease-in-out" style={{ transitionDuration: '1.5s' }} />
            
            <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              <Mic className="w-8 h-8" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Start Speaking</h2>
            <p className="text-xs font-bold tracking-widest uppercase text-white/50">Tiktoklish AI</p>
          </div>
        </motion.button>

        {/* Language System (4 Modules) */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-white/80">Your Language System</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'speaking', icon: Mic, label: 'Speaking', state: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
              { id: 'writing', icon: PenTool, label: 'Writing', state: 'Unlocked', color: 'text-fuchsia-400', bg: 'bg-fuchsia-400/10', border: 'border-fuchsia-400/30' },
              { id: 'reading', icon: BookOpen, label: 'Reading', state: 'Data Source', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
              { id: 'listening', icon: Headphones, label: 'Listening', state: 'Input Engine', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
            ].map((mod) => (
              <motion.button
                key={mod.id}
                onClick={() => handleNav(mod.id)}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-start p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden text-left group`}
              >
                <div className={`p-2 rounded-xl ${mod.bg} mb-3`}>
                  <mod.icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <span className="font-bold text-white text-sm">{mod.label}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${mod.color} opacity-80`}>{mod.state}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Grammar Hub (Live) */}
        <motion.button
          onClick={() => handleNav('grammar')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-full bg-white/5 border border-white/10 rounded-3xl p-5 overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold tracking-widest uppercase text-white/80">Grammar Hub</h3>
            </div>
            <div className="flex items-center space-x-1 bg-indigo-500/20 px-2 py-1 rounded-full border border-indigo-500/30">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold uppercase text-indigo-300 tracking-wider">Live</span>
            </div>
          </div>
          
          {/* Dynamic Node Network */}
          <div className="relative h-24 w-full bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
              <path d="M 60,30 L 160,30 L 260,70" stroke="currentColor" strokeWidth="1" fill="none" className="text-indigo-400" />
              <path d="M 160,30 L 160,70" stroke="currentColor" strokeWidth="1" fill="none" className="text-indigo-400" />
            </svg>
            
            {/* Nodes */}
            <div className="absolute top-[20px] left-[30px] flex flex-col items-center">
              <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-400 mt-1">Past Tense</span>
            </div>
            <div className="absolute top-[20px] left-[140px] flex flex-col items-center">
              <div className="w-3 h-3 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
              <span className="text-[8px] font-bold text-indigo-400 mt-1">Conditionals</span>
            </div>
            <div className="absolute top-[60px] left-[140px] flex flex-col items-center">
              <div className="w-3 h-3 bg-fuchsia-400/50 rounded-full" />
              <span className="text-[8px] font-bold text-fuchsia-400/50 mt-1">Articles</span>
            </div>
            <div className="absolute top-[60px] left-[240px] flex flex-col items-center">
              <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse" />
              <span className="text-[8px] font-bold text-cyan-400 mt-1">Complex Sentences</span>
            </div>
          </div>
        </motion.button>

        {/* Today's Evolution */}
        <div className="relative w-full bg-white/5 border border-white/10 rounded-3xl p-5 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-bold tracking-widest uppercase text-white/80">Today's Evolution</h3>
          </div>
          <div className="space-y-3">
            {[
              "You spoke faster today",
              "You used longer sentences",
              "Less Manglish detected"
            ].map((text, i) => (
              <div key={i} className="flex items-center space-x-3 bg-white/5 rounded-xl p-3">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                <span className="text-sm font-medium text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
