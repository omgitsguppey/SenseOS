import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, Search, Library, Zap, Database, Plus, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '../../../store/auth';
import { uploadMedia, subscribeToMedia, MediaMetadata } from '../../../lib/firebase/media';

type PhotosTab = 'library' | 'collections' | 'search' | 'utilities' | 'storage';

// ⚡ Bolt Performance Optimization:
// Memoized MediaGrid prevents the entire photo library from re-rendering
// during frequent state updates like upload progress ticks.
// Added loading="lazy" to defer loading off-screen images.
const MediaGrid = React.memo(({ media }: { media: MediaMetadata[] }) => (
  <div className="grid grid-cols-3 gap-1">
    {media.map((item) => (
      <div key={item.id} className="aspect-square bg-zinc-800 rounded-sm overflow-hidden relative group">
        <img
          src={item.originalUrl}
          alt="Media"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
      </div>
    ))}
  </div>
));

export function PhotosApp() {
  const [activeTab, setActiveTab] = useState<PhotosTab>('library');
  const [media, setMedia] = useState<MediaMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToMedia(user.uid, (newMedia) => {
      setMedia(newMedia);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user || files.length === 0) return;

    setUploading(true);
    setErrors([]);
    
    const newUploads = Array.from(files).map(f => ({ id: Math.random().toString(36).substring(2, 15), file: f }));
    
    // Initialize progress to 0 for all files
    const initialProgress: Record<string, number> = {};
    newUploads.forEach(u => { initialProgress[u.id] = 0; });
    setUploadProgress(prev => ({ ...prev, ...initialProgress }));

    const uploadPromises = newUploads.map(async ({ id, file }) => {
      try {
        await uploadMedia(user.uid, file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [id]: progress }));
        });
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
    
    // Reset file input so the same file can be selected again
    event.target.value = '';
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const tabs: { id: PhotosTab; label: string; icon: React.ElementType }[] = [
    { id: 'library', label: 'Library', icon: Image },
    { id: 'collections', label: 'Collections', icon: Library },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'utilities', label: 'Utilities', icon: Zap },
    { id: 'storage', label: 'Storage', icon: Database },
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'library' && (
            <motion.div 
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[28px] font-bold tracking-tight">Library</h2>
                <label className="bg-white/10 p-2.5 rounded-full cursor-pointer hover:bg-white/20 transition-colors active:scale-95">
                  <Plus className="w-5 h-5" />
                  <input 
                    type="file" 
                    accept="image/*,video/*" 
                    multiple 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>
              
              {/* Upload Progress */}
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
                              <motion.div 
                                className="h-full bg-blue-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "linear", duration: 0.2 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Errors */}
              <AnimatePresence>
                {errors.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 space-y-2 overflow-hidden"
                  >
                    {errors.map((err, i) => (
                      <div key={i} className="flex items-start space-x-3 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span className="flex-1 leading-relaxed">{err}</span>
                        <button onClick={() => setErrors(e => e.filter((_, idx) => idx !== i))} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-white/40 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium">Loading library...</p>
                </div>
              ) : media.length === 0 && !uploading && !justUploaded && Object.keys(uploadProgress).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02] mt-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/5">
                    <Image className="w-8 h-8 text-white/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-white/90 mb-2">
                    No photos yet
                  </h3>
                  <p className="text-sm text-white/50 mb-6 max-w-[240px]">
                    Upload your first photo or video to get started with your library.
                  </p>
                  <label className="bg-white text-black px-6 py-2.5 rounded-full font-medium text-sm cursor-pointer hover:bg-white/90 transition-colors active:scale-95">
                    Upload Media
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </label>
                </div>
              ) : media.length > 0 ? (
                <MediaGrid media={media} />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 p-2 flex justify-around items-center z-40 pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <tab.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Added for better React DevTools debugging
MediaGrid.displayName = 'MediaGrid';
