import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZoomIn, ZoomOut, Check } from 'lucide-react';

export interface OptionsModalProps {
  showOptionsModal: boolean;
  setShowOptionsModal: (show: boolean) => void;
  gridColumns: number;
  setGridColumns: (cols: number) => void;
  viewFilter: 'all' | 'favorites' | 'videos';
  setViewFilter: (filter: 'all' | 'favorites' | 'videos') => void;
  currentBytesUsed: number;
  storageQuota: number;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  showOptionsModal,
  setShowOptionsModal,
  gridColumns,
  setGridColumns,
  viewFilter,
  setViewFilter,
  currentBytesUsed,
  storageQuota
}) => {
  return (
    <AnimatePresence>
      {showOptionsModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 z-[90]"
            onClick={() => setShowOptionsModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="absolute top-20 right-4 w-64 bg-zinc-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col"
          >
            {/* Grid Zoom Section */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-300">Grid Layout</span>
              <div className="flex items-center space-x-2 bg-zinc-900/50 rounded-full p-1">
                <button
                  aria-label="Zoom out"
                  onClick={() => setGridColumns(Math.min(5, gridColumns + 1))}
                  disabled={gridColumns >= 5}
                  className="p-1.5 rounded-full hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium w-4 text-center">{gridColumns}</span>
                <button
                  aria-label="Zoom in"
                  onClick={() => setGridColumns(Math.max(1, gridColumns - 1))}
                  disabled={gridColumns <= 1}
                  className="p-1.5 rounded-full hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* View Filters Section */}
            <div className="p-2 flex flex-col border-b border-white/5">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-3 pt-2 pb-1">Filter By</span>
              <button onClick={() => { setViewFilter('all'); setShowOptionsModal(false); }} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors text-left text-sm font-medium">
                All Items
                {viewFilter === 'all' && <Check className="w-4 h-4 text-blue-500" />}
              </button>
              <button onClick={() => { setViewFilter('favorites'); setShowOptionsModal(false); }} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors text-left text-sm font-medium">
                Favorites
                {viewFilter === 'favorites' && <Check className="w-4 h-4 text-blue-500" />}
              </button>
              <button onClick={() => { setViewFilter('videos'); setShowOptionsModal(false); }} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors text-left text-sm font-medium">
                Videos
                {viewFilter === 'videos' && <Check className="w-4 h-4 text-blue-500" />}
              </button>
            </div>

            {/* iOS Storage Progress Ruler Section */}
            <div className="p-4 bg-zinc-900/40">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">Library Storage</span>
                <span className="text-[12px] font-semibold text-zinc-200">{(currentBytesUsed / (1024*1024*1024)).toFixed(2)} GB <span className="text-zinc-500">of {(storageQuota / (1024*1024*1024)).toFixed(0)} GB</span></span>
              </div>
              <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (currentBytesUsed / storageQuota) * 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${currentBytesUsed > storageQuota * 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                />
              </div>
              {currentBytesUsed > storageQuota * 0.9 && (
                <p className="text-[10px] text-red-400 mt-2 leading-tight">Storage almost full. Try archiving historical uploads or reducing video constraints.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
