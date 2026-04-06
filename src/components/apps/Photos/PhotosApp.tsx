import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, Search, Plus, Loader2, X, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '../../../store/auth';
import { uploadMedia, subscribeToMedia, MediaMetadata } from '../../../lib/firebase/media';
import { db } from '../../../lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { MediaViewer } from './MediaViewer';
import { MediaGrid } from './MediaGrid';
import { OptionsModal } from './OptionsModal';
import { UploadStatus } from './UploadStatus';
import { Collections } from './Collections';
import { extractSemanticTags } from '../../../lib/ai/vision';
import { Biome } from '../../../lib/os/Biome';

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
  const user = useAuthStore(state => state.user);
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
    
    // Phase 12: Biome Integration
    const scrolledPast = currentScrollPosition > libraryBottom + 120;
    if (scrolledPast && !isScrolledToCollections) {
      Biome.publish('IntentStream', 'photos', { action: 'viewed_collections_carousel' });
      setIsScrolledToCollections(true);
    } else if (!scrolledPast && isScrolledToCollections) {
      Biome.publish('IntentStream', 'photos', { action: 'returned_to_grid' });
      setIsScrolledToCollections(false);
    }
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length > 3) {
                  // Phase 12: Siri Contextual Injection hooks natively tracking iOS user inquiries
                  Biome.publish('SearchStream', 'photos', { query: e.target.value });
                }
              }}
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
      <OptionsModal
        showOptionsModal={showOptionsModal}
        setShowOptionsModal={setShowOptionsModal}
        gridColumns={gridColumns}
        setGridColumns={setGridColumns}
        viewFilter={viewFilter}
        setViewFilter={setViewFilter}
        currentBytesUsed={currentBytesUsed}
        storageQuota={storageQuota}
      />

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
          <UploadStatus
            uploading={uploading}
            uploadProgress={uploadProgress}
            errors={errors}
            setErrors={setErrors}
          />
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
            <Collections media={media} />
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
