import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Timer, Zap, AlertTriangle, Flame, Lightbulb, CheckCircle2, XCircle, ChevronRight, RefreshCw, BookOpen, BrainCircuit, Wand2, LifeBuoy } from 'lucide-react';
import { generateWritingCrisis, generateTranslationAndOptions, upgradeIdea, emergencyFill, evaluateWritingBurst, WritingCrisisData, WritingEvaluation, RescueData } from '../../services/geminiService';

type GameState = 'intro' | 'hook' | 'rescue_translation' | 'writing' | 'evaluating' | 'outcome';

export const WritingModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [difficulty, setDifficulty] = useState('easy');
  const [weakness, setWeakness] = useState('none');
  const [streak, setStreak] = useState(0);
  
  const [crisisData, setCrisisData] = useState<WritingCrisisData | null>(null);
  const [rescueData, setRescueData] = useState<RescueData | null>(null);
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null);
  
  // Writing State (Micro-Expansion)
  const [chosenOption, setChosenOption] = useState('');
  const [s1, setS1] = useState(''); // Point
  const [s2, setS2] = useState(''); // Explanation
  const [s3, setS3] = useState(''); // Example
  const [nonsenseWarning, setNonsenseWarning] = useState('');
  
  const [isUpgrading, setIsUpgrading] = useState<'s1' | 's2' | 's3' | null>(null);
  const [isEmergencyFilling, setIsEmergencyFilling] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start a new crisis loop
  const startCrisis = async () => {
    setGameState('hook');
    // Reset all states
    setS1(''); setS2(''); setS3(''); setNonsenseWarning(''); setChosenOption('');
    setRescueData(null);
    
    const data = await generateWritingCrisis(difficulty, weakness);
    setCrisisData(data);
    setTimeLeft(data.timeLimit);
    
    // Generate Rescue Data in background
    const rescue = await generateTranslationAndOptions(data.prompt);
    setRescueData(rescue);
    
    setTimeout(() => {
      setGameState('rescue_translation');
    }, 3000);
  };

  // Anti-Nonsense Guard
  useEffect(() => {
    const check = (text: string) => {
      if (!text) return "";
      if (/(.)\1{4,}/.test(text)) return "Spam typing detected. Timer frozen.";
      const words = text.trim().split(/\s+/);
      if (words.length > 5) {
        const unique = new Set(words);
        if (unique.size / words.length < 0.3) return "Meaningless repetition detected. Timer frozen.";
      }
      return "";
    };
    const w1 = check(s1);
    const w2 = check(s2);
    const w3 = check(s3);
    setNonsenseWarning(w1 || w2 || w3);
  }, [s1, s2, s3]);

  // Timer logic
  useEffect(() => {
    if (gameState === 'writing' && !nonsenseWarning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitWriting();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (nonsenseWarning && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, nonsenseWarning]);

  const handleChooseOption = (opt: string) => {
    setChosenOption(opt);
    setS1(opt); // Pre-fill the point
    setGameState('writing');
  };

  const handleUpgrade = async (field: 's1' | 's2' | 's3', text: string) => {
    if (!text || !crisisData) return;
    setIsUpgrading(field);
    const result = await upgradeIdea(text, crisisData.prompt);
    if (field === 's1') setS1(result.upgraded);
    if (field === 's2') setS2(result.upgraded);
    if (field === 's3') setS3(result.upgraded);
    setIsUpgrading(null);
  };

  const handleEmergencyFill = async () => {
    if (!crisisData) return;
    setIsEmergencyFilling(true);
    const result = await emergencyFill(crisisData.prompt, chosenOption || "General response");
    setS1(result.point);
    setS2(result.explanation);
    setS3(result.example);
    setIsEmergencyFilling(false);
  };

  const submitWriting = async () => {
    if (!crisisData) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setGameState('evaluating');
    const evalResult = await evaluateWritingBurst(crisisData.prompt, s1, s2, s3);
    setEvaluation(evalResult);
    
    if (evalResult.score >= 80) {
      setStreak(prev => prev + 1);
      if (difficulty === 'easy') setDifficulty('medium');
      else if (difficulty === 'medium') setDifficulty('crisis');
    } else {
      setStreak(0);
    }
    
    setWeakness(evalResult.weakness || 'none');
    setGameState('outcome');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 bg-white/10 rounded-full mr-4 hover:bg-white/70 transition-colors backdrop-blur-md shadow-sm no-ripple">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600 tracking-tight flex items-center">
            <Flame className="w-8 h-8 mr-2 text-fuchsia-600" />
            Crisis Loop
          </h2>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Streak Indicator */}
          {gameState !== 'intro' && (
            <div className={`flex items-center px-4 py-1.5 rounded-full border shadow-sm backdrop-blur-md ${streak >= 3 ? 'bg-amber-100/80 border-amber-300 text-amber-700' : 'bg-white/60 border-white/80 text-white/80'}`}>
              <Zap className={`w-4 h-4 mr-1.5 ${streak >= 3 ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span className="font-bold text-sm">
                {streak >= 3 ? 'Cognitive Flow' : `Streak: ${streak}`}
              </span>
            </div>
          )}

          {/* Timer */}
          {gameState === 'writing' && (
            <div className={`flex items-center px-4 py-1.5 rounded-full border shadow-sm backdrop-blur-md ${nonsenseWarning ? 'bg-red-100/80 border-red-300 text-red-700' : 'bg-fuchsia-100/80 border-fuchsia-200 text-fuchsia-700'}`}>
              <Timer className="w-4 h-4 mr-1.5" />
              <span className="font-bold font-mono text-lg">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-y-auto flex flex-col items-center justify-start pb-10">
        
        {/* INTRO STATE */}
        {gameState === 'intro' && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md mt-20"
          >
            <h1 className="text-5xl font-black mb-6 text-white">Zero-Idea Rescue.</h1>
            <p className="text-white/80 text-lg mb-10 leading-relaxed font-medium">
              You will never face a blank mind again. We think <i>with</i> you, not after you.
            </p>
            <button 
              onClick={startCrisis}
              className="w-full py-5 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-2xl font-black text-xl text-white shadow-[0_0_40px_rgba(217,70,239,0.4)] hover:scale-105 transition-transform active:scale-95"
            >
              ENTER THE LOOP
            </button>
          </motion.div>
        )}

        {/* HOOK STATE */}
        {gameState === 'hook' && crisisData && (
          <motion.div 
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="text-center max-w-2xl mt-20"
          >
            <AlertTriangle className="w-20 h-20 text-fuchsia-600 mx-auto mb-6 animate-pulse" />
            <h2 className="text-4xl font-black text-white mb-4 leading-tight">
              {crisisData.hookMessage}
            </h2>
            <p className="text-xl text-white/80 font-medium">
              Translating problem...
            </p>
          </motion.div>
        )}

        {/* RESCUE TRANSLATION & OPTIONS STATE */}
        {gameState === 'rescue_translation' && crisisData && (
          <GlassCard className="w-full max-w-3xl p-8 flex flex-col">
            <div className="flex items-center mb-6 text-fuchsia-600">
              <LifeBuoy className="w-8 h-8 mr-3" />
              <h2 className="text-2xl font-black">Problem Translation Mode</h2>
            </div>
            
            <div className="bg-white/60 p-4 rounded-xl border border-white/80 mb-6 shadow-sm">
              <p className="text-lg font-bold text-white">{crisisData.prompt}</p>
            </div>

            {!rescueData ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="w-10 h-10 text-fuchsia-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Translation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-sm">
                    <div className="text-indigo-800 text-xs font-bold uppercase tracking-widest mb-1">Topic</div>
                    <div className="text-indigo-950 font-medium">{rescueData.translation.topic}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm">
                    <div className="text-emerald-800 text-xs font-bold uppercase tracking-widest mb-1">Type</div>
                    <div className="text-emerald-950 font-medium">{rescueData.translation.type}</div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-sm">
                    <div className="text-amber-800 text-xs font-bold uppercase tracking-widest mb-1">Sides</div>
                    <div className="text-amber-950 font-medium">{rescueData.translation.sides}</div>
                  </div>
                </div>

                {/* Forced Options */}
                <div>
                  <h3 className="text-white/90 font-black text-xl mb-4">Pick a starter choice:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Gradual Removal of Help: Show fewer options if streak is high */}
                    {rescueData.options.slice(0, streak >= 2 ? 0 : streak === 1 ? 2 : 4).map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleChooseOption(opt)}
                        className="p-4 bg-white/10 border border-white/80 rounded-xl text-left hover:bg-fuchsia-50 hover:border-fuchsia-300 transition-colors shadow-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">{opt}</span>
                          <ChevronRight className="w-5 h-5 text-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                    {streak >= 2 && (
                      <div className="col-span-2 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center shadow-sm">
                        <Flame className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <h4 className="text-amber-900 font-bold mb-2">Cognitive Flow Active</h4>
                        <p className="text-amber-800 text-sm mb-4">You are doing great. No starter choices this time. Write your own point.</p>
                        <button 
                          onClick={() => handleChooseOption('')}
                          className="px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Start Blank
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        )}

        {/* WRITING STATE (Micro-Expansion) */}
        {gameState === 'writing' && crisisData && (
          <div className="w-full max-w-4xl flex flex-col space-y-6">
            
            {/* Anti-Nonsense Guard */}
            <AnimatePresence>
              {nonsenseWarning && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center font-bold shadow-sm"
                >
                  <AlertTriangle className="w-6 h-6 mr-3" />
                  {nonsenseWarning}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <h3 className="text-white/90 font-black text-xl">Micro-Expansion</h3>
              <button 
                onClick={handleEmergencyFill}
                disabled={isEmergencyFilling}
                className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center shadow-sm"
              >
                {isEmergencyFilling ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <LifeBuoy className="w-4 h-4 mr-2" />}
                Emergency Fill
              </button>
            </div>

            {/* Segmented Writing */}
            <div className="space-y-4">
              {/* Sentence 1 */}
              <div className="bg-white/10 border border-white/60 rounded-2xl overflow-hidden focus-within:border-fuchsia-500/50 focus-within:bg-white/70 transition-colors shadow-sm relative">
                <div className="bg-white/40 px-4 py-2 text-xs font-bold text-white/80 uppercase tracking-widest border-b border-white/60 flex justify-between items-center">
                  <span>Sentence 1: Clear Point</span>
                  <button 
                    onClick={() => handleUpgrade('s1', s1)}
                    disabled={!s1 || isUpgrading === 's1'}
                    className="text-fuchsia-600 hover:text-fuchsia-700 flex items-center disabled:opacity-50 font-bold"
                  >
                    {isUpgrading === 's1' ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                    Upgrade Idea
                  </button>
                </div>
                <textarea
                  value={s1}
                  onChange={e => setS1(e.target.value)}
                  placeholder="What is your main argument?"
                  className="w-full bg-transparent resize-none outline-none text-white text-lg p-4 placeholder:text-white/70/50 font-medium h-24"
                />
              </div>

              {/* Sentence 2 */}
              <div className="bg-white/10 border border-white/60 rounded-2xl overflow-hidden focus-within:border-fuchsia-500/50 focus-within:bg-white/70 transition-colors shadow-sm relative">
                <div className="bg-white/40 px-4 py-2 text-xs font-bold text-white/80 uppercase tracking-widest border-b border-white/60 flex justify-between items-center">
                  <span>Sentence 2: Explain (Why is this true? Who is affected?)</span>
                  <button 
                    onClick={() => handleUpgrade('s2', s2)}
                    disabled={!s2 || isUpgrading === 's2'}
                    className="text-fuchsia-600 hover:text-fuchsia-700 flex items-center disabled:opacity-50 font-bold"
                  >
                    {isUpgrading === 's2' ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                    Upgrade Idea
                  </button>
                </div>
                <textarea
                  value={s2}
                  onChange={e => setS2(e.target.value)}
                  placeholder="Answer in fragments or full sentences..."
                  className="w-full bg-transparent resize-none outline-none text-white text-lg p-4 placeholder:text-white/70/50 font-medium h-24"
                />
              </div>

              {/* Sentence 3 */}
              <div className="bg-white/10 border border-white/60 rounded-2xl overflow-hidden focus-within:border-fuchsia-500/50 focus-within:bg-white/70 transition-colors shadow-sm relative">
                <div className="bg-white/40 px-4 py-2 text-xs font-bold text-white/80 uppercase tracking-widest border-b border-white/60 flex justify-between items-center">
                  <span>Sentence 3: Example (Give a simple example)</span>
                  <button 
                    onClick={() => handleUpgrade('s3', s3)}
                    disabled={!s3 || isUpgrading === 's3'}
                    className="text-fuchsia-600 hover:text-fuchsia-700 flex items-center disabled:opacity-50 font-bold"
                  >
                    {isUpgrading === 's3' ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                    Upgrade Idea
                  </button>
                </div>
                <textarea
                  value={s3}
                  onChange={e => setS3(e.target.value)}
                  placeholder="For instance..."
                  className="w-full bg-transparent resize-none outline-none text-white text-lg p-4 placeholder:text-white/70/50 font-medium h-24"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={submitWriting}
                disabled={!s1 || !s2 || !s3 || !!nonsenseWarning}
                className="px-8 py-4 bg-fuchsia-600 text-white font-black rounded-xl hover:bg-fuchsia-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SUBMIT BURST
              </button>
            </div>
          </div>
        )}

        {/* EVALUATING STATE */}
        {gameState === 'evaluating' && (
          <div className="text-center mt-20">
            <RefreshCw className="w-16 h-16 text-fuchsia-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-2xl font-black text-white animate-pulse">Analyzing Cognitive Patterns...</h2>
          </div>
        )}

        {/* OUTCOME STATE */}
        {gameState === 'outcome' && evaluation && (
          <GlassCard className="w-full max-w-3xl p-8 space-y-8 flex flex-col">
            <div className="text-center">
              <div className="text-white/80 font-bold uppercase tracking-widest mb-2">Effort-Based Score</div>
              <h2 className="text-6xl font-black text-white mb-2">{evaluation.score}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-red-700 font-bold mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Your Weakness
                </h3>
                <p className="text-red-900 font-medium">{evaluation.weakness}</p>
                <div className="mt-4 pt-4 border-t border-red-200">
                  <h4 className="text-red-700 font-bold text-sm mb-1">The Fix:</h4>
                  <p className="text-red-950 font-bold">{evaluation.fix}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-emerald-700 font-bold mb-2 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Model Answer
                </h3>
                <p className="text-emerald-900 font-medium italic">"{evaluation.modelAnswer}"</p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-indigo-700 font-bold mb-4 flex items-center">
                <BrainCircuit className="w-5 h-5 mr-2" />
                Mini-Drill: Rewrite
              </h3>
              <div className="bg-white/60 p-4 rounded-xl mb-4 border border-white/80 shadow-inner">
                <p className="text-white/80 text-sm mb-1 font-bold">Original:</p>
                <p className="text-white font-medium">"{evaluation.miniDrill.original}"</p>
              </div>
              <p className="text-indigo-700 font-bold mb-2">Instruction: {evaluation.miniDrill.instruction}</p>
              <textarea 
                placeholder="Rewrite your sentence here..."
                className="w-full bg-white/60 border border-white/80 rounded-xl p-4 text-white outline-none focus:border-indigo-500 transition-colors resize-none h-20 mb-4 shadow-inner"
              />
              <button 
                onClick={startCrisis}
                className="w-full py-4 bg-fuchsia-600 text-white rounded-xl font-black text-lg hover:bg-fuchsia-700 transition-colors shadow-md flex items-center justify-center group"
              >
                NEXT BURST
                <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </GlassCard>
        )}

      </div>
    </motion.div>
  );
}
