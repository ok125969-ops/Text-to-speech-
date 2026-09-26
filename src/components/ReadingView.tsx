import React, { useEffect, useRef, useState } from 'react';
import { TextChunk } from '../types/tts';
import {
  Volume2,
  Play,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { downloadBase64Wav } from '../utils/wavHelper';

interface ReadingViewProps {
  chunks: TextChunk[];
  currentChunkIndex: number;
  onSelectChunk: (index: number) => void;
  isPlaying: boolean;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  chunks,
  currentChunkIndex,
  onSelectChunk,
  isPlaying,
}) => {
  const [fontSize, setFontSize] = useState<number>(18);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const activeChunkRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active chunk when it changes
  useEffect(() => {
    if (autoScroll && activeChunkRef.current) {
      activeChunkRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentChunkIndex, autoScroll]);

  const handleCopyChunk = (chunk: TextChunk) => {
    navigator.clipboard.writeText(chunk.text);
    setCopiedId(chunk.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadChunkAudio = (chunk: TextChunk) => {
    if (chunk.audioBase64) {
      downloadBase64Wav(chunk.audioBase64, `hindi-speech-chunk-${chunk.id}.wav`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full max-h-[720px]">
      {/* Top Reading Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">
            सक्रिय वाचन एवं पठन मंच (Synchronized Reader)
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">
            • वर्तमान भाग: {currentChunkIndex + 1} / {chunks.length}
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              autoScroll
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="बोलते समय ऑटो-स्क्रॉल चालू/बंद करें"
          >
            ऑटो-स्क्रॉल: {autoScroll ? 'चालू' : 'बंद'}
          </button>

          {/* Font Size */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className="p-1 hover:text-white text-slate-400 rounded"
              title="फॉन्ट छोटा करें"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-xs font-mono text-slate-300">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              className="p-1 hover:text-white text-slate-400 rounded"
              title="फॉन्ट बड़ा करें"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chunks Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scroll">
        {chunks.map((chunk, index) => {
          const isCurrent = index === currentChunkIndex;

          return (
            <div
              key={chunk.id}
              ref={isCurrent ? activeChunkRef : null}
              className={`relative rounded-2xl p-5 transition-all duration-300 border ${
                isCurrent
                  ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 border-amber-500/80 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/70'
              }`}
            >
              {/* Chunk Header */}
              <div className="flex items-center justify-between border-b border-slate-800/70 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-md font-mono ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    भाग {chunk.id}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {chunk.wordCount} शब्द
                  </span>
                  {isCurrent && isPlaying && (
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1 animate-pulse">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>वाचन चालू है...</span>
                    </span>
                  )}
                </div>

                {/* Inline Actions */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectChunk(index)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                      isCurrent && isPlaying
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                    title="इस भाग को अभी सुनें"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isCurrent && isPlaying ? 'चल रहा है' : 'यहाँ से सुनें'}</span>
                  </button>

                  {chunk.audioBase64 && (
                    <button
                      onClick={() => handleDownloadChunkAudio(chunk)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition"
                      title="इस भाग का ऑडियो (.wav) डाउनलोड करें"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyChunk(chunk)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                    title="यह भाग कॉपी करें"
                  >
                    {copiedId === chunk.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Chunk Content */}
              <p
                style={{ fontSize: `${fontSize}px` }}
                className={`font-hindi leading-relaxed transition-colors duration-200 ${
                  isCurrent
                    ? 'text-amber-50 font-medium'
                    : 'text-slate-300'
                }`}
              >
                {chunk.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
