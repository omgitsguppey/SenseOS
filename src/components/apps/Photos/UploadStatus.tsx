import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, AlertCircle, X } from 'lucide-react';

export interface UploadStatusProps {
  uploading: boolean;
  uploadProgress: Record<string, number>;
  errors: string[];
  setErrors: React.Dispatch<React.SetStateAction<string[]>>;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({
  uploading,
  uploadProgress,
  errors,
  setErrors
}) => {
  return (
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
              <button aria-label="Dismiss error" onClick={() => setErrors(e => e.filter((_, idx) => idx !== i))} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
