import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Headphones, Volume2, VolumeX, Activity, CheckCircle2, Trophy, AlertCircle, Play, Square, BookOpen, Brain } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { fetchListeningExercise, ListeningExerciseData } from '../../services/geminiService';

const TOPICS = [
  { name: "Office Politics", icon: "🏢" },
  { name: "Travel Mishaps", icon: "✈️" },
  { name: "Tech Support", icon: "💻" },
  { name: "Coffee Shop Gossip", icon: "☕" }
];

interface ListeningModuleProps {
  onBack: () => void;
}

export const ListeningModule: React.FC<ListeningModuleProps> = ({ onBack }) => {
  const [view, setView] = useState<'topics' | 'active' | 'questions' | 'results'>('topics');
  const [loading, setLoading] = useState(false);
  const [exerciseData, setExerciseData] = useState<ListeningExerciseData | null>(null);
  
  // Audio state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dialogueSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const dialogueGainRef = useRef<GainNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  
  // Focus Dial (0 to 100)
  const [focusLevel, setFocusLevel] = useState(0);
  const [maxFocusUsed, setMaxFocusUsed] = useState(0);
  
  // Answers
  const [questionAnswers, setQuestionAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");

  const handleTopicSelect = async (topic: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await fetchListeningExercise(topic);
      if (!data.audioBase64) throw new Error("No audio generated");
      setExerciseData(data);
      setView('active');
      setAudioReady(true);
    } catch (error) {
      setErrorMsg("Failed to generate listening exercise. Please try again or check API quota.");
    }
    setLoading(false);
  };

  const initAudio = async () => {
    if (!exerciseData?.audioBase64) return;
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    
    if (ctx.state === 'suspended') await ctx.resume();
    
    // Decode PCM
    const binaryString = atob(exerciseData.audioBase64);
    const len = binaryString.length;
    const bytes = new Int16Array(len / 2);
    for (let i = 0; i < len; i += 2) {
      const byte1 = binaryString.charCodeAt(i);
      const byte2 = binaryString.charCodeAt(i + 1);
      bytes[i / 2] = (byte2 << 8) | byte1;
    }
    
    const buffer = ctx.createBuffer(1, bytes.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bytes.length; i++) {
      channelData[i] = bytes[i] / 32768.0;
    }
    
    // Create Brown Noise
    const noiseBufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, noiseBufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < noiseBufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    
    // Setup Nodes
    dialogueSourceRef.current = ctx.createBufferSource();
    dialogueSourceRef.current.buffer = buffer;
    
    noiseSourceRef.current = ctx.createBufferSource();
    noiseSourceRef.current.buffer = noiseBuffer;
    noiseSourceRef.current.loop = true;
    
    dialogueGainRef.current = ctx.createGain();
    noiseGainRef.current = ctx.createGain();
    
    dialogueSourceRef.current.connect(dialogueGainRef.current);
    noiseSourceRef.current.connect(noiseGainRef.current);
    
    dialogueGainRef.current.connect(ctx.destination);
    noiseGainRef.current.connect(ctx.destination);
    
    updateVolumes(focusLevel);
    
    dialogueSourceRef.current.onended = () => {
      setIsPlaying(false);
      noiseSourceRef.current?.stop();
    };
    
    dialogueSourceRef.current.start();
    noiseSourceRef.current.start();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (dialogueSourceRef.current) {
      try { dialogueSourceRef.current.stop(); } catch(e) {}
      dialogueSourceRef.current.disconnect();
    }
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch(e) {}
      noiseSourceRef.current.disconnect();
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const updateVolumes = (focus: number) => {
    if (dialogueGainRef.current && noiseGainRef.current) {
      // Focus 0: Noise is loud (0.5), Dialogue is normal (1.0)
      // Focus 100: Noise is 0, Dialogue is boosted (1.5)
      const noiseVol = 0.5 * (1 - focus / 100);
      const dialogueVol = 1.0 + (0.5 * (focus / 100));
      
      noiseGainRef.current.gain.value = noiseVol;
      dialogueGainRef.current.gain.value = dialogueVol;
    }
  };

  const handleFocusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setFocusLevel(val);
    if (val > maxFocusUsed) setMaxFocusUsed(val);
    updateVolumes(val);
  };

  const calculateResults = () => {
    if (!exerciseData) return { score: 0, penalty: 0, correct: 0, total: 0 };
    
    let correct = 0;
    let total = exerciseData.questions.length;
    
    exerciseData.questions.forEach(q => {
      if (questionAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    
    const baseScore = total > 0 ? (correct / total) * 100 : 0;
    const penalty = (maxFocusUsed / 100) * 20; // Max 20% penalty
    
    const totalScore = Math.max(0, baseScore - penalty);
    
    return { score: totalScore, penalty, correct, total };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => {
              stopAudio();
              onBack();
            }}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white/90" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-white flex items-center">
              <Headphones className="w-8 h-8 mr-3 text-emerald-600" />
              Sonic Intercept
            </h2>
            <p className="text-white/80 font-medium">Eavesdrop Mode & Comprehension</p>
          </div>
        </div>
      </div>

      <GlassCard className="flex-1 flex flex-col overflow-hidden relative p-0">
        
        {/* TOPICS VIEW */}
        {view === 'topics' && (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-extrabold text-white mb-3">Select Intercept Target</h3>
              <p className="text-white/80 font-medium">Choose a scenario to eavesdrop on. Prepare for auditory chaos.</p>
            </div>
            
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {errorMsg}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"
                />
                <p className="text-white/90 font-bold tracking-widest uppercase animate-pulse">Generating Audio Scenario...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => handleTopicSelect(topic.name)}
                    className="flex flex-col items-center justify-center p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group backdrop-blur-md border bg-white/5 border-white/10 hover:bg-orange-500/20 hover:border-orange-500/30"
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                      {topic.icon}
                    </div>
                    <span className="font-bold text-white text-center">{topic.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE VIEW (Audio & Questions) */}
        {view === 'active' && exerciseData && (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col">
            <div className="bg-slate-900 rounded-2xl p-6 mb-8 text-white shadow-xl border border-slate-700 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={isPlaying ? stopAudio : initAudio}
                    className={`p-4 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                  >
                    {isPlaying ? <Square className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white ml-1" />}
                  </button>
                  <div>
                    <h4 className="font-bold text-lg">Intercept Stream Active</h4>
                    <p className="text-slate-400 text-sm">Listen carefully and answer the questions below.</p>
                  </div>
                </div>
                
                {isPlaying && (
                  <div className="flex space-x-1">
                    {[1,2,3,4,5].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [10, Math.random() * 30 + 10, 10] }}
                        transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
                        className="w-1.5 bg-emerald-400 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Focus Dial */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center text-slate-300 font-medium">
                    <Activity className="w-4 h-4 mr-2" />
                    Focus Dial (Noise Reduction)
                  </div>
                  <div className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-1 rounded">
                    Warning: High focus drains score
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Volume2 className="w-5 h-5 text-slate-500" />
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={focusLevel}
                    onChange={(e) => handleFocusChange(e as any)}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <VolumeX className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="flex-1">
              <h3 className="text-2xl font-extrabold text-white mb-6 flex items-center">
                <Brain className="w-6 h-6 mr-3 text-purple-600" />
                Comprehension Analysis
              </h3>
              
              <div className="space-y-8">
                {exerciseData.questions.map((q, idx) => {
                  const isAnswered = !!questionAnswers[q.id];
                  const isCorrect = questionAnswers[q.id] === q.correctAnswer;

                  return (
                    <div key={q.id} className="bg-orange-500/10 backdrop-blur-md rounded-3xl p-6 border border-orange-500/20 shadow-sm">
                      <h4 className="text-lg font-bold text-white mb-4">{idx + 1}. {q.question}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                          let btnClass = "border-white/20 bg-white/10 hover:bg-white/20 text-white/90";
                          
                          if (showExplanations) {
                            if (opt === q.correctAnswer) {
                              btnClass = "border-emerald-400 bg-emerald-500 text-white font-bold shadow-md border-2";
                            } else if (questionAnswers[q.id] === opt) {
                              btnClass = "border-red-400 bg-red-500 text-white font-bold shadow-md border-2";
                            } else {
                              btnClass = "border-white/20 bg-white/10 text-white/50 cursor-not-allowed";
                            }
                          } else if (questionAnswers[q.id] === opt) {
                            btnClass = "border-orange-400 bg-orange-500 text-white font-bold shadow-md border-2";
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => {
                                if (!showExplanations) {
                                  setQuestionAnswers(prev => ({ ...prev, [q.id]: opt }));
                                }
                              }}
                              disabled={showExplanations}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${btnClass}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{opt}</span>
                                {showExplanations && opt === q.correctAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {showExplanations && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-4 bg-orange-100 text-slate-900 rounded-xl border border-orange-300 text-sm"
                        >
                          <span className="font-bold mr-2">Explanation:</span>
                          {q.explanation}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              {!showExplanations ? (
                <button
                  onClick={() => {
                    stopAudio();
                    setShowExplanations(true);
                  }}
                  disabled={Object.keys(questionAnswers).length < exerciseData.questions.length}
                  className="bg-purple-600 disabled:bg-slate-400 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg"
                >
                  Submit Analysis
                </button>
              ) : (
                <button
                  onClick={() => setView('results')}
                  className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-colors shadow-lg"
                >
                  View Final Score
                </button>
              )}
            </div>
          </div>
        )}

        {/* RESULTS VIEW */}
        {view === 'results' && (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
            <div className="bg-white/20 rounded-3xl p-8 border border-white shadow-xl max-w-2xl w-full text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-white mb-2">Mission Complete</h2>
              
              {(() => {
                const res = calculateResults();
                return (
                  <div className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                        <div className="text-purple-800 font-bold mb-1">Comprehension Accuracy</div>
                        <div className="text-2xl font-black text-purple-600">
                          {res.correct} / {res.total}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700">Base Score:</span>
                        <span className="font-bold text-slate-900">{(res.score + res.penalty).toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2 text-red-500">
                        <span className="font-bold">Focus Dial Penalty:</span>
                        <span className="font-bold">-{res.penalty.toFixed(1)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2"></div>
                      <div className="flex justify-between items-center text-xl">
                        <span className="font-black text-white">Final Score:</span>
                        <span className="font-black text-emerald-600">{res.score.toFixed(1)} / 100</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-8 flex justify-center space-x-4">
                <button 
                  onClick={() => {
                    setView('topics');
                    setExerciseData(null);
                    setQuestionAnswers({});
                    setShowExplanations(false);
                    setFocusLevel(0);
                    setMaxFocusUsed(0);
                  }}
                  className="bg-cyan-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-cyan-800 transition-colors"
                >
                  New Mission
                </button>
              </div>
            </div>
          </div>
        )}

      </GlassCard>
    </motion.div>
  );
};
