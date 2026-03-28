import React, { useState, useEffect } from 'react';
import { SettingsList, SettingsRow } from '../components/SettingsUI';
import { BrainCircuit, Database, Activity, GitCommit } from 'lucide-react';
import { TrackingEngine } from '../../../../lib/telemetry/engine';
import { useAuthStore } from '../../../../store/auth';
import { auth } from '../../../../lib/firebase/config';
import firebaseConfig from '../../../../../firebase-applet-config.json';

export function IntelligenceView() {
  const { user, privacyConsent } = useAuthStore();
  const [memoryCount, setMemoryCount] = useState<number | null>(null);

  useEffect(() => {
    TrackingEngine.track('intelligence_panel_view', 'settings', 'intelligence');
    
    async function fetchMemoryCount() {
      if (!user?.uid) return;
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;
        
        const projectId = firebaseConfig.projectId;
        const response = await fetch(`/api/intelligence/memory-count?uid=${user.uid}&projectId=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch memory count');
        }
        
        const data = await response.json();
        setMemoryCount(data.count);
      } catch (error) {
        console.error("Failed to fetch memory count", error);
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

      <SettingsList title="Layer B: Math Engine" footer="Deterministic algorithmic processing. No AI. Handles aggregation, sessionization, and anomaly detection.">
        <SettingsRow
          icon={<Database className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#5856D6]"
          label="Mathematical Dedupe/Parsing"
          value="Cloud Functions"
        />
      </SettingsList>

      <SettingsList title="Layer C: Memory Engine" footer="Converts validated telemetry into legible memories. Target: gemini-3.1-flash-lite-preview">
        <SettingsRow
          icon={<BrainCircuit className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#AF52DE]"
          label="Flash Lite Memory/Anecdote"
          value={privacyConsent.mlTrainingEnabled ? 'Active' : 'Disabled'}
        />
        <SettingsRow 
          label="Stored Memories" 
          value={memoryCount !== null ? memoryCount.toString() : 'Loading...'} 
        />
      </SettingsList>

      <SettingsList title="Layer D: Training Engine" footer="Wraps layers A, B, and C. Handles refinement, continuity, and model routing.">
        <SettingsRow
          icon={<GitCommit className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#34C759]"
          label="Continuity/Training"
          value="Pending"
        />
      </SettingsList>
    </div>
  );
}
