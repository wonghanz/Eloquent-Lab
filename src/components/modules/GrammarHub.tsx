import React, { useState, useEffect } from 'react';
import { GlassCard } from '../GlassCard';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { ArrowLeft, Activity, Zap, ShieldAlert, Crosshair, BrainCircuit, Check, X } from 'lucide-react';

interface GrammarNode {
  id: string;
  label: string;
  x: string;
  y: string;
  status: 'mastered' | 'learning' | 'decaying' | 'locked';
  connections: string[];
}

const INITIAL_NODES: GrammarNode[] = [
  { id: '1', label: 'Past Tense', x: '50%', y: '15%', status: 'mastered', connections: ['2', '3'] },
  { id: '2', label: 'Conditionals', x: '25%', y: '40%', status: 'decaying', connections: ['4'] },
  { id: '3', label: 'Relative Clauses', x: '75%', y: '40%', status: 'learning', connections: ['4'] },
  { id: '4', label: 'Passive Voice', x: '50%', y: '65%', status: 'locked', connections: ['5'] },
  { id: '5', label: 'Reported Speech', x: '50%', y: '90%', status: 'locked', connections: [] },
];

const DRILL_QUESTIONS = [
  { id: 1, incorrect: "If I will see him, I will tell him.", correct: "If I see him, I will tell him.", concept: "First Conditional" },
  { id: 2, incorrect: "If I would have money, I would buy it.", correct: "If I had money, I would buy it.", concept: "Second Conditional" },
  { id: 3, incorrect: "If she didn't went, she wouldn't have met him.", correct: "If she hadn't gone, she wouldn't have met him.", concept: "Third Conditional" },
];

