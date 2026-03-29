import React, { useEffect } from 'react';
import { SettingsList, SettingsRow, SettingsToggle } from '../components/SettingsUI';
import { Shield, Activity, Brain, Download, Trash2, FileText } from 'lucide-react';
import { TrackingEngine } from '../../../../lib/os/Biome';
import { useAuthStore } from '../../../../store/auth';

export function PrivacyView() {
  const { privacyConsent, updateConsent } = useAuthStore();

  useEffect(() => {
    TrackingEngine.track('settings_section_view', 'settings', 'privacy');
  }, []);

  const handleToggle = (key: keyof typeof privacyConsent, value: boolean) => {
    updateConsent({ [key]: value });
    TrackingEngine.track('consent_updated', 'settings', 'privacy', {
      setting: key,
      value: value
    });
  };

  const handleExport = () => {
    TrackingEngine.track('export_data_request', 'settings', 'privacy');
  };

  return (
    <div className="p-4 pt-6 max-w-[600px] mx-auto">
      <h1 className="text-[34px] font-bold tracking-tight mb-6 px-4">Privacy & Consent</h1>

      <SettingsList title="Telemetry & Diagnostics" footer="SenseOS requires basic telemetry to function securely. You can opt out of analytics tracking.">
        <SettingsToggle
          icon={<Activity className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#007AFF]"
          label="Telemetry Enabled"
          checked={privacyConsent.telemetryEnabled}
          onChange={(v) => handleToggle('telemetryEnabled', v)}
        />
      </SettingsList>

      <SettingsList title="Sense Intelligence" footer="Allow the Memory Engine to store and summarize your behavioral patterns to personalize your experience.">
        <SettingsToggle
          icon={<Brain className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#5856D6]"
          label="ML Training & Memory"
          checked={privacyConsent.mlTrainingEnabled}
          onChange={(v) => handleToggle('mlTrainingEnabled', v)}
        />
      </SettingsList>

      <SettingsList title="Data Management">
        <SettingsRow
          icon={<Download className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#34C759]"
          label="Export My Data"
          showChevron
          onClick={handleExport}
        />
        <SettingsRow
          icon={<Trash2 className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#FF3B30]"
          label="Request Deletion"
          showChevron
          destructive
          onClick={() => {}}
        />
      </SettingsList>

      <SettingsList title="Legal">
        <SettingsRow
          icon={<FileText className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#8E8E93]"
          label="Privacy Policy"
          showChevron
          onClick={() => {}}
        />
        <SettingsRow
          label="Terms of Service"
          showChevron
          onClick={() => {}}
        />
      </SettingsList>
    </div>
  );
}
