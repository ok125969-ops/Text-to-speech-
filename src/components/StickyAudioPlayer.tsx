import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Layers,
  Sparkles,
  Loader2,
  Repeat,
} from 'lucide-react';
import { VoiceOption, EngineType } from '../types/tts';
import { downloadBase64Wav } from '../utils/wavHelper';

interface StickyAudioPlayerProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onReplay: () => void;
  currentChunkIndex: number;
  totalChunks: number;
  currentWordCount: number;
  totalWordCount: number;
  voice: VoiceOption;
  engine: EngineType;
  speed: number;
  onSpeedChange: (speed: number) => void;
  autoPlayNext: boolean;
  onToggleAutoPlay: () => void;
  currentAudioBase64?: string;
  onOpenBatchExport: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export const StickyAudioPlayer: React.FC<StickyAudioPlayerProps> = ({
  isPlaying,
  isLoading,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onReplay,
  currentChunkIndex,
  totalChunks,
  currentWordCount,
  totalWordCount,
  voice,
  engine,
  speed,
  onSpeedChange,
  autoPlayNext,
  onToggleAutoPlay,
  currentAudioBase64,
  onOpenBatchExport,
  currentTime,
  duration,
  onSeek,
}) => {
  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  const handleDownload = () => {
    if (currentAudioBase64) {
      downloadBase64Wav(
        currentAudioBase64,
        `vani-hindi-${voice.name.toLowerCase()}-part-${currentChunkIndex + 1}.wav`
      );
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const percentComplete = totalChunks > 0 ? Math.round(((currentChunkIndex + 1) / totalChunks) * 100) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Progress Slider (Scrubber) */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer"
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Layout */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Active Voice & Chunk Metadata */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                {voice.avatarIcon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-[220px]">
                    {voice.hindiName}
                  </h4>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      engine === 'gemini'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {engine === 'gemini' ? 'Studio AI' : 'Web Speech'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="font-mono font-bold text-amber-400">
                    भाग {currentChunkIndex + 1} / {totalChunks || 1}
                  </span>
                  <span>•</span>
                  <span>{percentComplete}% पूरा</span>
                  <span>•</span>
                  <span className="font-mono">{currentWordCount} शब्द</span>
                </div>
              </div>
            </div>

            {/* Continuous Autoplay toggle for small screens */}
            <div className="md:hidden">
              <button
                onClick={onToggleAutoPlay}
                className={`p-2 rounded-xl text-xs flex items-center gap-1 border transition ${
                  autoPlayNext
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="स्वतः अगला भाग चलाएं"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Core Player Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Previous Chunk */}
            <button
              onClick={onPrevious}
              disabled={currentChunkIndex <= 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition"
              title="पिछला भाग (Previous)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Replay */}
            <button
              onClick={onReplay}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="फिर से सुनें (Replay)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Master Play / Pause */}
            <button
              onClick={isPlaying ? onPause : onPlay}
              disabled={isLoading}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-orange-500/30 transition-all"
              title={isPlaying ? 'रोकें (Pause)' : 'सुने (Play)'}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-0.5" />
              )}
            </button>

            {/* Next Chunk */}
            <button
              onClick={onNext}
              disabled={currentChunkIndex >= totalChunks - 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition"
              title="अगला भाग (Next)"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Speed Presets */}
            <div className="hidden lg:flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono transition ${
                    speed === s
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: AutoPlay Toggle, Download, Batch Export */}
          <div className="flex items-center gap-2">
            {/* AutoPlay Toggle (Desktop) */}
            <button
              onClick={onToggleAutoPlay}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                autoPlayNext
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="पूरे 100,000 शब्दों को बिना रुके लगातार चलाएं"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>निरंतर ऑटो-प्ले: {autoPlayNext ? 'चालू' : 'बंद'}</span>
            </button>

            {/* Download Current Part WAV */}
            {currentAudioBase64 && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
                title="वर्तमान भाग का WAV डाउनलोड करें"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">भाग डाउनलोड (.wav)</span>
              </button>
            )}

            {/* Batch Export Full Audio */}
            <button
              onClick={onOpenBatchExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-200 border border-amber-500/40 transition shadow-sm"
              title="100,000 शब्दों का संपूर्ण ऑडियो निर्यात करें"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>संपूर्ण ऑडियो निर्यात (Batch Export)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
