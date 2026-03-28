import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { SettingsHome } from './views/SettingsHome';
import { AccountView } from './views/AccountView';
import { PrivacyView } from './views/PrivacyView';
import { AppPreferencesView } from './views/AppPreferencesView';
import { AdminView } from './views/AdminView';
import { IntelligenceView } from './views/IntelligenceView';
import { TrackingEngine } from '../../../lib/telemetry/engine';

export type SettingsRoute = 
  | 'home' 
  | 'account' 
  | 'privacy' 
  | 'preferences' 
  | 'admin' 
  | 'intelligence';

export interface SettingsAppProps {
  onClose: () => void;
}

export function SettingsApp({ onClose }: SettingsAppProps) {
  const [currentRoute, setCurrentRoute] = React.useState<SettingsRoute>('home');

  useEffect(() => {
    TrackingEngine.track('settings_open', 'settings', 'home');
  }, []);

  const navigate = (route: SettingsRoute) => {
    TrackingEngine.track('settings_section_view', 'settings', route);
    setCurrentRoute(route);
  };

  const goBack = () => {
    setCurrentRoute('home');
  };

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      {/* Settings Header - Proper OS-level navigation */}
      <div className="h-14 flex items-center px-2 border-b border-white/10 bg-[#1C1C1E]/80 backdrop-blur-2xl z-20 shrink-0">
        <button 
          onClick={currentRoute === 'home' ? onClose : goBack}
          className="flex items-center text-blue-500 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg active:opacity-70"
        >
          <ChevronLeft className="w-6 h-6 -ml-1" strokeWidth={2.5} />
          <span className="text-[17px] font-normal tracking-tight">
            {currentRoute === 'home' ? 'Home' : 'Settings'}
          </span>
        </button>
        
        {/* Title only shows if we are deep in a route, or we can keep it static */}
        <div className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold tracking-tight">
          {currentRoute === 'home' ? 'Settings' : ''}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentRoute}
            initial={{ opacity: 0, x: currentRoute === 'home' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: currentRoute === 'home' ? 20 : -20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute inset-0 overflow-y-auto pb-20"
          >
            {currentRoute === 'home' && <SettingsHome onNavigate={navigate} />}
            {currentRoute === 'account' && <AccountView />}
            {currentRoute === 'privacy' && <PrivacyView />}
            {currentRoute === 'preferences' && <AppPreferencesView />}
            {currentRoute === 'admin' && <AdminView />}
            {currentRoute === 'intelligence' && <IntelligenceView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
