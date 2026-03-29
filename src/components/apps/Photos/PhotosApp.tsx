import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, Search, Plus, Loader2, AlertCircle, X, ChevronLeft, User, Heart, Folder, Calendar, MapPin, MoreHorizontal, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { useAuthStore } from '../../../store/auth';
import { uploadMedia, subscribeToMedia, MediaMetadata } from '../../../lib/firebase/media';
import { db } from '../../../lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { MediaViewer } from './MediaViewer';
import { extractSemanticTags } from '../../../lib/ai/vision';

// ⚡ Bolt Performance Optimization:
const MediaGrid = React.memo(({ media, filter, gridColumns, onPhotoClick }: { media: MediaMetadata[], filter: string, gridColumns: number, onPhotoClick: (idx: number) => void }) => {
  // Simulate temporal zoom clustering based on the active pill filter 
  const cols = filter === 'years' ? 'grid-cols-1 gap-2' : filter === 'months' ? 'grid-cols-4 gap-0.5' : 
               gridColumns === 1 ? 'grid-cols-1 gap-1' :
               gridColumns === 2 ? 'grid-cols-2 gap-1' :
               gridColumns === 3 ? 'grid-cols-3 gap-1' :
               gridColumns === 4 ? 'grid-cols-4 gap-1' : 'grid-cols-5 gap-0.5';

  return (
    <div className={`grid ${cols}`}>
      {media.map((item, idx) => (
        <div 
          key={item.id} 
          onClick={() => onPhotoClick(idx)}
          className={`bg-zinc-800 overflow-hidden relative group cursor-pointer ${filter === 'years' ? 'aspect-video rounded-3xl' : 'aspect-square rounded-sm'}`}
        >
          <img
            src={item.originalUrl}
            alt="Media"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
          
          {/* Faux label for 'years' view */}
          {filter === 'years' && idx % 3 === 0 && (
            <div className="absolute bottom-4 left-4 p-4 pointer-events-none">
              <span className="text-3xl font-bold drop-shadow-lg">{2026 - (idx % 4)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
MediaGrid.displayName = 'MediaGrid';

export interface PhotosAppProps {
  onClose: () => void;
}

export function PhotosApp({ onClose }: PhotosAppProps) {
  const [media, setMedia] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified Scroll State
  const [activeFilter, setActiveFilter] = useState<'years' | 'months' | 'all'>('all');
  const [isScrolledToCollections, setIsScrolledToCollections] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  
  // Phase 5 Contextual State
  const [gridColumns, setGridColumns] = useState(3);
  const [viewFilter, setViewFilter] = useState<'all' | 'favorites' | 'videos'>('all');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [storageQuota, setStorageQuota] = useState<number>(5 * 1024 * 1024 * 1024); // 5GB default
  const [searchQuery, setSearchQuery] = useState('');

  const libraryRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentBytesUsed = useMemo(() => {
    return media.reduce((acc, m) => acc + (m.sizeBytes || 0), 0);
  }, [media]);

  const displayedMedia = useMemo(() => {
    let filtered = media;
    if (viewFilter === 'favorites') filtered = filtered.filter(m => m.isFavorite);
    if (viewFilter === 'videos') filtered = filtered.filter(m => m.originalUrl.includes('.mp4') || m.originalUrl.includes('video'));

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => {
        if (!m.analysis) return false;
        // Search the keys of the Machine Learning tags map
        return Object.keys(m.analysis).some(tag => tag.toLowerCase().includes(q) && typeof m.analysis![tag] === 'number');
      });
    }

    return filtered;
  }, [media, viewFilter, searchQuery]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserQuota = async () => {
      try {
        const d = await getDoc(doc(db, 'users', user.uid));
        if (d.exists() && d.data().storageQuotaBytes) setStorageQuota(d.data().storageQuotaBytes);
      } catch (err) { }
    };
    fetchUserQuota();

    const unsubscribe = subscribeToMedia(user.uid, (newMedia) => {
      setMedia(newMedia);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!libraryRef.current) return;
    const libraryBottom = libraryRef.current.offsetTop + libraryRef.current.offsetHeight;
    const currentScrollPosition = e.currentTarget.scrollTop + e.currentTarget.clientHeight;
    
    // If the user scrolls past the grid and into the collections, hide the floating pill
    setIsScrolledToCollections(currentScrollPosition > libraryBottom + 120);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user || files.length === 0) return;

    setUploading(true);
    setErrors([]);
    
    const newUploads = Array.from(files).map(f => ({ id: Math.random().toString(36).substring(2, 15), file: f }));
    
    const initialProgress: Record<string, number> = {};
    newUploads.forEach(u => { initialProgress[u.id] = 0; });
    setUploadProgress(prev => ({ ...prev, ...initialProgress }));

    const uploadPromises = newUploads.map(async ({ id, file }) => {
      try {
        // AI Parity Phase 7: Extract TFJS Semantics visually before network request
        let analysisTags: Record<string, number> = {};
        if (file.type.startsWith('image/')) {
          const objectUrl = URL.createObjectURL(file);
          const img = document.createElement('img');
          img.src = objectUrl;
          await new Promise((resolve) => { img.onload = resolve; });
          analysisTags = await extractSemanticTags(img);
          URL.revokeObjectURL(objectUrl);
        }

        await uploadMedia(user.uid, file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [id]: progress }));
        }, analysisTags);
      } catch (error: any) {
        console.error('Upload failed:', error);
        setErrors(prev => [...prev, `Failed to upload ${file.name}: ${error.message || 'Unknown error'}`]);
      } finally {
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });

    await Promise.all(uploadPromises);
    setJustUploaded(true);
    setUploading(false);
    setTimeout(() => setJustUploaded(false), 2000);
    
    event.target.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-black text-white relative font-sans overflow-hidden">
      
      {/* Absolute Dynamic Header Navigation (iOS Style) */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-50 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        
        {/* Left Side: Back / Home */}
        <div className="flex items-center space-x-4 pointer-events-auto w-full">
          <button 
            onClick={onClose}
            className="flex items-center text-blue-500 hover:text-blue-400 transition-colors py-1 rounded-lg active:opacity-70 flex-shrink-0"
          >
            <ChevronLeft className="w-7 h-7 -ml-2" strokeWidth={2.5} />
            <span className="text-[17px] font-medium tracking-tight">Home</span>
          </button>

          {/* iOS Smart AI Search */}
          <div className="flex-1 max-w-[200px] relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Dog, Beach, Coffee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800/80 backdrop-blur-xl border border-white/10 rounded-full py-1.5 pl-9 pr-3 text-[13px] text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
               >
                 <X className="w-3 h-3 text-white" />
               </button>
            )}
          </div>
        </div>

        {/* Right Side: Account & Upload Actions */}
        <div className="flex items-center space-x-3 pointer-events-auto ml-2 flex-shrink-0">
          {user && (
            <label className="bg-zinc-800/80 p-2.5 rounded-full cursor-pointer hover:bg-zinc-700/80 transition-colors backdrop-blur-xl active:scale-95 text-blue-400 shadow-sm">
              <Plus className="w-5 h-5" strokeWidth={2.5}/>
              <input type="file" accept="image/*,video/*" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            </label>
          )}
          <button 
            onClick={() => setShowOptionsModal(true)}
            className="bg-zinc-800/80 p-2.5 rounded-full cursor-pointer hover:bg-zinc-700/80 transition-colors backdrop-blur-xl active:scale-95 text-zinc-300 shadow-sm"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* iOS Contextual Options Modal */}
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
                    onClick={() => setGridColumns(Math.min(5, gridColumns + 1))}
                    disabled={gridColumns >= 5}
                    className="p-1.5 rounded-full hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium w-4 text-center">{gridColumns}</span>
                  <button 
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

      {/* Monolithic Unified Scroll Canvas */}
      <div 
        className="flex-1 overflow-y-auto w-full no-scrollbar pb-32"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        
        {/* Safe Area Top Offset */}
        <div className="h-20" />

        {/* Upload System UI */}
        <div className="px-4">
          <AnimatePresence>
            {uploading && Object.keys(uploadProgress).length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                  <div className="flex items-center space-x-2 text-sm font-medium text-white/80 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Uploading {Object.keys(uploadProgress).length} item(s)...</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(uploadProgress).map(([id, progress]) => (
                      <div key={id} className="w-full">
                        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                          <motion.div className="h-full bg-blue-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            {errors.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 space-y-2 overflow-hidden px-4">
                {errors.map((err, i) => (
                  <div key={i} className="flex items-start space-x-3 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="flex-1 leading-relaxed">{err}</span>
                    <button onClick={() => setErrors(e => e.filter((_, idx) => idx !== i))} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/40 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Loading library...</p>
          </div>
        ) : media.length === 0 && !uploading && !justUploaded && Object.keys(uploadProgress).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6 border border-dashed border-white/10 rounded-3xl bg-zinc-900/30 mx-4 mt-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/5">
              <Image className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">{user ? 'No Photos or Videos' : 'Sign in Required'}</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-[240px]">
              {user ? 'Upload moments to start capturing your historical feed and intelligent collections.' : 'Please sign in to access your secure Cloud library.'}
            </p>
          </div>
        ) : (
          <>
            {/* The Unified Grid (Top Canvas) */}
            <div ref={libraryRef} className="px-0.5 min-h-[60vh] pb-8">
               <MediaGrid media={displayedMedia} filter={activeFilter} gridColumns={gridColumns} onPhotoClick={setSelectedMediaIndex} />
            </div>

            {/* Apple "Collections" (Bottom Canvas) */}
            <div className="mt-8 px-5 space-y-12 pb-32 border-t border-zinc-900/50 pt-10">
              
              {/* Memory Carousel / Recent Days */}
              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Recent Days</h3>
                    <p className="text-gray-400 text-sm mt-0.5">April & March 2026</p>
                  </div>
                  <button className="text-blue-500 text-sm font-medium">See All</button>
                </div>
                
                <div className="flex overflow-x-auto no-scrollbar space-x-3 pb-4 snap-x">
                  {media.slice(0, 6).map((item, idx) => (
                    <div key={item.id} className="relative w-48 h-64 shrink-0 snap-center rounded-2xl overflow-hidden group border border-white/5">
                      <img src={item.originalUrl} alt="recent" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                      <div className="absolute bottom-4 left-4">
                        <span className="text-sm font-semibold tracking-wide drop-shadow-md">Photo {idx + 1}</span>
                      </div>
                    </div>
                  ))}
                  {media.length < 3 && (
                    <div className="w-48 h-64 shrink-0 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center">
                       <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">More Needed</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pinned Collections */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight mb-2">Pinned Collections</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-zinc-900/80 rounded-[22px] p-5 flex flex-col items-start space-y-3 hover:bg-zinc-800 transition-colors">
                    <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
                    <span className="font-semibold racking-tight">Favorites</span>
                  </button>
                  <button className="bg-zinc-900/80 rounded-[22px] p-5 flex flex-col items-start space-y-3 hover:bg-zinc-800 transition-colors">
                    <Folder className="w-6 h-6 text-blue-500" fill="currentColor"/>
                    <span className="font-semibold tracking-tight">Saved</span>
                  </button>
                  <button className="bg-zinc-900/80 rounded-[22px] p-5 flex flex-col items-start space-y-3 hover:bg-zinc-800 transition-colors">
                    <MapPin className="w-6 h-6 text-green-500" />
                    <span className="font-semibold tracking-tight">Places</span>
                  </button>
                  <button className="bg-zinc-900/80 rounded-[22px] p-5 flex flex-col items-start space-y-3 hover:bg-zinc-800 transition-colors">
                    <Calendar className="w-6 h-6 text-orange-500" />
                    <span className="font-semibold tracking-tight">Events</span>
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </div>

      {/* Dynamic Floating Filter Pill */}
      <AnimatePresence>
        {!isScrolledToCollections && media.length > 0 && selectedMediaIndex === null && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex bg-zinc-800/90 backdrop-blur-3xl rounded-full p-1 border border-white/10 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.8)]"
          >
            {['years', 'months', 'all'].map((filter) => (
              <button 
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`relative px-5 py-2 rounded-full text-[13px] font-semibold tracking-wide capitalize transition-colors duration-300 z-10 ${
                  activeFilter === filter ? 'text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {activeFilter === filter && (
                  <motion.div 
                    layoutId="pip-active"
                    className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {filter}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMediaIndex !== null && (
          <MediaViewer 
            media={media} 
            initialIndex={selectedMediaIndex} 
            onClose={() => setSelectedMediaIndex(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
