import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '../../store/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import { auth } from '../firebase/config';
import { getAuthToken } from '../firebase/authUtils';

// Phase 10: iOS Biome Architecture
// Represents an explicit sequence of contextual parameters building the Pattern of Life Graph
export interface BiomeStream {
  stream_id: string; // event_id
  stream_type: 'AppLaunchStream' | 'AppFocusStream' | 'IntentStream' | 'SearchStream'; // event_name
  session_id: string;
  user_id: string | null;
  device_platform: string;
  app_module: string;
  payload: Record<string, any>; // event_params_json -> Native iOS JSONB structural mapping
  utc_timestamp: string;
}

const SESSION_ID = uuidv4();
const FLUSH_INTERVAL_MS = 6000;
const streamQueue: BiomeStream[] = [];
// Phase 14 Fix: Immutable Agentic RAG Memory Array
// Ensures the mathematical AI generator doesn't drop to 0 contexts when the UI automatically pushes arrays to PostgreSQL!
const _persistentContextArchive: BiomeStream[] = [];

export const Biome = {
  publish: (streamType: BiomeStream['stream_type'], appModule: string, payload: Record<string, any> = {}) => {
    const { privacyConsent, user } = useAuthStore.getState();
    if (!privacyConsent.telemetryEnabled) return;

    const stream: BiomeStream = {
      stream_id: uuidv4(),
      stream_type: streamType,
      session_id: SESSION_ID,
      user_id: user?.uid || null,
      device_platform: getDevicePlatform(),
      app_module: appModule,
      payload,
      utc_timestamp: new Date().toISOString(),
    };

    streamQueue.push(stream);
    
    // Push persistently for local AI contexts independently of node flushing
    _persistentContextArchive.push(stream);
    if (_persistentContextArchive.length > 200) {
      _persistentContextArchive.shift();
    }

    if (streamType === 'IntentStream' || ENVIRONMENT === 'dev') {
      console.log(`[Biome Node] Captured ${streamType}:`, stream);
    }
  },

  getRecentStreams: (count: number = 10): BiomeStream[] => {
    return [..._persistentContextArchive].slice(-count);
  },

  syncDaemon: async () => {
    if (streamQueue.length === 0) return;
    const streamsToFlush = [...streamQueue];
    streamQueue.length = 0;

    try {
      const idToken = await getAuthToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const response = await fetch('/api/telemetry/flush', {
        method: 'POST',
        headers,
        body: JSON.stringify({ events: streamsToFlush, metrics: [], projectId: firebaseConfig.projectId })
      });

      if (!response.ok) throw new Error('Biome Sync Blocked');
    } catch (e) {
      console.error('[Biome Sync] Failed to map SQL:', e);
      streamQueue.push(...streamsToFlush); // Back-pressure queueing
    }
  }
};

const ENVIRONMENT = typeof import.meta.env !== 'undefined' && import.meta.env.MODE === 'production' ? 'prod' : 'dev';

const scheduleBiomeSync = () => {
  const sync = () => {
    if (streamQueue.length > 0) Biome.syncDaemon();
    if (typeof requestIdleCallback !== 'undefined') {
      setTimeout(() => requestIdleCallback(sync), FLUSH_INTERVAL_MS);
    } else {
      setTimeout(sync, FLUSH_INTERVAL_MS);
    }
  };
  requestIdleCallback ? requestIdleCallback(sync) : setTimeout(sync, FLUSH_INTERVAL_MS);
};

scheduleBiomeSync();

function getDevicePlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/mac/.test(ua)) return 'macos';
  if (/win/.test(ua)) return 'windows';
  return 'web';
}

// Phase 10: Legacy Monolithic Pipeline Router
// Transparently intercepts all existing UI TrackingEngine.track commands and redirects them synchronously into the isolated Biome and MetricKit OS pipelines!
import { MetricKit } from './MetricKit';

export const TrackingEngine = {
  track: (eventName: string, appModule: string, route: string, metadata?: Record<string, any>) => {
    // 1. Intercept UI Diagnostic Errors directly to MetricKit
    if (eventName.includes('error_') || eventName.includes('crash_') || eventName.includes('memory_')) {
      MetricKit.logDiagnostic('crash', { errorAction: eventName, route, ...metadata });
      return;
    }

    // 2. Intercept general UI button workflows directly to Biome Intents
    Biome.publish('IntentStream', appModule, {
      action: eventName,
      route,
      ...metadata
    });
  }
};
