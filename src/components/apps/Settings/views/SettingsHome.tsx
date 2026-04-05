import React from 'react';
import { User, Shield, Sliders, Activity, BrainCircuit } from 'lucide-react';
import { SettingsList, SettingsRow } from '../components/SettingsUI';
import { SettingsRoute } from '../SettingsApp';
import { useAuthStore } from '../../../../store/auth';

interface SettingsHomeProps {
  onNavigate: (route: SettingsRoute) => void;
}

export function SettingsHome({ onNavigate }: SettingsHomeProps) {
  const role = useAuthStore(state => state.role);
  const setRole = useAuthStore(state => state.setRole);
  const user = useAuthStore(state => state.user);

  return (
    <div className="p-4 pt-6 max-w-[600px] mx-auto">
      <h1 className="text-[34px] font-bold tracking-tight mb-6 px-4">Settings</h1>

      <SettingsList>
        <SettingsRow
          icon={<User className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#007AFF]"
          label="Account"
          value={user?.displayName || 'Sign In'}
          onClick={() => onNavigate('account')}
          showChevron
        />
        <SettingsRow
          icon={<Shield className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#34C759]"
          label="Privacy & Consent"
          onClick={() => onNavigate('privacy')}
          showChevron
        />
        <SettingsRow
          icon={<Sliders className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#8E8E93]"
          label="App Preferences"
          onClick={() => onNavigate('preferences')}
          showChevron
        />
      </SettingsList>

      {(role === 'admin' || user?.email === 'athenarosiejohnson@gmail.com') && (
        <SettingsList title="Admin Control Center" footer="SenseOS Telemetry & Intelligence Engines">
          <SettingsRow
            icon={<Activity className="w-[20px] h-[20px] text-white" />}
            iconBg="bg-[#FF3B30]"
            label="Admin Control Center"
            onClick={() => onNavigate('admin')}
            showChevron
          />
          <SettingsRow
            icon={<BrainCircuit className="w-[20px] h-[20px] text-white" />}
            iconBg="bg-[#5856D6]"
            label="Sense Intelligence"
            onClick={() => onNavigate('intelligence')}
            showChevron
          />
        </SettingsList>
      )}
    </div>
  );
}
