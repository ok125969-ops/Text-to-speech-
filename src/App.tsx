import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { TextInputPanel } from './components/TextInputPanel';
import { ChunkNavigator } from './components/ChunkNavigator';
import { ReadingView } from './components/ReadingView';
import { StickyAudioPlayer } from './components/StickyAudioPlayer';
import { BatchExportModal } from './components/BatchExportModal';
import { HINDI_VOICES } from './data/voices';
import { SAMPLE_TEXTS } from './data/sampleTexts';
import {
  TextChunk,
  VoiceOption,
  VoiceEmotion,
  EngineType,
  TextStats,
} from './types/tts';
import { chunkHindiText, calculateTextStats } from './utils/textChunker';
import {
  synthesizeGeminiSpeech,
  speakWithBrowser,
  stopBrowserSpeech,
} from './services/ttsService';
import {
  Volume2,
  BookOpen,
  Sparkles,
  Layers,
  Flame,
  AlertCircle,
  HelpCircle,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

const STORAGE_KEY = 'vani_100k_hindi_tts_state_v1';

export default function App() {
  // Primary State
  const [text, setText] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.text) return parsed.text;
      } catch (e) {}
    }
    return SAMPLE_TEXTS[0].text;
  });

  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = HINDI_VOICES.find((v) => v.id === parsed.voiceId);
        if (match) return match;
      } catch (e) {}
    }
    // Default to Fenrir (Deep Adult Baritone Male Voice)
    return HINDI_VOICES[0];
  });

  const [selectedEmotion, setSelectedEmotion] = useState<VoiceEmotion>('storytelling');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [chunkSizeWords, setChunkSizeWords] = useState<number>(250);
  const [engine, setEngine] = useState<EngineType>('gemini');
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);

  // Playback State
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // UI state
  const [isBatchExportOpen, setIsBatchExportOpen] = useState<boolean>(false);
  const [showInfoBanner, setShowInfoBanner] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'reader'>('editor');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Audio element initialization
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.pause();
    };
  }, []);

  // Compute text statistics
  const stats: TextStats = useMemo(() => {
    return calculateTextStats(text, 140, chunkSizeWords);
  }, [text, chunkSizeWords]);

  // Re-chunk text when text or chunkSizeWords changes
  const handleProcessChunks = useCallback(() => {
    const newChunks = chunkHindiText(text, chunkSizeWords);
    setChunks(newChunks);
    setCurrentChunkIndex(0);
    stopPlayback();
  }, [text, chunkSizeWords]);

  // Initial chunks generation
  useEffect(() => {
    handleProcessChunks();
  }, [handleProcessChunks]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          text,
          voiceId: selectedVoice.id,
          chunkSizeWords,
        })
      );
    } catch (e) {}
  }, [text, selectedVoice, chunkSizeWords]);

  // Notification helper
  const showToast = (message: string) => {
    setStatusNotification(message);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // Stop all playback
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopBrowserSpeech();
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  // Pre-fetch next chunk audio in the background for zero-gap playback
  const prefetchNextChunk = useCallback(
    async (nextIndex: number) => {
      if (engine !== 'gemini') return;
      if (nextIndex >= chunks.length) return;

      const nextChunk = chunks[nextIndex];
      if (nextChunk && !nextChunk.audioUrl) {
        try {
          const result = await synthesizeGeminiSpeech(
            nextChunk.text,
            selectedVoice,
            selectedEmotion
          );
          setChunks((prev) =>
            prev.map((c, i) =>
              i === nextIndex
                ? {
                    ...c,
                    audioUrl: result.audioUrl,
                    audioBase64: result.base64,
                    status: 'ready',
                  }
                : c
            )
          );
        } catch (e) {
          // Pre-fetch failure is non-fatal
        }
      }
    },
    [chunks, engine, selectedVoice, selectedEmotion]
  );

  // Play a specific chunk by index
  const playChunk = useCallback(
    async (chunkIndex: number) => {
      if (chunkIndex < 0 || chunkIndex >= chunks.length) return;

      const targetChunk = chunks[chunkIndex];
      if (!targetChunk) return;

      setCurrentChunkIndex(chunkIndex);
      setIsLoading(true);

      // --- ENGINE 1: GEMINI STUDIO AI ---
      if (engine === 'gemini') {
        try {
          let audioUrl = targetChunk.audioUrl;
          let audioBase64 = targetChunk.audioBase64;

          // If not cached, synthesize now
          if (!audioUrl || !audioBase64) {
            const result = await synthesizeGeminiSpeech(
              targetChunk.text,
              selectedVoice,
              selectedEmotion
            );
            audioUrl = result.audioUrl;
            audioBase64 = result.base64;

            // Cache in chunks state
            setChunks((prev) =>
              prev.map((c, i) =>
                i === chunkIndex
                  ? {
                      ...c,
                      audioUrl: result.audioUrl,
                      audioBase64: result.base64,
                      status: 'ready',
                    }
                  : c
              )
            );
          }

          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.playbackRate = speed;
            await audioRef.current.play();
            setIsPlaying(true);
            setIsLoading(false);

            // Set up onended handler for continuous playback
            audioRef.current.onended = () => {
              if (autoPlayNext && chunkIndex < chunks.length - 1) {
                playChunk(chunkIndex + 1);
              } else {
                setIsPlaying(false);
              }
            };

            // Pre-fetch next chunk while current is playing!
            prefetchNextChunk(chunkIndex + 1);
          }
        } catch (err: any) {
          console.error('Gemini synthesis failed:', err);
          setIsLoading(false);
          setIsPlaying(false);

          showToast('Studio AI नेटवर्क त्रुटि। तुरंत Web Speech इंजन पर स्विच किया जा रहा है...');
          // Seamless fallback to browser speech so playback is never interrupted!
          setEngine('browser');
          speakBrowserChunk(chunkIndex);
        }
      } else {
        // --- ENGINE 2: WEB SPEECH API ---
        speakBrowserChunk(chunkIndex);
      }
    },
    [
      chunks,
      engine,
      selectedVoice,
      selectedEmotion,
      speed,
      pitch,
      autoPlayNext,
      prefetchNextChunk,
    ]
  );

  const speakBrowserChunk = (chunkIndex: number) => {
    const chunk = chunks[chunkIndex];
    if (!chunk) return;

    setIsLoading(false);
    setIsPlaying(true);

    const pitchValue = selectedVoice.gender === 'female' ? pitch * 1.1 : pitch * 0.9;

    currentUtteranceRef.current = speakWithBrowser(chunk.text, {
      rate: speed,
      pitch: pitchValue,
      onEnd: () => {
        if (autoPlayNext && chunkIndex < chunks.length - 1) {
          playChunk(chunkIndex + 1);
        } else {
          setIsPlaying(false);
        }
      },
      onError: (err) => {
        console.error('Browser speech error:', err);
        setIsPlaying(false);
      },
    });
  };

  const handlePlay = () => {
    if (audioRef.current && audioRef.current.src && engine === 'gemini') {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      playChunk(currentChunkIndex);
    }
  };

  const handlePause = () => {
    if (engine === 'gemini' && audioRef.current) {
      audioRef.current.pause();
    } else {
      stopBrowserSpeech();
    }
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    if (currentChunkIndex > 0) {
      playChunk(currentChunkIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentChunkIndex < chunks.length - 1) {
      playChunk(currentChunkIndex + 1);
    }
  };

  const handleReplay = () => {
    playChunk(currentChunkIndex);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current && engine === 'gemini') {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const currentChunk = chunks[currentChunkIndex] || {
    id: 1,
    text: '',
    wordCount: 0,
    charCount: 0,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-32">
      {/* Top Header */}
      <Header
        engine={engine}
        onEngineChange={(newEngine) => {
          stopPlayback();
          setEngine(newEngine);
          showToast(`इंजन बदला: ${newEngine === 'gemini' ? 'Studio AI (Gemini HD)' : 'Web Speech'}`);
        }}
        wordCount={stats.words}
        totalChunks={chunks.length}
      />

      {/* Floating Notification Toast */}
      {statusNotification && (
        <div className="fixed top-20 right-6 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce border border-amber-300">
          <Sparkles className="w-4 h-4" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6 flex-1">
        {/* Banner with 100K Highlight */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 border border-amber-500/30 p-5 lg:p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>100,000 शब्द एक साथ (100K Words Capability)</span>
                </span>
                <span className="text-xs text-amber-300/80 font-medium">
                  • निर्बाध निरंतर वाचन
                </span>
              </div>
              <h2 className="text-lg lg:text-xl font-extrabold text-white">
                हिंदी ग्रंथ, उपन्यास, आध्यात्मिक कथाएं और लंबे आलेख सुनें
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                पुरुष (Male), महिला (Female) और गंभीर प्रौढ़ (Deep Adult Baritone) आवाजों में उच्च गुणवत्ता वाला स्वाभाविक हिंदी वाचन।
              </p>
            </div>

            {/* Quick feature badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>स्मार्ट ऑटो-चंकिंग</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                <span>बैकग्राउंड प्री-बफ़रिंग</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>मास्टर WAV निर्यात</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Selection Section */}
        <VoiceSelector
          selectedVoice={selectedVoice}
          onSelectVoice={(voice) => {
            setSelectedVoice(voice);
            stopPlayback();
          }}
          selectedEmotion={selectedEmotion}
          onSelectEmotion={setSelectedEmotion}
          speed={speed}
          onSpeedChange={handleSpeedChange}
          pitch={pitch}
          onPitchChange={setPitch}
        />

        {/* View Tabs on Mobile/Desktop */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'editor'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>टेक्स्ट संपादन व सेटिंग्स (Editor & Input)</span>
            </button>
            <button
              onClick={() => setActiveTab('reader')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'reader'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>सजीव वाचन मंच (Live Synchronized Reader)</span>
              {isPlaying && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            कुल <strong className="text-white">{chunks.length}</strong> भाग तैयार
          </span>
        </div>

        {/* Content Area */}
        {activeTab === 'editor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TextInputPanel
                text={text}
                onTextChange={setText}
                stats={stats}
                chunkSizeWords={chunkSizeWords}
                onChunkSizeChange={(size) => {
                  setChunkSizeWords(size);
                  setTimeout(handleProcessChunks, 50);
                }}
                onProcessChunks={handleProcessChunks}
                totalChunks={chunks.length}
              />
            </div>
            <div className="lg:col-span-1">
              <ChunkNavigator
                chunks={chunks}
                currentChunkIndex={currentChunkIndex}
                onSelectChunk={(idx) => {
                  playChunk(idx);
                }}
                isPlaying={isPlaying}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ReadingView
                chunks={chunks}
                currentChunkIndex={currentChunkIndex}
                onSelectChunk={(idx) => playChunk(idx)}
                isPlaying={isPlaying}
              />
            </div>
            <div className="lg:col-span-1">
              <ChunkNavigator
                chunks={chunks}
                currentChunkIndex={currentChunkIndex}
                onSelectChunk={(idx) => playChunk(idx)}
                isPlaying={isPlaying}
              />
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Audio Player */}
      <StickyAudioPlayer
        isPlaying={isPlaying}
        isLoading={isLoading}
        onPlay={handlePlay}
        onPause={handlePause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onReplay={handleReplay}
        currentChunkIndex={currentChunkIndex}
        totalChunks={chunks.length}
        currentWordCount={currentChunk.wordCount}
        totalWordCount={stats.words}
        voice={selectedVoice}
        engine={engine}
        speed={speed}
        onSpeedChange={handleSpeedChange}
        autoPlayNext={autoPlayNext}
        onToggleAutoPlay={() => {
          setAutoPlayNext(!autoPlayNext);
          showToast(`निरंतर ऑटो-प्ले: ${!autoPlayNext ? 'चालू' : 'बंद'}`);
        }}
        currentAudioBase64={currentChunk.audioBase64}
        onOpenBatchExport={() => setIsBatchExportOpen(true)}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
      />

      {/* Batch Export Dialog */}
      <BatchExportModal
        isOpen={isBatchExportOpen}
        onClose={() => setIsBatchExportOpen(false)}
        chunks={chunks}
        voice={selectedVoice}
        emotion={selectedEmotion}
        engine={engine}
        onUpdateChunkAudio={(chunkId, audioUrl, base64) => {
          setChunks((prev) =>
            prev.map((c) =>
              c.id === chunkId
                ? { ...c, audioUrl, audioBase64: base64, status: 'ready' }
                : c
            )
          );
        }}
      />
    </div>
  );
}
