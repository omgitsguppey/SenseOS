import { create } from 'zustand';
import { MetricKit } from '../lib/os/MetricKit';

export interface Process {
  pid: string;
  appId: string;
  status: 'foreground' | 'background';
  zIndex: number;
  launchedAt: number;
  lastActiveAt: number;
}

interface OSState {
  processes: Process[];
  topZIndex: number;
  activeAppId: string | null;

  launchApp: (appId: string) => void;
  backgroundApp: (pid: string) => void;
  terminateApp: (pid: string) => void;
  runMemoryGarbageCollector: (maxIdleTimeMs?: number) => void;
  closeAll: () => void;
}

export const useOSStore = create<OSState>((set, get) => ({
  processes: [],
  topZIndex: 10,
  activeAppId: null,

  launchApp: (appId) => {
    const state = get();
    const existingProcess = state.processes.find(p => p.appId === appId);
    const newZIndex = state.topZIndex + 1;

    if (existingProcess) {
      // Background all other processes, bring this one to foreground
      set({
        processes: state.processes.map(p => 
          p.pid === existingProcess.pid 
            ? { ...p, status: 'foreground', zIndex: newZIndex, lastActiveAt: Date.now() }
            : { ...p, status: 'background' }
        ),
        topZIndex: newZIndex,
        activeAppId: appId
      });
    } else {
      // Spawn new process
      const pid = `pid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newProcess: Process = {
        pid,
        appId,
        status: 'foreground',
        zIndex: newZIndex,
        launchedAt: Date.now(),
        lastActiveAt: Date.now()
      };
      
      // Update store, throwing all others into the background natively
      set({
        processes: [...state.processes.map(p => ({ ...p, status: 'background' as const })), newProcess],
        topZIndex: newZIndex,
        activeAppId: appId
      });
    }
  },

  backgroundApp: (pid) => {
    set((state) => {
      const targetProcess = state.processes.find(p => p.pid === pid);
      if (!targetProcess) return state; // Preserve referential equality if pid not found

      const updatedProcesses = state.processes.map(p => 
        p.pid === pid ? { ...p, status: 'background' as const, lastActiveAt: Date.now() } : p
      );
      // Return to HomeScreen (null activeApp) natively
      return {
        processes: updatedProcesses,
        activeAppId: null
      };
    });
  },

  runMemoryGarbageCollector: (maxIdleTimeMs = 3 * 60 * 1000) => { // Default 3 minutes idle time
    set((state) => {
      const now = Date.now();
      // Keep foreground apps, and keep background apps that were active recently
      const survivingProcesses = state.processes.filter(p => {
        if (p.status === 'foreground') return true;
        const idleTime = now - p.lastActiveAt;
        return idleTime < maxIdleTimeMs;
      });

      if (survivingProcesses.length !== state.processes.length) {
        const swept = state.processes.length - survivingProcesses.length;
        console.log(`[OS Kernel] RAM Watchdog terminated ${swept} stale background processes.`);
        // Phase 10: Hardware Memory Profiling natively ingested by MetricKit
        MetricKit.logDiagnostic('gc_sweep', { processesCleared: swept });
        return { processes: survivingProcesses };
      }

      // ⚡ Bolt: Prevent unnecessary re-renders when GC removes nothing
      return state;
    });
  },

  terminateApp: (pid) => {
    set((state) => {
      const updatedProcesses = state.processes.filter(p => p.pid !== pid);
      if (updatedProcesses.length === state.processes.length) return state; // Preserve referential equality if no process was removed
      // If we killed the active app, send user to HomeScreen
      const remainingForeground = updatedProcesses.find(p => p.status === 'foreground');
      return {
        processes: updatedProcesses,
        activeAppId: remainingForeground ? remainingForeground.appId : null
      };
    });
  },

  closeAll: () => {
    set({ processes: [], activeAppId: null });
  }
}));
