import React from 'react';
import { Volume2, Sparkles, BookOpen, Layers, ShieldCheck, Zap } from 'lucide-react';
import { EngineType } from '../types/tts';

interface HeaderProps {
  engine: EngineType;
  onEngineChange: (engine: EngineType) => void;
  wordCount: number;
  totalChunks: number;
}

export const Header: React.FC<HeaderProps> = ({
  engine,
  onEngineChange,
  wordCount,
  totalChunks,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-bold text-xl">
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                वाणी <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">100K</span>
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                Hindi TTS Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">
              100,000+ शब्द क्षमता • पुरुष, महिला एवं गंभीर प्रौढ़ आवाजें
            </p>
          </div>
        </div>

        {/* Real-time stats & Engine Switcher */}
        <div className="flex flex-wrap items-center gap-3 justify-center">
          {/* 100K Status Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">
              लोड किया गया: <strong className="text-white font-semibold">{wordCount.toLocaleString('hi-IN')}</strong> शब्द
            </span>
            {totalChunks > 0 && (
              <span className="text-slate-400 border-l border-slate-700 pl-2">
                {totalChunks} भाग
              </span>
            )}
          </div>

          {/* Engine Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => onEngineChange('gemini')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                engine === 'gemini'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio AI (Gemini HD)</span>
            </button>
            <button
              onClick={() => onEngineChange('browser')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                engine === 'browser'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Instant Web Speech</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
