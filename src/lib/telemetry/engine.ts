import { SenseEvent, SenseEventName, UserRole } from './types';
import { useAuthStore } from '../../store/auth';
import { analytics, auth } from '../firebase/config';
import { logEvent } from 'firebase/analytics';
import firebaseConfig from '../../../firebase-applet-config.json';

// Layer 1: Tracking Engine
// Handles raw event capture, sessionization, dedupe-safe IDs, and privacy-aware filtering.

const SCHEMA_VERSION = '1.0.0';
const ENVIRONMENT = import.meta.env.MODE === 'production' ? 'prod' : 'dev';

// Generate a session ID once per app load
const SESSION_ID = crypto.randomUUID();

// Simple in-memory queue for batching events before sending to Firestore/Analytics
const eventQueue: SenseEvent[] = [];
const FLUSH_INTERVAL_MS = 5000;

export const TrackingEngine = {
  /**
   * Captures a raw telemetry event.
   * Ensures all required fields (event_id, timestamp, session, role, etc.) are populated.
   */
  track: (
    eventName: SenseEventName | string,
    appModule: string,
    route: string,
    metadata?: Record<string, any>
  ) => {
    // 1. Privacy-Aware Filtering
    const { privacyConsent, role, user } = useAuthStore.getState();
    
    // If telemetry is explicitly disabled and this isn't a critical system event, drop it.
    const isCriticalEvent = ['consent_updated', 'error_render', 'error_action'].includes(eventName);
    if (!privacyConsent.telemetryEnabled && !isCriticalEvent) {
      return;
    }

    // 2. Construct Event Payload
    const event: SenseEvent = {
      event_id: crypto.randomUUID(), // Dedupe-safe ID
      event_name: eventName,
      utc_timestamp: new Date().toISOString(),
      user_id: user?.uid || null,
      session_id: SESSION_ID,
      role: role || 'anonymous',
      app_module: appModule,
      route: route,
      device_platform: getDevicePlatform(),
      pwa_installed_state: isPwaInstalled(),
      environment: ENVIRONMENT,
      schema_version: SCHEMA_VERSION,
      metadata: metadata || {},
    };

    // 3. Queue Event for Firestore
    eventQueue.push(event);
    
    // 4. Log to GA4 if analytics is enabled
    if (privacyConsent.telemetryEnabled && analytics) {
      logEvent(analytics, eventName, {
        app_module: appModule,
        route: route,
        role: event.role,
        ...metadata
      });
    }
    
    // In dev mode, log to console for visibility
    if (ENVIRONMENT === 'dev') {
      console.log(`[Telemetry: ${eventName}]`, event);
    }
  },

  /**
   * Flushes the event queue to the backend (Firestore/Analytics).
   * In a production app, this would use batched writes.
   */
  flush: async () => {
    if (eventQueue.length === 0) return;
    
    const eventsToFlush = [...eventQueue];
    eventQueue.length = 0; // Clear queue

    try {
      const projectId = firebaseConfig.projectId;
      const idToken = await auth.currentUser?.getIdToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch('/api/telemetry/flush', {
        method: 'POST',
        headers,
        body: JSON.stringify({ events: eventsToFlush, projectId })
      });

      if (!response.ok) {
        throw new Error(`Flush failed: ${await response.text()}`);
      }
    } catch (error) {
      console.error('Failed to flush telemetry events', error);
      // Re-queue failed events
      eventQueue.push(...eventsToFlush);
    }
  }
};

// Set up periodic flush
setInterval(TrackingEngine.flush, FLUSH_INTERVAL_MS);

// Utility functions
function getDevicePlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/mac/.test(ua)) return 'macos';
  if (/win/.test(ua)) return 'windows';
  return 'web';
}

function isPwaInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}
