import { v4 as uuidv4 } from 'uuid';
import firebaseConfig from '../../../firebase-applet-config.json';
import { auth } from '../firebase/config';
import { getAuthToken } from '../firebase/authUtils';

// Phase 10: iOS MetricKit Native Daemon
// Completely structurally isolated from User UI intent logging. Ensures performance isn't mixed with Machine Learning behaviors.
export interface MetricReport {
  report_id: string;
  os_version: string;
  app_version: string;
  diagnostic_type: 'hang' | 'crash' | 'memory' | 'gc_sweep';
  payload_data: Record<string, any>;
  start_date: string;
}

const metricQueue: MetricReport[] = [];

export const MetricKit = {
  logDiagnostic: (type: MetricReport['diagnostic_type'], payload: Record<string, any>) => {
    const report: MetricReport = {
      report_id: uuidv4(),
      os_version: 'SenseOS 1.0',
      app_version: '1.0.0',
      diagnostic_type: type,
      payload_data: payload,
      start_date: new Date().toISOString()
    };
    metricQueue.push(report);
  },

  syncDaemon: async () => {
    if (metricQueue.length === 0) return;
    const metricsToFlush = [...metricQueue];
    metricQueue.length = 0;

    try {
      const idToken = await getAuthToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const response = await fetch('/api/telemetry/flush', {
        method: 'POST',
        headers,
        body: JSON.stringify({ events: [], metrics: metricsToFlush, projectId: firebaseConfig.projectId })
      });
      if (!response.ok) throw new Error('MetricKit Sync Blocked');
    } catch (e) {
      console.error('[MetricKit Sync] Failed:', e);
      metricQueue.push(...metricsToFlush);
    }
  }
};

const SYNC_INTERVAL = 30000; // Apple MetricKit batches massively asynchronously
setInterval(MetricKit.syncDaemon, SYNC_INTERVAL);
