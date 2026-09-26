import React, { useState } from 'react';
import { TextChunk } from '../types/tts';
import { ListFilter, Play, CheckCircle, Loader2, Volume2, Search, ArrowRight } from 'lucide-react';

interface ChunkNavigatorProps {
  chunks: TextChunk[];
  currentChunkIndex: number;
  onSelectChunk: (index: number) => void;
  isPlaying: boolean;
}

export const ChunkNavigator: React.FC<ChunkNavigatorProps> = ({
  chunks,
  currentChunkIndex,
  onSelectChunk,
  isPlaying,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChunks = chunks.filter((c) =>
    searchQuery ? c.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full max-h-[580px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-amber-400" />
            <span>अध्याय व भाग सूचकांक (Chapters Index)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            कुल {chunks.length} भाग • किसी भी भाग पर क्लिक करके सीधे सुनें
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-800 text-amber-400 px-2 py-0.5 rounded-lg border border-slate-700">
          {currentChunkIndex + 1} / {chunks.length || 1}
        </span>
      </div>

      {/* Search Input */}
      {chunks.length > 5 && (
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="भागों में खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>
      )}

      {/* Chunks List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
        {filteredChunks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            कोई भाग नहीं मिला।
          </div>
        ) : (
          filteredChunks.map((chunk, idx) => {
            const actualIndex = chunks.findIndex((c) => c.id === chunk.id);
            const isCurrent = actualIndex === currentChunkIndex;

            return (
              <div
                key={chunk.id}
                onClick={() => onSelectChunk(actualIndex)}
                className={`group p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex items-start justify-between gap-2 ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      भाग {chunk.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {chunk.wordCount} शब्द
                    </span>
                    {chunk.audioUrl && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>तैयार</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {chunk.text}
                  </p>
                </div>

                {/* Status icon or play button */}
                <div className="shrink-0 pt-1">
                  {isCurrent && isPlaying ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center animate-pulse">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <button
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 group-hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
