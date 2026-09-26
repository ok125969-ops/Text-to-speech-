import React, { useState, useRef } from 'react';
import { TextChunk, VoiceOption, VoiceEmotion, EngineType } from '../types/tts';
import {
  X,
  Layers,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Sparkles,
  Flame,
  Clock,
  UserCheck,
} from 'lucide-react';
import { synthesizeGeminiSpeech } from '../services/ttsService';
import { concatenateWavBlobs, downloadWavBlob } from '../utils/wavHelper';
import { HINDI_VOICES } from '../data/voices';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: TextChunk[];
  voice: VoiceOption;
  emotion: VoiceEmotion;
  engine: EngineType;
  onUpdateChunkAudio: (chunkId: number, audioUrl: string, base64: string) => void;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  chunks,
  voice: initialVoice,
  emotion,
  engine,
  onUpdateChunkAudio,
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(initialVoice);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const [isCombining, setIsCombining] = useState(false);
  const isCancelledRef = useRef(false);

  if (!isOpen) return null;

  const totalChunks = chunks.length;
  const readyChunksCount = chunks.filter((c) => c.audioBase64).length;
  const progressPercent = totalChunks > 0 ? Math.round((readyChunksCount / totalChunks) * 100) : 0;

  // Words calculation
  const totalWords = chunks.reduce((acc, c) => acc + c.wordCount, 0);
  const readyWords = chunks
    .filter((c) => c.audioBase64)
    .reduce((acc, c) => acc + c.wordCount, 0);

  // Convert base64 to Blob helper
  const base64ToBlob = (base64: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/wav' });
  };

  const handleStartBatch = async () => {
    setIsProcessing(true);
    isCancelledRef.current = false;
    setErrorLog([]);

    for (let i = 0; i < chunks.length; i++) {
      if (isCancelledRef.current) {
        setStatusMessage('बैच प्रक्रिया रोक दी गई है।');
        break;
      }

      const chunk = chunks[i];
      setCurrentProcessingIndex(i + 1);

      // If already generated, skip synthesis
      if (chunk.audioBase64) {
        setStatusMessage(`भाग ${chunk.id} (${chunk.wordCount} शब्द) पहले से तैयार है...`);
        continue;
      }

      setStatusMessage(`भाग ${chunk.id} / ${totalChunks} (${chunk.wordCount} शब्द) संश्लेषित हो रहा है...`);

      try {
        const result = await synthesizeGeminiSpeech(chunk.text, selectedVoice, emotion);
        onUpdateChunkAudio(chunk.id, result.audioUrl, result.base64);
      } catch (err: any) {
        console.error(`Error synthesizing chunk ${chunk.id}:`, err);
        setErrorLog((prev) => [...prev, `भाग ${chunk.id}: ${err.message || 'संश्लेषण त्रुटि'}`]);
      }

      // Throttle slightly to respect API rate boundaries
      await new Promise((r) => setTimeout(r, 400));
    }

    setIsProcessing(false);
    if (!isCancelledRef.current) {
      setStatusMessage('सभी उपलब्ध अध्यायों का उच्च-गुणवत्ता ऑडियो तैयार हो चुका है!');
    }
  };

  const handleStopBatch = () => {
    isCancelledRef.current = true;
    setIsProcessing(false);
    setStatusMessage('संश्लेषण रोका गया।');
  };

  const handleDownloadCombined = async () => {
    setIsCombining(true);
    setStatusMessage('सभी 100,000 शब्दों के ऑडियो भागों को एक मास्टर WAV में जोड़ा जा रहा है...');

    try {
      const validBlobs: Blob[] = [];

      for (const chunk of chunks) {
        if (chunk.audioBase64) {
          validBlobs.push(base64ToBlob(chunk.audioBase64));
        }
      }

      if (validBlobs.length === 0) {
        alert('डाउनलोड के लिए कोई ऑडियो तैयार नहीं है। पहले "एकल बैच में प्रारंभ करें" पर क्लिक करें।');
        setIsCombining(false);
        return;
      }

      const combinedBlob = await concatenateWavBlobs(validBlobs);
      downloadWavBlob(
        combinedBlob,
        `vani-hindi-100k-master-${selectedVoice.name.toLowerCase()}.wav`
      );
      setStatusMessage('मास्टर 100K ऑडियो फ़ाइल (.wav) सफलतापूर्वक डाउनलोड हो गई!');
    } catch (err: any) {
      console.error('Error combining audio:', err);
      alert('ऑडियो जोड़ने में समस्या आई: ' + err.message);
    } finally {
      setIsCombining(false);
    }
  };

  // Primary voices for single batch processing
  const adultVoices = HINDI_VOICES.filter((v) => ['fenrir-adult-male', 'kore-warm-female', 'dual-adult-duet'].includes(v.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  100,000 शब्द एकल बैच जनरेटर (Single Batch Processor)
                </h3>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  100K Words
                </span>
              </div>
              <p className="text-xs text-slate-400">
                प्राकृतिक प्रौढ़ पुरुष एवं वयस्क महिला आवाज में पूरा ऑडियो एक साथ बनाएं
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Selection for Batch */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>बैच हेतु आवाज़ चुनें (Adult Voice Selection for Batch):</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {adultVoices.map((v) => {
              const isSelected = selectedVoice.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v)}
                  className={`p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-500/40 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{v.avatarIcon}</span>
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">{v.hindiName}</div>
                      <div className="text-[10px] text-amber-300/80">{v.gender === 'male' ? 'प्रौढ़ पुरुष' : v.gender === 'female' ? 'वयस्क महिला' : 'युगल संवाद'}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">कुल शब्द (Words)</div>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {totalWords.toLocaleString('hi-IN')}
            </div>
            <div className="text-[10px] text-slate-500">{totalChunks} भाग / Chunks</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">तैयार शब्द (Processed)</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
              {readyWords.toLocaleString('hi-IN')}
            </div>
            <div className="text-[10px] text-emerald-400/80">{readyChunksCount} / {totalChunks} भाग</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">अनुमानित अवधि</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1">
              ~{Math.round(totalWords / 140)} मिनट
            </div>
            <div className="text-[10px] text-slate-500">{(totalWords / (140 * 60)).toFixed(1)} घंटे भाषण</div>
          </div>
        </div>

        {/* Progress Display */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-300">
              बैच प्रगति: <span className="text-amber-400 font-mono">{readyWords.toLocaleString('hi-IN')}</span> / {totalWords.toLocaleString('hi-IN')} शब्द
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {progressPercent}% पूर्ण
            </span>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {statusMessage && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{statusMessage}</span>
            </p>
          )}
        </div>

        {/* Error Log */}
        {errorLog.length > 0 && (
          <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-3 text-xs text-rose-300 space-y-1 max-h-24 overflow-y-auto">
            <div className="font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>सचेतक (Errors during batch):</span>
            </div>
            {errorLog.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {isProcessing ? (
            <button
              onClick={handleStopBatch}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
            >
              <Pause className="w-4 h-4" />
              <span>संश्लेषण रोकें (Stop Batch)</span>
            </button>
          ) : (
            <button
              onClick={handleStartBatch}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-orange-500/25 active:scale-95 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {readyChunksCount === totalChunks
                  ? 'पुनः एकल बैच प्रारंभ करें'
                  : 'एकल बैच में सभी 100K शब्द बनाएं (Start Batch)'}
              </span>
            </button>
          )}

          <button
            onClick={handleDownloadCombined}
            disabled={readyChunksCount === 0 || isCombining}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg ${
              readyChunksCount > 0 && !isCombining
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            {isCombining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>मास्टर WAV तैयार हो रहा है...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>संपूर्ण मास्टर ऑडियो (.wav) डाउनलोड करें</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
