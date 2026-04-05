import React, { useState, Suspense, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { StatusBar } from './components/OS/StatusBar';
import { Wallpaper } from './components/OS/Wallpaper';
import { AuthProvider } from './lib/firebase/AuthProvider';
import { useOSStore } from './store/os';

const HomeScreen = React.lazy(() => import('./components/OS/HomeScreen').then(module => ({ default: module.HomeScreen })));
const AppWindow = React.lazy(() => import('./components/OS/AppWindow').then(module => ({ default: module.AppWindow })));

export default function App() {
  const processes = useOSStore(state => state.processes);
  const launchApp = useOSStore(state => state.launchApp);

  useEffect(() => {
    // Phase 6 Virtual RAM GC Watchdog
    const memoryInterval = setInterval(() => {
      // Free background memory for processes idle longer than 120 seconds
      useOSStore.getState().runMemoryGarbageCollector(120 * 1000); 
    }, 10000);
    return () => clearInterval(memoryInterval);
  }, []);

  return (
    <AuthProvider>
      <div className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-blue-500/30">
        <Wallpaper />
        <StatusBar />
        
        <Suspense fallback={<div className="flex items-center justify-center w-full h-full text-white">Loading...</div>}>
          <HomeScreen key="home" onLaunchApp={launchApp} />
          
          <AnimatePresence>
            {processes.map(proc => (
              <AppWindow key={proc.pid} process={proc} />
            ))}
          </AnimatePresence>
        </Suspense>
      </div>
    </AuthProvider>
  );
}
