import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, wrap } from 'motion/react';
import { X, Heart, Share, Trash2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaMetadata, deleteMediaDocument, toggleFavoriteStatus } from '../../../lib/firebase/media';

interface MediaViewerProps {
  media: MediaMetadata[];
  initialIndex: number;
  onClose: () => void;
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export function MediaViewer({ media, initialIndex, onClose }: MediaViewerProps) {
  const [[page, direction], setPage] = useState([initialIndex, 0]);
  const [showControls, setShowControls] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // We only have 1 image active at a time. The index is wrapped so it loops, or clamped
  const imageIndex = wrap(0, media.length, page);
  const currentMedia = media[imageIndex];

  // Prevent background scrolling behind the viewer
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const paginate = (newDirection: number) => {
    const nextIndex = page + newDirection;
    if (nextIndex >= 0 && nextIndex < media.length) {
      setPage([nextIndex, newDirection]);
    }
  };

  const toggleControls = () => setShowControls(prev => !prev);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black text-white flex flex-col"
    >
      {/* Top Overlay Context Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 z-50 pointer-events-auto"
          >
            <button aria-label="Close" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
              <ChevronLeft className="w-7 h-7" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold tracking-wide">
                {currentMedia.createdAt ? new Date(currentMedia.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {currentMedia.createdAt ? new Date(currentMedia.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
            <button aria-label="Info" onClick={() => setShowInfo(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95">
              <Info className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Gesture Canvas Container */}
      <div 
        className="flex-1 relative overflow-hidden bg-black"
        onClick={toggleControls}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={page}
            src={currentMedia.originalUrl}
            custom={direction}
            variants={{
              enter: (direction: number) => ({
                x: direction > 0 ? 500 : -500,
                opacity: 0,
                scale: 0.95
              }),
              center: {
                zIndex: 1,
                x: 0,
                opacity: 1,
                scale: 1
              },
              exit: (direction: number) => ({
                zIndex: 0,
                x: direction < 0 ? 500 : -500,
                opacity: 0,
                scale: 0.95
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipeX = swipePower(offset.x, velocity.x);
              
              if (offset.y > 120 || (velocity.y > 500 && offset.y > 50)) {
                onClose(); // Swipe down to dismiss
              } else if (offset.y < -120 || (velocity.y < -500 && offset.y < -50)) {
                setShowInfo(true); // Swipe up to reveal Info Drawer
              } else if (swipeX < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipeX > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 w-full h-full object-contain pointer-events-auto"
            alt="Current media preview"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
      </div>

      {/* Side Desktop Chevrons (only visible on mouse hover or transparent overlays) */}
      <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none z-40">
        <button 
          aria-label="Previous image"
          className={`p-3 bg-black/50 backdrop-blur-md rounded-full pointer-events-auto transition-opacity ${page === 0 ? 'opacity-0' : 'opacity-100 hover:bg-black/70'}`}
          onClick={(e) => { e.stopPropagation(); paginate(-1); }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          aria-label="Next image"
          className={`p-3 bg-black/50 backdrop-blur-md rounded-full pointer-events-auto transition-opacity ${page === media.length - 1 ? 'opacity-0' : 'opacity-100 hover:bg-black/70'}`}
          onClick={(e) => { e.stopPropagation(); paginate(1); }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Action Bar (Contextual) */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-around px-6 pb-6 z-50 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button aria-label="Share" className="p-2 text-white hover:text-blue-400 transition-colors active:scale-95"><Share className="w-6 h-6" /></button>
            <button 
              aria-label={currentMedia.isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={(e) => {
                e.stopPropagation();
                if (currentMedia.id) {
                  toggleFavoriteStatus(currentMedia.id, currentMedia.isFavorite || false);
                }
              }}
              className="p-2 text-white transition-colors active:scale-95"
            >
              <Heart className={`w-6 h-6 ${currentMedia.isFavorite ? 'text-red-500 fill-red-500 hover:text-red-400' : 'hover:text-red-500'}`} />
            </button>
            <button 
              aria-label="Delete"
              onClick={async (e) => {
                e.stopPropagation();
                if (window.confirm("Drop Photo? This item will be permanently deleted from Cloud Storage.")) {
                  if (currentMedia.id) {
                    await deleteMediaDocument(currentMedia.id);
                    onClose();
                  }
                }
              }}
              className="p-2 text-white hover:text-red-500 transition-colors active:scale-95"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe-Up Contextual Info Drawer */}
      <AnimatePresence>
        {showInfo && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 z-[110]"
              onClick={() => setShowInfo(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 80 || velocity.y > 200) {
                  setShowInfo(false);
                }
              }}
              className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl pt-2 pb-10 px-6 z-[120] max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-6" />
              
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="bg-zinc-800/60 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[11px] font-bold text-zinc-400 mb-3 uppercase tracking-wider">Information</h3>
                  <div className="flex justify-between items-center py-2 border-b border-zinc-700/50">
                    <span className="text-white text-sm font-medium">Uploaded</span>
                    <span className="text-zinc-400 text-sm">
                      {currentMedia.createdAt ? new Date(currentMedia.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-white text-sm font-medium">File Type</span>
                    <span className="text-zinc-400 text-sm">JPEG Image (Original)</span>
                  </div>
                </div>

                <div className="bg-zinc-800/60 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-[11px] font-bold text-zinc-400 mb-3 uppercase tracking-wider">Machine Intelligence</h3>
                  {currentMedia.analysis ? (
                    <div className="space-y-5">
                      {currentMedia.analysis.geminiResult && (
                         <div className="p-3 bg-zinc-900/50 rounded-xl">
                           <p className="text-[14px] font-medium leading-relaxed tracking-tight text-white/90">
                             {currentMedia.analysis.geminiResult}
                           </p>
                           <span className="text-[10px] text-zinc-500 mt-2 block font-bold uppercase tracking-wider">Cloud Engine (Gemini)</span>
                         </div>
                      )}
                      
                      {Object.keys(currentMedia.analysis).filter(k => typeof currentMedia.analysis![k] === 'number').length > 0 && (
                        <div>
                          <span className="text-[10px] text-zinc-500 mb-2 block font-bold uppercase tracking-wider">Edge Tensor Embeddings</span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(currentMedia.analysis)
                              .filter(([key, value]) => typeof value === 'number')
                              .map(([tag, probability]) => (
                               <span key={tag} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-medium tracking-wide shadow-sm">
                                 {tag} <span className="opacity-60 text-xs ml-1">{Math.round((probability as number) * 100)}%</span>
                               </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-500 flex items-center h-12">
                      <p className="text-sm font-medium">No ML insight available for this payload.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