export const GrammarHub: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [view, setView] = useState<'graph' | 'drill'>('graph');
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [activeDrillNode, setActiveDrillNode] = useState<GrammarNode | null>(null);

  const handleNodeClick = (node: GrammarNode) => {
    if (node.status === 'decaying') {
      setActiveDrillNode(node);
      setView('drill');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col h-full w-full"
    >
      <div className="flex items-center mb-6 z-10 shrink-0">
        <button onClick={() => view === 'drill' ? setView('graph') : onBack()} className="p-2 bg-white/10 rounded-full mr-4 hover:bg-white/20 transition-colors backdrop-blur-md shadow-sm">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-white flex items-center">
            <BrainCircuit className="w-8 h-8 mr-3 text-fuchsia-500" />
            Omni-Grammar Hub
          </h2>
          <p className="text-white/80 font-medium">Personalized Syntax Bank & SRS</p>
        </div>
      </div>

      <GlassCard className="flex-1 flex flex-col relative overflow-hidden p-0 bg-slate-900/80 border-slate-700">
        <AnimatePresence mode="wait">
          {view === 'graph' ? (
            <GraphView key="graph" nodes={nodes} onNodeClick={handleNodeClick} />
          ) : (
            <DrillView key="drill" node={activeDrillNode!} onComplete={() => {
              setNodes(prev => prev.map(n => n.id === activeDrillNode?.id ? { ...n, status: 'mastered' } : n));
              setView('graph');
            }} />
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
};

const GraphView: React.FC<{ nodes: GrammarNode[], onNodeClick: (node: GrammarNode) => void }> = ({ nodes, onNodeClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col relative w-full h-full"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="relative flex-1 w-full h-full p-4 overflow-hidden">
        {/* SVG Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="decayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {nodes.map(node => 
            node.connections.map(targetId => {
              const target = nodes.find(n => n.id === targetId);
              if (!target) return null;
              
              const isDecaying = node.status === 'decaying' || target.status === 'decaying';
              const isLocked = target.status === 'locked';
              
              return (
                <line 
                  key={`${node.id}-${targetId}`}
                  x1={node.x} y1={node.y} x2={target.x} y2={target.y} 
                  stroke={isDecaying ? "url(#decayGrad)" : isLocked ? "rgba(255,255,255,0.1)" : "rgba(16, 185, 129, 0.4)"} 
                  strokeWidth={isDecaying ? "3" : "2"} 
                  strokeDasharray={isLocked ? "4 4" : "none"}
                  className={isDecaying ? "animate-pulse" : ""}
                />
              );
            })
          )}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const isDecaying = node.status === 'decaying';
          const isMastered = node.status === 'mastered';
          const isLearning = node.status === 'learning';
          
          return (
            <motion.div
              key={node.id}
              onClick={() => onNodeClick(node)}
              className={`absolute rounded-full flex items-center justify-center shadow-xl backdrop-blur-md border-2 ${
                isMastered ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 w-24 h-24 shadow-emerald-500/20 cursor-default' :
                isDecaying ? 'bg-rose-500/30 border-rose-500 text-rose-100 w-28 h-28 shadow-rose-500/40 cursor-pointer z-10' :
                isLearning ? 'bg-blue-500/20 border-blue-400 text-blue-100 w-24 h-24 shadow-blue-500/20 cursor-default' :
                'bg-slate-800/50 border-slate-600 text-slate-400 w-20 h-20 cursor-not-allowed'
              }`}
              style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
              whileHover={isDecaying ? { scale: 1.1 } : {}}
              whileTap={isDecaying ? { scale: 0.95 } : {}}
              animate={isDecaying ? {
                x: ["-50%", "calc(-50% - 4px)", "calc(-50% + 4px)", "-50%"],
                filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
                transition: { repeat: Infinity, duration: 0.3, repeatType: "mirror" }
              } : { x: "-50%", y: "-50%" }}
            >
              <div className="flex flex-col items-center text-center px-2">
                {isDecaying && <ShieldAlert className="w-5 h-5 text-rose-400 mb-1 animate-bounce" />}
                {isMastered && <Check className="w-5 h-5 text-emerald-400 mb-1" />}
                <span className="text-xs font-bold leading-tight drop-shadow-md">{node.label}</span>
                {isDecaying && <span className="text-[9px] uppercase tracking-widest text-rose-300 mt-1 font-black bg-rose-900/50 px-2 py-0.5 rounded">Fix Now</span>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Passive Harvesting Engine Panel - Floating */}
      <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl border border-slate-700 bg-slate-900/90 backdrop-blur-xl shadow-2xl z-20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
            <Activity className="w-4 h-4 mr-2 text-fuchsia-500" />
            Passive Harvesting Engine
          </h3>
          <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-400 px-2 py-1 rounded font-bold animate-pulse">LIVE SYNC</span>
        </div>
        <div className="space-y-2">
          <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex items-start">
            <Crosshair className="w-4 h-4 text-rose-400 mt-0.5 mr-3 shrink-0" />
            <div>
              <p className="text-sm text-slate-300">Detected <span className="text-rose-400 font-bold line-through">"If I will go"</span> in Speaking Module.</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">→ Decaying node: Conditionals</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DrillView: React.FC<{ node: GrammarNode, onComplete: () => void }> = ({ node, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds per drill

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 0.1), 100);
      return () => clearTimeout(timer);
    } else {
      // Time up! Force next or fail
      handleNext();
    }
  }, [timeLeft]);

  const handleNext = () => {
    if (currentIndex < DRILL_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(10);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
      className="flex-1 flex flex-col bg-slate-950 relative"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center pointer-events-none">
        <div className="bg-rose-500/20 border border-rose-500/50 px-4 py-2 rounded-full backdrop-blur-md">
          <span className="text-rose-400 font-bold text-sm flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            Repairing: {node.label}
          </span>
        </div>
        <div className="text-2xl font-black text-white drop-shadow-md">
          {Math.ceil(timeLeft)}s
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 z-30">
        <motion.div 
          className="h-full bg-rose-500"
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / 10) * 100}%` }}
          transition={{ ease: "linear", duration: 0.1 }}
        />
      </div>

      {/* Doomscroll Cards */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          <DrillCard 
            key={currentIndex} 
            question={DRILL_QUESTIONS[currentIndex]} 
            onSwipe={handleNext} 
          />
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-20 pointer-events-none">
        <p className="text-slate-400 font-medium text-sm animate-pulse">Swipe Right if Correct, Left to Fix</p>
      </div>
    </motion.div>
  );
};

const DrillCard: React.FC<{ question: any, onSwipe: () => void }> = ({ question, onSwipe }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const bg = useTransform(x, [-100, 0, 100], ['rgba(244, 63, 94, 0.2)', 'rgba(30, 41, 59, 0.9)', 'rgba(16, 185, 129, 0.2)']);
  const borderColor = useTransform(x, [-100, 0, 100], ['rgba(244, 63, 94, 0.5)', 'rgba(51, 65, 85, 1)', 'rgba(16, 185, 129, 0.5)']);

  const handleDragEnd = (e: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe();
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, backgroundColor: bg, borderColor }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.8, opacity: 0, y: 100 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute w-80 h-[400px] rounded-3xl border-2 shadow-2xl flex flex-col items-center justify-center p-8 text-center cursor-grab active:cursor-grabbing backdrop-blur-xl"
    >
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{question.concept}</span>
      <h3 className="text-2xl font-bold text-white leading-tight mb-8">
        {question.incorrect}
      </h3>
      
      <div className="flex w-full justify-between mt-auto px-4 opacity-50">
        <div className="flex flex-col items-center text-rose-400">
          <X className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-bold uppercase">Fix</span>
        </div>
        <div className="flex flex-col items-center text-emerald-400">
          <Check className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-bold uppercase">Correct</span>
        </div>
      </div>
    </motion.div>
  );
};
