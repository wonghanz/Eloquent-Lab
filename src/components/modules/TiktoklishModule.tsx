import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, MessageCircle, Share2, Mic, Play, User, Flame, TrendingUp, ChevronRight, Download, Link, Instagram, Sparkles, ArrowDown } from 'lucide-react';
import { generateTiktoklishPrompt, evaluateTiktoklishResponse, fastEvaluateTiktoklish, generateTTS, TiktoklishPrompt, TiktoklishFeedback } from '../../services/geminiService';

type TiktoklishState = 'profile' | 'feed' | 'recording' | 'processing' | 'feedback';

export const TiktoklishModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<TiktoklishState>('profile');
  const [streak, setStreak] = useState(7);
  const [totalResponses, setTotalResponses] = useState(42);
  
  const [currentPrompt, setCurrentPrompt] = useState<TiktoklishPrompt | null>(null);
  const [feedback, setFeedback] = useState<TiktoklishFeedback | null>(null);
  
  const [recordingTime, setRecordingTime] = useState(20);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isPlayingImproved, setIsPlayingImproved] = useState(false);
  const [gapTrigger, setGapTrigger] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const improvedAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const gapTriggers = [
    "From broken English → fluent idea 🤯",
    "Can you say it better? 🎤",
    "Improved in 20 seconds ⚡",
    "He improved his English in 20s 🚀"
  ];

  const [recognition, setRecognition] = useState<any>(null);
  const [transcript, setTranscript] = useState("");
  const [processingText, setProcessingText] = useState("Processing...");

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          finalTranscript += event.results[i][0].transcript;
        }
        setTranscript(finalTranscript);
      };
      setRecognition(rec);
    }
  }, []);

  const startRecordingFlow = () => {
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev && prev > 1) return prev - 1;
        clearInterval(countdownRef.current!);
        setCountdown(null);
        startActualRecording();
        return null;
      });
    }, 1000);
  };

  const startActualRecording = () => {
    setGameState('recording');
    setIsRecording(true);
    setRecordingTime(20);
    setTranscript("");
    try {
      if (recognition) recognition.start();
    } catch (e: any) {
      if (e.name !== 'InvalidStateError') {
        console.error("Failed to start recognition", e);
      }
    }
    
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;

    if (gameState === 'processing') {
      setProcessingText("Processing audio...");
      timeout1 = setTimeout(() => setProcessingText("Analyzing grammar..."), 300);
      timeout2 = setTimeout(() => setProcessingText("Improving sentence..."), 800);
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [gameState]);

  const stopRecording = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        if (recognition) recognition.stop();
      } catch (e) {
        console.error("Failed to stop recognition", e);
      }
      setIsRecording(false);
      setGameState('processing');

      let result: TiktoklishFeedback;
      if (transcript.trim().length > 0) {
         result = await fastEvaluateTiktoklish(transcript);
      } else {
         // Fallback
         const simulatedAudioBase64 = "simulated_base64_audio";
         result = await evaluateTiktoklishResponse(simulatedAudioBase64);
      }

      setFeedback(result);
      setTotalResponses(prev => prev + 1);
      setGameState('feedback');
      setShowShareMenu(false);
      setGapTrigger(gapTriggers[Math.floor(Math.random() * gapTriggers.length)]);
    } catch (e) {
      console.error("stopRecording failed", e);
      setGameState('profile');
    }
  };

  const loadNextPrompt = async () => {
    try {
      setGameState('feed');
      setFeedback(null);
      setCurrentPrompt(null);
      setShowShareMenu(false);
      
      const prompt = await generateTiktoklishPrompt();
      setCurrentPrompt(prompt);
      
      if (prompt.audioBase64 && prompt.audioBase64.trim() !== "") {
        try {
          const mimeType = prompt.mimeType || 'audio/wav';
          const audio = new Audio(`data:${mimeType};base64,${prompt.audioBase64}`);
          audioRef.current = audio;
          audio.onerror = () => console.error("Failed to load prompt audio source");
          await audio.play();
        } catch (e) {
          console.error("Auto-play prevented or failed", e);
        }
      }
    } catch (e) {
      console.error("loadNextPrompt failed", e);
    }
  };

  const handleSwipeNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (improvedAudioRef.current) {
      improvedAudioRef.current.pause();
    }
    loadNextPrompt();
  };

  const playImprovedAudio = async () => {
    if (!feedback) return;
    
    setIsPlayingImproved(true);
    
    let audioBase64 = feedback.betterAudioBase64;
    let mimeType = feedback.betterAudioMimeType || 'audio/wav';
    
    if (!audioBase64) {
      const ttsResult = await generateTTS(feedback.betterVersion);
      audioBase64 = ttsResult.audioBase64;
      mimeType = ttsResult.mimeType;
      // Cache it back
      setFeedback(prev => prev ? { ...prev, betterAudioBase64: audioBase64, betterAudioMimeType: mimeType } : null);
    }
    
    if (audioBase64 && audioBase64.trim() !== "") {
      if (improvedAudioRef.current) {
        improvedAudioRef.current.pause();
      }
      try {
        const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
        improvedAudioRef.current = audio;
        audio.onended = () => setIsPlayingImproved(false);
        audio.onerror = () => {
          console.error("Failed to load improved audio source");
          setIsPlayingImproved(false);
        };
        await audio.play();
      } catch (e) {
        console.error("Play improved audio failed", e);
        setIsPlayingImproved(false);
      }
    } else {
      setIsPlayingImproved(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (improvedAudioRef.current) improvedAudioRef.current.pause();
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-black text-white overflow-hidden rounded-3xl relative">
      
      {/* Profile State */}
      {gameState === 'profile' && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="flex-1 flex flex-col items-center justify-center p-8 bg-black"
        >
          <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-fuchsia-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-pink-500/20">
            <User className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-black mb-8">Hanz</h2>
          
          <div className="w-full max-w-sm space-y-4 mb-12">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center">
                <Flame className="w-6 h-6 text-orange-500 mr-3" />
                <span className="font-bold text-lg">Streak</span>
              </div>
              <span className="font-black text-xl">{streak} days</span>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center">
                <Mic className="w-6 h-6 text-cyan-500 mr-3" />
                <span className="font-bold text-lg">Total Responses</span>
              </div>
              <span className="font-black text-xl">{totalResponses}</span>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <div className="flex items-center mb-3">
                <TrendingUp className="w-6 h-6 text-emerald-500 mr-3" />
                <span className="font-bold text-lg">Improvements</span>
              </div>
              <ul className="text-slate-400 space-y-2 text-sm font-medium ml-9">
                <li>- Longer sentences</li>
                <li>- Better clarity</li>
              </ul>
            </div>
          </div>
          
          <button 
            onClick={loadNextPrompt}
            className="w-full max-w-sm py-4 bg-white text-black font-black text-xl rounded-full hover:scale-105 transition-transform"
          >
            Start Session
          </button>
        </motion.div>
      )}

      {/* Feed & Recording & Feedback States */}
      {gameState !== 'profile' && (
        <div className="flex-1 relative bg-black">
          {/* Top Nav */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent">
            <button onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              if (improvedAudioRef.current) improvedAudioRef.current.pause();
              setGameState('profile');
            }} className="p-2">
              <ArrowLeft className="w-6 h-6 text-white drop-shadow-md" />
            </button>
            <div className="flex space-x-4 font-bold text-lg drop-shadow-md">
              <span className="text-white/60">Following</span>
              <span className="text-white border-b-2 border-white pb-1">For You</span>
            </div>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          {/* Main Content Area */}
          <AnimatePresence mode="wait">
            {gameState === 'feed' && currentPrompt && (
              <motion.div 
                key="feed"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8"
              >
                <h2 className="text-4xl md:text-5xl font-black text-center leading-tight drop-shadow-lg">
                  "{currentPrompt.statement}"
                </h2>
                
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30">
                    <motion.span 
                      key={countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="text-9xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                    >
                      {countdown}
                    </motion.span>
                  </div>
                )}
              </motion.div>
            )}

            {gameState === 'recording' && (
              <motion.div 
                key="recording"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/80 backdrop-blur-md"
              >
                <div className="flex items-center space-x-3 mb-12">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-500 font-bold text-xl tracking-widest uppercase">Recording... {recordingTime}s</span>
                </div>
                
                <h2 className="text-3xl font-black text-center text-white/50 mb-16">
                  "{currentPrompt?.statement}"
                </h2>
                
                {/* Simulated Waveform */}
                <div className="flex items-center justify-center space-x-1 h-24 mb-16">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                      transition={{ repeat: Infinity, duration: 1 + Math.random(), ease: "easeInOut" }}
                      className="w-2 bg-gradient-to-t from-pink-500 to-cyan-500 rounded-full"
                    />
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full max-w-xs h-2 bg-white/20 rounded-full overflow-hidden mb-8">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 20, ease: "linear" }}
                    className="h-full bg-white"
                  />
                </div>
                
                <button 
                  onClick={stopRecording}
                  className="px-8 py-3 bg-white/10 border border-white/20 rounded-full font-bold text-white/80 hover:bg-white/20 transition-colors"
                >
                  Release to stop
                </button>
              </motion.div>
            )}

            {gameState === 'processing' && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                  <span className="font-bold text-white/60">{processingText}</span>
                </div>
              </motion.div>
            )}

            {gameState === 'feedback' && feedback && (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={(e, info) => {
                  if (info.offset.y < -50) handleSwipeNext(); // Swipe up
                }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-black text-emerald-400 mb-1">✨ Great Response!</h3>
                  <p className="text-white/60 font-medium">You expressed your opinion clearly!</p>
                </div>

                <div className="w-full max-w-sm bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl mb-6">
                  <div className="mb-6">
                    <span className="text-white/50 text-sm font-bold uppercase tracking-widest">You:</span>
                    <p className="text-xl font-medium mt-2">"{feedback.userTranscript}"</p>
                  </div>
                  
                  <div className="mb-6">
                    <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest flex items-center">
                      <Sparkles className="w-4 h-4 mr-1" /> Better Version:
                    </span>
                    <p className="text-2xl font-black mt-2 text-white">"{feedback.betterVersion}"</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-sm font-bold">
                      {feedback.improvement}
                    </div>
                    
                    <button 
                      onClick={playImprovedAudio}
                      className="p-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full hover:bg-cyan-500/30 transition-colors flex items-center"
                    >
                      {isPlayingImproved ? <div className="w-4 h-4 bg-cyan-400 rounded-sm" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* Share Button */}
                <button 
                  onClick={() => setShowShareMenu(true)}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black rounded-full shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:scale-105 transition-transform flex items-center"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Clip
                </button>
                
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute bottom-12 flex flex-col items-center text-white/50"
                >
                  <span className="font-bold text-sm mb-2">Swipe for next</span>
                  <ChevronRight className="w-6 h-6 rotate-90" />
                </motion.div>

                {/* Share Menu Overlay */}
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: "100%" }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-end"
                    >
                      <div className="w-full bg-slate-900 rounded-t-3xl p-6 border-t border-white/10 flex flex-col items-center max-h-[90vh] overflow-y-auto">
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6" />
                        
                        <div className="flex justify-between items-center w-full mb-6">
                          <h3 className="text-xl font-black">Share "English Reaction"</h3>
                          <button onClick={() => setShowShareMenu(false)} className="p-2 bg-white/10 rounded-full">
                            <ArrowDown className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* The Viral Card */}
                        <div className="w-full max-w-sm bg-black border border-white/20 p-6 rounded-2xl mb-6 relative overflow-hidden shadow-2xl">
                          {/* Gap Trigger */}
                          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-center text-xs font-bold py-1.5">
                            {gapTrigger}
                          </div>
                          
                          <div className="mt-6 mb-4">
                            <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Topic</span>
                            <p className="text-white font-bold text-lg">"{currentPrompt?.statement}"</p>
                          </div>
                          
                          <div className="flex flex-col space-y-4">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                              <span className="text-white/40 text-xs font-bold uppercase">User Voice:</span>
                              <p className="text-white/80 italic text-sm mt-1">"{feedback.userTranscript}"</p>
                            </div>
                            
                            <div className="flex justify-center">
                              <ArrowDown className="w-4 h-4 text-fuchsia-500" />
                            </div>
                            
                            <div className="bg-fuchsia-500/10 p-4 rounded-xl border border-fuchsia-500/30">
                              <span className="text-fuchsia-400 text-xs font-bold uppercase flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" /> AI Upgrade:
                              </span>
                              <p className="text-white font-bold text-xl mt-2 leading-tight">"{feedback.betterVersion}"</p>
                              
                              {/* Fake Waveform */}
                              <div className="mt-4 flex items-center justify-center space-x-1 h-8">
                                {[...Array(20)].map((_, i) => (
                                  <motion.div 
                                    key={i} 
                                    animate={{ height: ['20%', '100%', '40%', '80%', '20%'] }}
                                    transition={{ repeat: Infinity, duration: 1 + Math.random(), ease: "easeInOut" }}
                                    className="w-1.5 bg-fuchsia-400 rounded-full" 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                                <Mic className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-white/60 text-xs font-bold">SpeakLoop AI</span>
                            </div>
                            <span className="text-fuchsia-400 text-xs font-bold bg-fuchsia-400/10 px-3 py-1.5 rounded-full">Reply with your version</span>
                          </div>
                        </div>

                        {/* Share Actions */}
                        <div className="grid grid-cols-4 gap-4 w-full max-w-sm">
                          <button className="flex flex-col items-center justify-center p-3 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-2xl hover:opacity-90 transition-opacity">
                            <Instagram className="w-6 h-6 text-white mb-2" />
                            <span className="font-bold text-xs">IG Story</span>
                          </button>
                          <button className="flex flex-col items-center justify-center p-3 bg-black border border-white/20 rounded-2xl hover:bg-white/5 transition-colors">
                            <img src="https://icon2.cleanpng.com/20200922/xqh/transparent-social-media-1713858561643.webp" alt="TikTok" className="w-6 h-6 mb-2 object-contain" />
                            <span className="font-bold text-xs">TikTok</span>
                          </button>
                          <button className="flex flex-col items-center justify-center p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors">
                            <Link className="w-6 h-6 text-white mb-2" />
                            <span className="font-bold text-xs">Copy Link</span>
                          </button>
                          <button className="flex flex-col items-center justify-center p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors">
                            <Download className="w-6 h-6 text-white mb-2" />
                            <span className="font-bold text-xs">Save MP3</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Sidebar (TikTok style) */}
          {gameState === 'feed' && (
            <div className="absolute right-4 bottom-24 flex flex-col space-y-6 items-center z-20">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md mb-1">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">1.2M</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md mb-1">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">402</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md mb-1">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-bold drop-shadow-md">Share</span>
              </div>
            </div>
          )}

          {/* Bottom Record Button (Feed State) */}
          {gameState === 'feed' && countdown === null && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
              <button 
                onClick={startRecordingFlow}
                className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:scale-105 transition-transform active:scale-95"
              >
                <Mic className="w-8 h-8 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
