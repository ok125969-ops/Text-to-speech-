import React, { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Clock,
  Layers,
  Flame,
  Zap,
} from 'lucide-react';
import { SAMPLE_TEXTS, generateMassiveHindiText } from '../data/sampleTexts';
import { TextStats } from '../types/tts';

interface TextInputPanelProps {
  text: string;
  onTextChange: (newText: string) => void;
  stats: TextStats;
  chunkSizeWords: number;
  onChunkSizeChange: (size: number) => void;
  onProcessChunks: () => void;
  totalChunks: number;
}

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  text,
  onTextChange,
  stats,
  chunkSizeWords,
  onChunkSizeChange,
  onProcessChunks,
  totalChunks,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const wordCapacity = 100000;
  const percentageOf100k = Math.min(100, (stats.words / wordCapacity) * 100);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        onTextChange(content);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateLongText = (words: number) => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateMassiveHindiText(words);
      onTextChange(generated);
      setIsGenerating(false);
    }, 50);
  };

  // Convert estimated minutes to Hours and Minutes
  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 60) return `~${minutes} मिनट भाषण`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `~${hours} घंटे ${mins} मिनट भाषण`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>हिंदी टेक्स्ट दर्ज करें (Hindi Text Input)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            यहाँ 1 शब्द से लेकर 100,000 शब्द तक एक साथ पेस्ट या अपलोड कर सकते हैं
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.doc,.docx,.md,.srt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>फ़ाइल अपलोड करें (.txt)</span>
          </button>

          {text && (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'कॉपी हो गया' : 'कॉपी करें'}</span>
              </button>
              <button
                onClick={() => onTextChange('')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>साफ़ करें</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 100,000 Words Capacity Meter */}
      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>शब्द क्षमता (100K Capacity):</span>
            </span>
            <span className="text-amber-400 font-mono font-bold text-sm">
              {stats.words.toLocaleString('hi-IN')}
            </span>
            <span className="text-slate-400 font-mono">/ 1,00,000 शब्द</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <strong className="text-slate-200">{formatEstimatedTime(stats.estimatedMinutes)}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <strong className="text-slate-200">{totalChunks || stats.chunkCount} भाग</strong>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 transition-all duration-300"
            style={{ width: `${Math.max(stats.words > 0 ? 1 : 0, percentageOf100k)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>0 शब्द</span>
          <span className="font-semibold text-slate-300">
            {percentageOf100k.toFixed(1)}% इस्तेमाल
          </span>
          <span>1,00,000 शब्द (पूर्ण ग्रंथ)</span>
        </div>
      </div>

      {/* Preset Library Buttons */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-amber-400" />
          <span>तैयार नमूने लोड करें (Quick Load Samples):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TEXTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onTextChange(sample.text)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700 hover:border-amber-500/50 transition flex items-center gap-1.5 shadow-sm"
            >
              <span>{sample.title.split('-')[0].trim()}</span>
              <span className="text-[10px] text-amber-400/80 font-mono">
                (~{sample.wordCountApprox} शब्द)
              </span>
            </button>
          ))}

          {/* 10K and 100K stress test buttons */}
          <button
            onClick={() => handleGenerateLongText(10000)}
            disabled={isGenerating}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 transition flex items-center gap-1.5"
            title="10,000 शब्दों का बहु-अध्यायी संग्रह तैयार करें"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isGenerating ? 'तैयार हो रहा है...' : '10,000 शब्द जनरेट करें'}</span>
          </button>

          <button
            onClick={() => handleGenerateLongText(100000)}
            disabled={isGenerating}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/50 hover:to-orange-600/50 text-amber-200 border border-amber-500/40 transition flex items-center gap-1.5 font-bold"
            title="पूरा 100,000 शब्दों का महा-संग्रह लोड करें"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>100,000 शब्द लोड करें (Full Test)</span>
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          rows={9}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="यहाँ अपना हिंदी टेक्स्ट लिखें या पेस्ट करें... (उदा. कहानी, उपन्यास, भाषण, धार्मिक प्रवचन, समाचार या पूरी पुस्तक - 100,000 शब्द तक)..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 text-sm md:text-base leading-relaxed font-hindi resize-y"
        />

        <div className="absolute bottom-3 right-4 text-[11px] text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 pointer-events-none">
          {stats.characters.toLocaleString('hi-IN')} अक्षर | {stats.sentences} वाक्य
        </div>
      </div>

      {/* Chunking Settings & Process Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">
            चंक आकार (Chunk Size):
          </label>
          <select
            value={chunkSizeWords}
            onChange={(e) => onChunkSizeChange(parseInt(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value={150}>150 शब्द (तीव्र बफ़रिंग)</option>
            <option value={250}>250 शब्द (अनुशंसित - Balanced)</option>
            <option value={400}>400 शब्द (बड़े पैराग्राफ)</option>
            <option value={600}>600 शब्द (विस्तृत अध्याय)</option>
          </select>
        </div>

        <button
          onClick={onProcessChunks}
          disabled={!text.trim()}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg ${
            text.trim()
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-orange-500/25 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>भाषण के भाग तैयार करें ({totalChunks || stats.chunkCount} भाग)</span>
        </button>
      </div>
    </div>
  );
};
