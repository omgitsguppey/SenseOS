import React, { useState, useEffect } from 'react';
import { SettingsList, SettingsRow } from '../components/SettingsUI';
import { BrainCircuit, Database, Activity, GitCommit } from 'lucide-react';
import { TrackingEngine } from '../../../../lib/os/Biome';
import { useAuthStore } from '../../../../store/auth';
import { auth } from '../../../../lib/firebase/config';
import firebaseConfig from '../../../../../firebase-applet-config.json';
import { getAuthToken } from '../../../../lib/firebase/authUtils';

export function IntelligenceView() {
  const { user, privacyConsent } = useAuthStore();
  const [memoryCount, setMemoryCount] = useState<number | null>(null);
  const [modelStatus, setModelStatus] = useState<{ model: string, status: string }>({ model: 'Pending Vertex...', status: 'Offline' });

  useEffect(() => {
    TrackingEngine.track('intelligence_panel_view', 'settings', 'intelligence');
    
    async function fetchMemoryCount() {
      if (!user?.uid) return;
      try {
        const idToken = await getAuthToken();
        if (!idToken) return;
        
        const projectId = firebaseConfig.projectId;
        const response = await fetch(`/api/intelligence/memory-count?uid=${user.uid}&projectId=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch memory aggregation maps');
        }
        
        const data = await response.json();
        setMemoryCount(data.count);
        setModelStatus({ model: data.model || 'Unknown', status: data.status || 'Active' });
      } catch (error) {
        console.error("Failed to connect to Intelligence Vertex Layer", error);
        setModelStatus({ model: 'System Fault', status: 'API Blocked' });
      }
    }
    
    fetchMemoryCount();
  }, [user?.uid]);

  return (
    <div className="p-4 pt-6 max-w-[600px] mx-auto">
      <h1 className="text-[34px] font-bold tracking-tight mb-6 px-4">Sense Intelligence</h1>

      <div className="px-4 mb-8 text-white/50 text-[15px] leading-relaxed">
        Sense Intelligence is a governed multi-engine system where math comes before memory, and memory comes before refinement.
      </div>

      <SettingsList title="Layer A: Tracking Engine" footer="Captures raw event telemetry from every meaningful interaction.">
        <SettingsRow
          icon={<Activity className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#007AFF]"
          label="Telemetry Ingestion"
          value={privacyConsent.telemetryEnabled ? 'Active' : 'Disabled'}
        />
      </SettingsList>

      <SettingsList title="Layer B: Math Engine (Aggregator)" footer="Algorithmic deep-processing. Evaluates Biome event graphs and local DOM behaviors before hitting the Vertex AI layer.">
        <SettingsRow
          icon={<Database className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#5856D6]"
          label="PostgreSQL Vector Maps"
          value="Hardware Connected"
        />
      </SettingsList>

      <SettingsList title={`Layer C: Memory Engine (${modelStatus.model})`} footer="The authenticated Intelligence route dynamically injecting Local Machine Math vectors into the Vertex Inference pipeline.">
        <SettingsRow
          icon={<BrainCircuit className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#AF52DE]"
          label="Google Cloud Vertex Hook"
          value={modelStatus.status === 'Vertex Live' ? 'Active' : 'Offline'}
        />
        <SettingsRow 
          label="Aggregated Memory Vectors" 
          value={memoryCount !== null ? memoryCount.toLocaleString() : 'Loading Postgres...'} 
        />
      </SettingsList>

      <SettingsList title="Layer D: Training Engine" footer="RAG Output layer actively resolving Vertex predictions with local MobileNet inferences to ensure the lowest cloud API impact locally.">
        <SettingsRow
          icon={<GitCommit className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#34C759]"
          label="Real-Time Learning Parity"
          value={modelStatus.status}
        />
      </SettingsList>
    </div>
  );
}
