import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { apps } from '../../data/apps';
import { SettingsApp } from '../apps/Settings/SettingsApp';
import { PhotosApp } from '../apps/Photos/PhotosApp';

interface AppWindowProps {
  key?: React.Key;
  appId: string;
  onClose: () => void;
}

export function AppWindow({ appId, onClose }: AppWindowProps) {
  const app = apps.find(a => a.id === appId);

  if (!app) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.9 }}
      className="absolute inset-0 z-30 bg-black flex flex-col pt-12"
    >
      {appId === 'settings' ? (
        <div className="flex-1 relative overflow-hidden bg-black rounded-t-[32px]">
          <SettingsApp onClose={onClose} />
        </div>
      ) : appId === 'photos' ? (
        <div className="flex-1 relative overflow-hidden bg-black rounded-t-[32px]">
          <PhotosApp onClose={onClose} />
        </div>
      ) : (
        <>
          {/* App Header / Top Navigation */}
          <div className="h-14 flex items-center px-2 border-b border-white/10 bg-black/80 backdrop-blur-2xl z-10 rounded-t-[32px]">
            <button 
              onClick={onClose}
              className="flex items-center text-blue-500 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg active:opacity-70"
            >
              <ChevronLeft className="w-6 h-6 -ml-1" strokeWidth={2.5} />
              <span className="text-[17px] font-normal tracking-tight">Home</span>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-white tracking-tight">
              {app.name}
            </div>
          </div>

          {/* App Content Area */}
          <div className="flex-1 relative overflow-hidden bg-[#000]">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex flex-col items-center justify-center h-full text-white/50 p-8 text-center">
              <app.icon className="w-20 h-20 mb-6 opacity-30" strokeWidth={1} />
              <h2 className="text-2xl font-semibold text-white/90 mb-2 tracking-tight">{app.name}</h2>
              <p className="max-w-xs text-[15px] leading-relaxed text-white/50">
                Shell preview for {app.name}. Internal logic will be implemented in future phases.
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
