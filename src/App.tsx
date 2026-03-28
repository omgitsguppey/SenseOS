import React, { useState, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import { StatusBar } from './components/OS/StatusBar';
import { Wallpaper } from './components/OS/Wallpaper';
import { AuthProvider } from './lib/firebase/AuthProvider';

const HomeScreen = React.lazy(() => import('./components/OS/HomeScreen').then(module => ({ default: module.HomeScreen })));
const AppWindow = React.lazy(() => import('./components/OS/AppWindow').then(module => ({ default: module.AppWindow })));

export default function App() {
  const [activeApp, setActiveApp] = useState<string | null>(null);

  return (
    <AuthProvider>
      <div className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-blue-500/30">
        <Wallpaper />
        <StatusBar />
        
        <Suspense fallback={<div className="flex items-center justify-center w-full h-full text-white">Loading...</div>}>
          <AnimatePresence mode="wait">
            {activeApp === null ? (
              <HomeScreen key="home" onLaunchApp={setActiveApp} />
            ) : (
              <AppWindow key="app-window" appId={activeApp} onClose={() => setActiveApp(null)} />
            )}
          </AnimatePresence>
        </Suspense>
      </div>
    </AuthProvider>
  );
}
