import React, { useEffect } from 'react';
import { SettingsList, SettingsRow, SettingsToggle } from '../components/SettingsUI';
import { Moon, Wind } from 'lucide-react';
import { TrackingEngine } from '../../../../lib/os/Biome';
import { useAuthStore } from '../../../../store/auth';

export function AppPreferencesView() {
  const { preferences, updatePreferences } = useAuthStore();

  useEffect(() => {
    TrackingEngine.track('settings_section_view', 'settings', 'preferences');
  }, []);

  const handleToggle = (setting: keyof typeof preferences, value: any) => {
    updatePreferences({ [setting]: value });
    TrackingEngine.track('app_preference_updated', 'settings', 'preferences', {
      setting,
      value
    });
  };

  return (
    <div className="p-4 pt-6 max-w-[600px] mx-auto">
      <h1 className="text-[34px] font-bold tracking-tight mb-6 px-4">App Preferences</h1>

      <SettingsList title="Appearance & Behavior">
        <SettingsToggle
          icon={<Moon className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#1C1C1E] border border-white/10"
          label="Dark Mode"
          checked={preferences.theme === 'dark'}
          onChange={(v) => handleToggle('theme', v ? 'dark' : 'light')}
        />
        <SettingsToggle
          icon={<Wind className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#5AC8FA]"
          label="Reduce Motion"
          checked={preferences.reducedMotion}
          onChange={(v) => handleToggle('reducedMotion', v)}
        />
      </SettingsList>
    </div>
  );
}
