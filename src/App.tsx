import React, { useState } from 'react';
import { Background } from './components/Background';
import { Home } from './components/modules/Home';
import { SpeakingModule } from './components/modules/SpeakingModule';
import { WritingModule } from './components/modules/WritingModule';
import { ReadingModule } from './components/modules/ReadingModule';
import { ListeningModule } from './components/modules/ListeningModule';
import { GrammarHub } from './components/modules/GrammarHub';
import { TiktoklishModule } from './components/modules/TiktoklishModule';
import { SplashScreen } from './components/SplashScreen';
import { AnimatePresence } from 'motion/react';

export default function App() {
  const [currentModule, setCurrentModule] = useState<string>('home');
  const [showSplash, setShowSplash] = useState<boolean>(true);

  const renderModule = () => {
    if (showSplash) {
      return <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />;
    }

    switch (currentModule) {
      case 'speaking':
        return <SpeakingModule key="speaking" onBack={() => setCurrentModule('home')} />;
      case 'writing':
        return <WritingModule key="writing" onBack={() => setCurrentModule('home')} />;
      case 'reading':
        return <ReadingModule key="reading" onBack={() => setCurrentModule('home')} />;
      case 'listening':
        return <ListeningModule key="listening" onBack={() => setCurrentModule('home')} />;
      case 'grammar':
        return <GrammarHub key="grammar" onBack={() => setCurrentModule('home')} />;
      case 'tiktoklish':
        return <TiktoklishModule key="tiktoklish" onBack={() => setCurrentModule('home')} />;
      default:
        return <Home key="home" onNavigate={setCurrentModule} />;
    }
  };

  return (
    <Background isBlack={true}>
      <AnimatePresence mode="wait">
        {renderModule()}
      </AnimatePresence>
    </Background>
  );
}

