import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Brain, Eye, BookmarkPlus, BookOpen, Database, CheckCircle2, XCircle, ExternalLink, Trophy, Heart, TrendingUp, Users, Cpu, Shield, Lock, DollarSign } from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { fetchRealNewsAndQuiz, getDefinition, NewsQuizData } from '../../services/geminiService';

const CATEGORIES = [
  { name: "Health", icon: Heart, color: "text-rose-500", bg: "bg-rose-100" },
  { name: "Malaysia Economy", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
  { name: "Society", icon: Users, color: "text-blue-500", bg: "bg-blue-100" },
  { name: "Technology", icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-100" },
  { name: "Humanities", icon: BookOpen, color: "text-amber-600", bg: "bg-amber-100" },
  { name: "Safety", icon: Shield, color: "text-orange-500", bg: "bg-orange-100" },
  { name: "Cybersecurity", icon: Lock, color: "text-slate-600", bg: "bg-slate-200" },
  { name: "Financial", icon: DollarSign, color: "text-green-600", bg: "bg-green-100" }
];

interface ReadingModuleProps {
  onBack: () => void;
}

export const ReadingModule: React.FC<ReadingModuleProps> = ({ onBack }) => {
  const [newsData, setNewsData] = useState<NewsQuizData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Views: 'categories' -> 'active' -> 'results'
  const [view, setView] = useState<'categories' | 'active' | 'results'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Quiz State
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scoreInfo, setScoreInfo] = useState({ correct: 0, totalAnswered: 0, totalQuestions: 0, comment: '' });

  // Biometric / Gaze Tracking Simulation
  const [hoveredWord, setHoveredWord] = useState<{ word: string, context: string, x: number, y: number } | null>(null);
  const [definition, setDefinition] = useState<string | null>(null);
  const [isFetchingDef, setIsFetchingDef] = useState(false);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);

  // Intel Vault
  const [intelVault, setIntelVault] = useState<{ word: string, definition: string }[]>([]);
  const [showVault, setShowVault] = useState(false);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setView('active');
    loadNews(category);
  };

  const loadNews = async (category: string) => {
    setLoading(true);
    const data = await fetchRealNewsAndQuiz(category);
    setNewsData(data);
    setLoading(false);
  };

  const handleWordHoverEnter = (word: string, context: string, e: React.MouseEvent) => {
    const cleanWord = word.replace(/[.,!?]/g, '');
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    
    hoverTimer.current = setTimeout(() => {
      setHoveredWord({ word: cleanWord, context, x: rect.left, y: rect.bottom });
      fetchDefinition(cleanWord, context);
    }, 1000); // 1 second "gaze" dwell time
  };

  const handleWordHoverLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
  };

  const closeDefinition = () => {
    setHoveredWord(null);
    setDefinition(null);
  };

  const fetchDefinition = async (word: string, context: string) => {
    setIsFetchingDef(true);
    const def = await getDefinition(word, context);
    setDefinition(def);
    setIsFetchingDef(false);
  };

  const saveToVault = () => {
    if (hoveredWord && definition) {
      if (!intelVault.some(item => item.word === hoveredWord.word)) {
        setIntelVault([...intelVault, { word: hoveredWord.word, definition }]);
      }
      closeDefinition();
    }
  };

  const handleAnswerSelect = (questionId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const calculateResults = () => {
    if (!newsData) return;
    
    let correct = 0;
    let answered = 0;
    let totalQuestions = 0;
    
    newsData.sections.forEach(sec => {
      sec.questions.forEach(q => {
        totalQuestions++;
        if (answers[q.id]) {
          answered++;
          if (answers[q.id] === q.correctAnswer) correct++;
        }
      });
    });
    
    let comment = "";
    const percentage = answered > 0 ? correct / answered : 0;
    
    if (answered === 0) {
      comment = "You didn't answer any questions! Don't be shy, try again next time! 🦆";
    } else if (answered < totalQuestions) {
      if (percentage > 0.8) {
        comment = `You quit halfway, but wow! You got ${correct} out of ${answered} right! Brilliant! 🌟`;
      } else {
        comment = `You answered ${answered} questions and got ${correct} right. Good effort, keep practicing! 💪`;
      }
    } else {
      if (percentage === 1) {
        comment = "Perfect score! You're an absolute reading master! 🏆✨";
      } else if (percentage >= 0.7) {
        comment = `Amazing job! ${correct}/${totalQuestions} is a fantastic score! 🎉`;
      } else {
        comment = `You completed all ${totalQuestions} questions! You got ${correct} right. Every mistake is a step towards perfection! 🌱`;
      }
    }
    
    setScoreInfo({ correct, totalAnswered: answered, totalQuestions, comment });
    setView('results');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-6">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"
        />
        <p className="text-white/90 font-bold tracking-widest uppercase animate-pulse">Fetching {selectedCategory} News...</p>
      </div>
    );
  }

  const totalQuestionsCount = newsData?.sections?.reduce((acc, sec) => acc + (sec.questions?.length || 0), 0) || 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full w-full relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 z-10 shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 bg-white/10 rounded-full mr-4 hover:bg-white/70 transition-colors backdrop-blur-md shadow-sm no-ripple">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 tracking-tight">Daily Intel</h2>
        </div>
        <button onClick={() => setShowVault(!showVault)} className="p-2 bg-white/10 rounded-full hover:bg-white/70 transition-colors backdrop-blur-md shadow-sm relative">
          <Database className="w-5 h-5 text-emerald-700" />
          {intelVault.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-fuchsia-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {intelVault.length}
            </span>
          )}
        </button>
      </div>

      <GlassCard className="flex-1 flex flex-col overflow-hidden relative p-0">
        
        {/* CATEGORIES VIEW */}
        {view === 'categories' && (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-extrabold text-white mb-3">Choose Your Intel Sector</h3>
              <p className="text-white/80 font-medium">Select a topic to fetch the latest global news and generate your reading mission.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group backdrop-blur-md border ${
                      selectedCategory === cat.name 
                        ? 'bg-blue-500/40 border-blue-400' 
                        : 'bg-white/5 border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <span className="font-bold text-white text-center">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ACTIVE VIEW (Reading + Quiz combined) */}
        {view === 'active' && newsData && (
          <>
            <div className="absolute top-4 right-4 flex items-center bg-white/70 px-3 py-1.5 rounded-full shadow-sm z-10 backdrop-blur-md border border-white/60">
              <Eye className="w-3 h-3 text-emerald-700 mr-1.5" />
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Gaze Active</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32 relative z-0">
              <div className="mb-8">
                {newsData.isFallback && (
                  <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-start">
                    <span className="text-xl mr-3">⚠️</span>
                    <div>
                      <strong className="block font-bold mb-1">API Quota Exceeded</strong>
                      You have hit the free-tier rate limit for the Gemini AI API (15 requests per minute). The app is currently showing offline demo content. Please wait a minute for your quota to reset to fetch real live news.
                    </div>
                  </div>
                )}
                <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
                  {newsData.title || "News Article"}
                </h1>
                {newsData.sourceUrl && (
                  <a href={newsData.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-500 font-bold bg-emerald-50 px-3 py-1.5 rounded-full">
                    <ExternalLink className="w-4 h-4 mr-2" /> Read Original Source
                  </a>
                )}
              </div>

              {/* Render Sections (Paragraph + Questions) */}
              {newsData.sections?.map((section) => {
                const words = (section.paragraph || "").split(' ');
                return (
                  <div key={section.id} className="mb-12">
                    {/* Paragraph */}
                    <p className="text-lg text-white/90 leading-relaxed font-medium mb-6">
                      {words.map((word, i) => (
                        <span
                          key={i}
                          className="inline-block mr-1 cursor-help hover:text-emerald-600 transition-colors duration-300"
                          onMouseEnter={(e) => handleWordHoverEnter(word, section.paragraph, e)}
                          onMouseLeave={handleWordHoverLeave}
                        >
                          {word}
                        </span>
                      ))}
                    </p>

                    {/* Questions for this paragraph */}
                    {section.questions && section.questions.length > 0 && (
                      <div className="bg-blue-500/10 backdrop-blur-md p-5 rounded-3xl border border-blue-500/20 shadow-sm space-y-6">
                        {section.questions.map((q) => {
                          const isAnswered = answers[q.id] !== undefined;
                          
                          return (
                            <div key={q.id}>
                              <h4 className="text-md font-bold text-white mb-3">
                                <span className="text-emerald-600 mr-2">Q:</span>
                                {q.question}
                              </h4>
                              <div className="space-y-2">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = answers[q.id] === opt;
                                  const isCorrect = q.correctAnswer === opt;
                                  
                                  let btnClass = 'bg-white/10 text-white/90 hover:bg-white/70';
                                  if (isAnswered) {
                                    if (isCorrect) {
                                      btnClass = 'bg-emerald-500 text-white shadow-md border-2 border-emerald-400';
                                    } else if (isSelected) {
                                      btnClass = 'bg-red-500 text-white shadow-md border-2 border-red-400';
                                    } else {
                                      btnClass = 'bg-white/30 text-white/90/50 cursor-not-allowed';
                                    }
                                  }
                                  
                                  return (
                                    <button
                                      key={optIdx}
                                      disabled={isAnswered}
                                      onClick={() => handleAnswerSelect(q.id, opt)}
                                      className={`w-full text-left p-3 rounded-xl font-medium transition-all text-sm ${btnClass}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              <AnimatePresence>
                                {isAnswered && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                    className="overflow-hidden"
                                  >
                                    <div className={`p-4 rounded-xl border ${answers[q.id] === q.correctAnswer ? 'bg-emerald-100 border-emerald-300' : 'bg-red-100 border-red-300'}`}>
                                      <p className="text-sm font-medium text-slate-900">
                                        <span className="font-bold mr-2">Explanation:</span>
                                        {q.explanation}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Actions */}
              <div className="pt-8 pb-12 flex flex-col items-center border-t border-cyan-900/10">
                <span className="text-sm font-bold text-emerald-600 bg-emerald-100 px-4 py-2 rounded-full mb-6">
                  {answeredCount} / {totalQuestionsCount} Answered
                </span>
                <button 
                  onClick={calculateResults}
                  className="bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:scale-105 transition-transform active:scale-95"
                >
                  {answeredCount === totalQuestionsCount ? 'Submit Quiz' : 'Quit & Score Now'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* RESULTS VIEW */}
        {view === 'results' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="w-32 h-32 bg-gradient-to-tr from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-2xl mb-8"
            >
              <Trophy className="w-16 h-16 text-white" />
            </motion.div>
            
            <h2 className="text-4xl font-extrabold text-white mb-2">
              {scoreInfo.correct} / {scoreInfo.totalAnswered}
            </h2>
            <p className="text-white/80 font-bold uppercase tracking-widest mb-8">Questions Correct</p>

            <div className="bg-white/60 backdrop-blur-md border border-white/80 p-6 rounded-3xl shadow-lg max-w-md w-full mb-8">
              <p className="text-xl text-white font-medium leading-relaxed">
                {scoreInfo.comment}
              </p>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={() => {
                  setAnswers({});
                  setView('categories');
                  setNewsData(null);
                }}
                className="bg-white/10 text-white/90 px-6 py-3 rounded-xl font-bold hover:bg-white/70 transition-colors"
              >
                Choose Another Topic
              </button>
              <button 
                onClick={onBack}
                className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-400 transition-colors"
              >
                Return to Pond
              </button>
            </div>
          </div>
        )}

      </GlassCard>

      {/* Contextual Definition Popover (Biometric Trigger) */}
      <AnimatePresence>
        {hoveredWord && view === 'active' && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeDefinition} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{ top: hoveredWord.y + 10, left: Math.min(hoveredWord.x, window.innerWidth - 250) }}
              className="fixed z-50 w-64 bg-cyan-950 text-white p-4 rounded-2xl shadow-2xl border border-cyan-800"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-emerald-400 font-bold text-lg">{hoveredWord.word}</h4>
              </div>
              {isFetchingDef ? (
                <div className="flex items-center space-x-2 text-cyan-500/50 text-sm">
                  <Eye className="w-4 h-4 animate-pulse" />
                  <span>Analyzing context...</span>
                </div>
              ) : (
                <>
                  <p className="text-white/90 text-sm leading-relaxed mb-3">{definition}</p>
                  <button 
                    className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold w-full text-left flex items-center bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors" 
                    onClick={saveToVault}
                  >
                    <Database className="w-3 h-3 mr-2" /> Save to Vault
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Intel Vault Modal */}
      <AnimatePresence>
        {showVault && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-cyan-950/60 backdrop-blur-sm"
          >
            <GlassCard className="w-full max-w-md max-h-[80vh] flex flex-col bg-white/90 border-white">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Database className="w-5 h-5 mr-2 text-emerald-600" />
                  Intel Vault
                </h3>
                <button onClick={() => setShowVault(false)} className="text-white/80 hover:text-white">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {intelVault.length === 0 ? (
                  <p className="text-white/80/50 text-center py-8 italic font-medium">Your vault is empty. Dwell on complex words to save them.</p>
                ) : (
                  intelVault.map((item, idx) => (
                    <div key={idx} className="bg-white/10 border border-white/60 p-4 rounded-xl shadow-sm">
                      <h4 className="text-emerald-700 font-bold mb-1">{item.word}</h4>
                      <p className="text-white/90 text-sm font-medium">{item.definition}</p>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
