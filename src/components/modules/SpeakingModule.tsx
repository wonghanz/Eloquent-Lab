import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../GlassCard';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mic, Clock, CheckCircle2, AlertCircle, MicOff, BookOpen } from 'lucide-react';
import { DuckAvatar, Persona } from '../DuckAvatar';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { generateTopicFromImage, generateDebateResponse, generateSettlement } from '../../services/geminiService';

type ModuleState = 'SCANNING' | 'BRIEFING' | 'DEBATE' | 'SETTLEMENT';

interface Bubble {
  id: number;
  x: number;
  y: number;
  landed: boolean;
}

interface DirtyWord {
  word: string;
  correction: string;
}

interface TranscriptItem {
  id: number;
  speaker: 'user' | 'ai';
  text: string;
  dirtyWords: DirtyWord[];
}

// Web Speech API interfaces
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const SpeakingModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [moduleState, setModuleState] = useState<ModuleState>('SCANNING');
  const [persona, setPersona] = useState<Persona>('default');
  const [topic, setTopic] = useState<string>("Scanning environment...");
  
  // Camera Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scanning State
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [scanStatus, setScanStatus] = useState("Scanning Surfaces...");

  // Briefing State
  const [prepTime, setPrepTime] = useState(300); // 5 minutes

  // Debate State
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [userTime, setUserTime] = useState(50); // percentage 0-100
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [cadence, setCadence] = useState(100);
  const [currentSpeech, setCurrentSpeech] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const speechStartTimeRef = useRef<number>(0);
  const wordCountRef = useRef<number>(0);

  // Settlement State
  const [radarData, setRadarData] = useState([
    { subject: 'Task Fulfilment', A: 0, fullMark: 100 },
    { subject: 'Language', A: 0, fullMark: 100 },
    { subject: 'Fluency', A: 0, fullMark: 100 },
  ]);
  const [predictedBand, setPredictedBand] = useState("Calculating...");
  const [reviewVault, setReviewVault] = useState<DirtyWord[]>([]);

  // Camera Setup
  useEffect(() => {
    if (moduleState === 'SCANNING' || moduleState === 'DEBATE') {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Camera access denied:", err));
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    }
  }, [moduleState]);

  // Scanning Logic
  useEffect(() => {
    if (moduleState === 'SCANNING') {
      setScanStatus("Scanning Surfaces...");
      const interval = setInterval(() => {
        setBubbles(prev => {
          if (prev.length > 15) return prev;
          return [...prev, {
            id: Date.now(),
            x: Math.random() * 80 + 10,
            y: Math.random() * 50 + 10,
            landed: Math.random() > 0.5
          }];
        });
      }, 500);

      const scanTimer = setTimeout(async () => {
        clearInterval(interval);
        setScanStatus("Analyzing Environment with AI...");
        
        let base64Image = "";
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              base64Image = canvas.toDataURL('image/jpeg', 0.5);
            }
          }
        }
        
        const generatedTopic = await generateTopicFromImage(base64Image);
        setTopic(generatedTopic);
        setScanStatus("Analysis Complete");
        setModuleState('BRIEFING');
      }, 4000);

      return () => {
        clearInterval(interval);
        clearTimeout(scanTimer);
      };
    }
  }, [moduleState]);

  // Briefing Timer
  useEffect(() => {
    if (moduleState === 'BRIEFING' && prepTime > 0) {
      const timer = setInterval(() => setPrepTime(p => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [moduleState, prepTime]);

  // Speech Recognition Setup
  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setCurrentSpeech(finalTranscript + interimTranscript);
        
        // Calculate Cadence (WPM)
        const words = (finalTranscript + interimTranscript).trim().split(/\s+/).length;
        wordCountRef.current = words;
        const elapsedMinutes = (Date.now() - speechStartTimeRef.current) / 60000;
        if (elapsedMinutes > 0) {
          const wpm = words / elapsedMinutes;
          // Normalize WPM to a 0-100 scale (assuming 150 WPM is 100%)
          setCadence(Math.min(100, Math.max(0, (wpm / 150) * 100)));
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsUserSpeaking(false);
      };
    }
  }, []);

  const startSpeaking = () => {
    if (recognitionRef.current && !isAiSpeaking) {
      setCurrentSpeech('');
      speechStartTimeRef.current = Date.now();
      wordCountRef.current = 0;
      setIsUserSpeaking(true);
      recognitionRef.current.start();
    }
  };

  const stopSpeaking = async () => {
    if (recognitionRef.current && isUserSpeaking) {
      recognitionRef.current.stop();
      setIsUserSpeaking(false);
      
      if (currentSpeech.trim().length > 0) {
        const newUserItem: TranscriptItem = {
          id: Date.now(),
          speaker: 'user',
          text: currentSpeech,
          dirtyWords: []
        };
        
        const updatedTranscript = [...transcript, newUserItem];
        setTranscript(updatedTranscript);
        setCurrentSpeech('');
        
        // Call Gemini for AI Response
        setIsAiThinking(true);
        const aiResponse = await generateDebateResponse(
          updatedTranscript.map(t => ({ speaker: t.speaker, text: t.text })),
          persona,
          topic,
          cadence < 40
        );
        setIsAiThinking(false);
        setIsAiSpeaking(true);

        // Update transcript with dirty words for the user's last turn
        if (aiResponse.dirtyWords && aiResponse.dirtyWords.length > 0) {
          setTranscript(prev => {
            const newTranscript = [...prev];
            // Find last user index
            let lastUserIndex = -1;
            for (let i = newTranscript.length - 1; i >= 0; i--) {
              if (newTranscript[i].speaker === 'user') {
                lastUserIndex = i;
                break;
              }
            }
            if (lastUserIndex !== -1) {
              newTranscript[lastUserIndex].dirtyWords = aiResponse.dirtyWords;
            }
            return newTranscript;
          });
          
          // Add to review vault
          setReviewVault(prev => [...prev, ...aiResponse.dirtyWords]);
        }

        // Add AI response to transcript
        setTranscript(prev => [...prev, {
          id: Date.now(),
          speaker: 'ai',
          text: aiResponse.response,
          dirtyWords: []
        }]);

        // Speak AI response
        const utterance = new SpeechSynthesisUtterance(aiResponse.response);
        
        // Try to find a good English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en-') && (v.name.includes('Google') || v.name.includes('Natural')));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        utterance.onstart = () => setIsAiSpeaking(true);
        utterance.onend = () => setIsAiSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const finishDebate = async () => {
    setModuleState('SETTLEMENT');
    const settlement = await generateSettlement(transcript.map(t => ({ speaker: t.speaker, text: t.text })));
    if (settlement.scores) {
      setRadarData([
        { subject: 'Task Fulfilment', A: settlement.scores.taskFulfilment, fullMark: 100 },
        { subject: 'Language', A: settlement.scores.language, fullMark: 100 },
        { subject: 'Fluency', A: settlement.scores.fluency, fullMark: 100 },
      ]);
    }
    if (settlement.band) {
      setPredictedBand(settlement.band);
    }
  };

  const renderTranscriptText = (item: TranscriptItem) => {
    if (!item.dirtyWords || item.dirtyWords.length === 0) return item.text;
    
    let parts = [item.text];
    item.dirtyWords.forEach(dw => {
      const newParts: any[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          // Case insensitive split
          const regex = new RegExp(`(${dw.word})`, 'gi');
          const split = part.split(regex);
          split.forEach((s) => {
            if (s.toLowerCase() === dw.word.toLowerCase()) {
              newParts.push(
                <span key={`${item.id}-${dw.word}-${Math.random()}`} className="inline-block bg-gray-400/80 text-white px-2 py-0.5 rounded-full text-sm mx-1 shadow-inner border border-gray-500">
                  {s}
                </span>
              );
            } else if (s) {
              newParts.push(s);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });
    return parts;
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-cyan-950 overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera Background */}
      {(moduleState === 'SCANNING' || moduleState === 'DEBATE') && (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
        />
      )}

      {/* Header */}
      <div className="relative z-20 flex items-center p-6 bg-gradient-to-b from-cyan-950/80 to-transparent">
        <button onClick={() => {
          window.speechSynthesis.cancel();
          if (recognitionRef.current) recognitionRef.current.stop();
          onBack();
        }} className="p-2 bg-white/20 rounded-full mr-4 hover:bg-white/40 transition-colors backdrop-blur-md shadow-sm">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">AR Debate</h2>
      </div>

      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          
          {/* 2. The Space Scanner */}
          {moduleState === 'SCANNING' && (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 w-full relative"
            >
              {bubbles.map(b => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 0.8, 
                    scale: b.landed ? 1.5 : 1,
                    y: b.landed ? 0 : [0, -20, 0]
                  }}
                  transition={{ duration: 2, repeat: b.landed ? Infinity : 0 }}
                  className={`absolute w-4 h-4 rounded-full blur-[2px] ${b.landed ? 'bg-[#A5D6A7]' : 'bg-white'}`}
                  style={{ left: `${b.x}%`, top: `${b.y}%` }}
                />
              ))}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <DuckAvatar persona="default" />
                <p className="mt-4 text-white font-bold tracking-widest uppercase text-sm bg-cyan-900/50 px-4 py-1 rounded-full backdrop-blur-md">
                  {scanStatus}
                </p>
              </div>
            </motion.div>
          )}

          {/* 3. The Debate Briefing */}
          {moduleState === 'BRIEFING' && (
            <motion.div 
              key="briefing"
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              className="flex-1 w-full flex flex-col items-center p-6 overflow-y-auto"
            >
              <div className="bg-white/10 w-full max-w-sm rounded-b-3xl shadow-2xl p-8 relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-4 bg-yellow-200/50" />
                <h3 className="font-['Caveat',cursive] text-3xl text-white mb-6 leading-relaxed">
                  "{topic}"
                </h3>
                
                <div className="flex items-center justify-between border-t border-white/20 pt-4">
                  <span className="text-white/50 font-bold uppercase text-xs tracking-widest flex items-center">
                    <Clock className="w-4 h-4 mr-2" /> Prep Time
                  </span>
                  <span className="text-2xl font-mono font-bold text-white">
                    {Math.floor(prepTime / 60)}:{(prepTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="mt-8 w-full max-w-sm shrink-0">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl mb-6 shadow-lg">
                  <h4 className="text-cyan-200 font-bold mb-2 text-sm flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" /> How it works
                  </h4>
                  <p className="text-white/80 text-xs leading-relaxed">
                    The AI will track your <strong>Cadence (speed)</strong>. If you struggle or speak too slowly, the AI will automatically simplify its language to help you out.
                  </p>
                </div>

                <h4 className="text-white font-bold mb-4 text-center uppercase tracking-widest text-sm">Select Persona</h4>
                <div className="grid grid-cols-3 gap-3">
                  {(['supporter', 'skeptic', 'aggressor'] as Persona[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPersona(p)}
                      className={`p-3 rounded-2xl flex flex-col items-center transition-all ${persona === p ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50 scale-105' : 'bg-white/10 hover:bg-white/20'}`}
                    >
                      <div className="w-12 h-12 mb-2 relative">
                        <DuckAvatar persona={p} className="scale-50 origin-top-left absolute top-0 left-0" />
                      </div>
                      <span className="text-white text-xs font-bold capitalize">{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setModuleState('DEBATE')}
                className="mt-8 mb-10 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-lg px-10 py-4 rounded-full shadow-xl hover:scale-105 transition-transform shrink-0"
              >
                Start Debate
              </button>
            </motion.div>
          )}

          {/* 4. The Active Debate HUD */}
          {moduleState === 'DEBATE' && (
            <motion.div 
              key="debate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 w-full flex flex-col p-4"
            >
              {/* Transcript HUD */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {transcript.map(item => (
                  <motion.div 
                    initial={{ opacity: 0, x: item.speaker === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.id} 
                    className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl backdrop-blur-md shadow-lg ${
                      item.speaker === 'user' 
                        ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-100 rounded-br-none' 
                        : 'bg-blue-500/20 border border-blue-400/50 text-blue-100 rounded-bl-none'
                    }`}>
                      <p className="font-medium leading-relaxed">
                        {renderTranscriptText(item)}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isUserSpeaking && currentSpeech && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[80%] p-4 rounded-2xl backdrop-blur-md shadow-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-100/70 rounded-br-none">
                      <p className="font-medium leading-relaxed italic">
                        {currentSpeech}...
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Dual-Timer Bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden flex mb-6 shadow-inner">
                <motion.div 
                  className="h-full bg-emerald-400" 
                  animate={{ width: `${userTime}%` }} 
                  transition={{ duration: 0.5 }}
                />
                <motion.div 
                  className="h-full bg-blue-500" 
                  animate={{ width: `${100 - userTime}%` }} 
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Cadence Tracker */}
              {isUserSpeaking && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">Cadence</span>
                    <span className="text-[10px] font-bold text-cyan-200">{Math.round(cadence)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full ${cadence < 40 ? 'bg-fuchsia-500' : cadence < 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      animate={{ width: `${cadence}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {cadence < 40 && (
                    <p className="text-xs text-fuchsia-400 font-bold mt-1 text-center">
                      Breathe. The AI will simplify its next prompt.
                    </p>
                  )}
                </div>
              )}

              {/* Controls & Duck Guide */}
              <div className="flex justify-between items-end h-40 relative">
                <div className="flex-1 flex justify-center items-center relative">
                  {isUserSpeaking && (
                    <motion.div 
                      className="absolute w-24 h-24 bg-fuchsia-500/30 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                  <button
                    onClick={isUserSpeaking ? stopSpeaking : startSpeaking}
                    disabled={isAiSpeaking || isAiThinking}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all relative z-10 ${
                      isAiSpeaking || isAiThinking ? 'bg-gray-600 text-gray-400 cursor-not-allowed' :
                      isUserSpeaking ? 'bg-fuchsia-500 text-white shadow-fuchsia-500/50' : 'bg-emerald-500 text-white shadow-emerald-500/50 hover:scale-105'
                    }`}
                  >
                    {isUserSpeaking ? (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                        <MicOff className="w-8 h-8" />
                      </motion.div>
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                </div>
                <div className="absolute right-0 bottom-0">
                  <DuckAvatar persona={persona} isSpeaking={isAiSpeaking} isThinking={isAiThinking} />
                </div>
              </div>

              <button 
                onClick={finishDebate}
                className="mt-4 bg-white/10 text-white text-sm font-bold py-2 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-md border border-white/20"
              >
                End Debate & View Analytics
              </button>
            </motion.div>
          )}

          {/* 5. The Settlement Page */}
          {moduleState === 'SETTLEMENT' && (
            <motion.div 
              key="settlement"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 w-full flex flex-col p-6 overflow-y-auto"
            >
              <GlassCard className="mb-6 flex flex-col items-center bg-white/10 border-white/20">
                <h3 className="text-cyan-100 font-bold tracking-widest uppercase text-sm mb-2">Predicted Band</h3>
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-lg">
                  {predictedBand}
                </div>
              </GlassCard>

              <GlassCard className="mb-6 bg-white/10 border-white/20 p-2">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#A5F3FC', fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Performance" dataKey="A" stroke="#FDE047" strokeWidth={3} fill="#FEF08A" fillOpacity={0.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <div className="flex-1 space-y-8">
                <div>
                  <h3 className="text-cyan-100 font-bold tracking-widest uppercase text-sm mb-4 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-400" /> The Review Vault
                  </h3>
                  <div className="space-y-3">
                    {reviewVault.length === 0 ? (
                      <p className="text-cyan-200 text-sm italic">No major errors detected. Great job!</p>
                    ) : (
                      reviewVault.map((item, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between">
                          <div className="bg-gray-400/80 text-white px-3 py-1 rounded-full text-sm font-bold shadow-inner">
                            {item.word}
                          </div>
                          <ArrowLeft className="w-4 h-4 text-cyan-300 rotate-180 mx-2" />
                          <div className="text-emerald-300 font-bold text-sm text-right">
                            {item.correction}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-cyan-100 font-bold tracking-widest uppercase text-sm mb-4 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-emerald-400" /> Full Transcript
                  </h3>
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl space-y-4">
                    {transcript.map((item, idx) => (
                      <div key={idx} className={`flex flex-col ${item.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] uppercase tracking-widest text-cyan-500/70 mb-1 font-bold">
                          {item.speaker === 'user' ? 'You' : 'AI'}
                        </span>
                        <div className={`p-3 rounded-2xl text-sm ${
                          item.speaker === 'user' 
                            ? 'bg-emerald-500/20 text-emerald-100 rounded-br-none' 
                            : 'bg-blue-500/20 text-blue-100 rounded-bl-none'
                        }`}>
                          {renderTranscriptText(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={onBack}
                className="mt-8 bg-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/30 transition-colors backdrop-blur-md border border-white/30"
              >
                Return to Pond
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

