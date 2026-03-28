import React, { useEffect } from 'react';
import { SettingsList, SettingsRow } from '../components/SettingsUI';
import { User, Mail, ShieldCheck, LogOut, Trash2, LogIn } from 'lucide-react';
import { TrackingEngine } from '../../../../lib/telemetry/engine';
import { useAuthStore } from '../../../../store/auth';
import { auth } from '../../../../lib/firebase/config';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export function AccountView() {
  const { user, role, isPwaInstalled } = useAuthStore();

  useEffect(() => {
    TrackingEngine.track('settings_section_view', 'settings', 'account');
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      TrackingEngine.track('account_action', 'settings', 'account', { action: 'sign_in_success' });
    } catch (error) {
      console.error('Sign in failed:', error);
      TrackingEngine.track('error_action', 'settings', 'account', { error: String(error) });
    }
  };

  const handleSignOut = async () => {
    try {
      TrackingEngine.track('sign_out_click', 'settings', 'account');
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleDeleteAccount = () => {
    TrackingEngine.track('delete_account_request', 'settings', 'account');
    // TODO: Implement actual delete flow
  };

  if (!user) {
    return (
      <div className="p-4 pt-6 max-w-[600px] mx-auto">
        <h1 className="text-[34px] font-bold tracking-tight mb-6 px-4">Account</h1>
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-white/30" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight mb-2">Sign in to SenseOS</h2>
          <p className="text-[15px] text-white/50 mb-8 max-w-xs">
            Sync your preferences, access creator tools, and manage your intelligence settings.
          </p>
          <button
            onClick={handleSignIn}
            className="bg-white text-black px-6 py-3 rounded-full font-semibold tracking-tight flex items-center space-x-2 active:scale-95 transition-transform"
          >
            <LogIn className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 max-w-[600px] mx-auto">
      <h1 className="text-[34px] font-bold tracking-tight mb-6 px-4">Account</h1>

      <div className="flex items-center space-x-4 px-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-2xl font-bold shadow-lg overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            user.displayName?.charAt(0) || 'U'
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{user.displayName || 'User'}</h2>
          <p className="text-[15px] text-white/50 tracking-tight">{user.email}</p>
        </div>
      </div>

      <SettingsList title="Profile">
        <SettingsRow
          icon={<User className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#007AFF]"
          label="Username"
          value={user.displayName || 'User'}
          showChevron
        />
        <SettingsRow
          icon={<Mail className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#5856D6]"
          label="Email"
          value={user.email || ''}
          showChevron
        />
        <SettingsRow
          icon={<ShieldCheck className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#34C759]"
          label="Auth Provider"
          value="Google"
        />
      </SettingsList>

      <SettingsList title="Session & Security">
        <SettingsRow label="Active Sessions" value="1 Device" showChevron />
        <SettingsRow label="User Type" value={role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Unknown'} />
        <SettingsRow label="PWA Installed" value={isPwaInstalled ? 'Yes' : 'No'} />
      </SettingsList>

      <SettingsList>
        <SettingsRow
          icon={<LogOut className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#8E8E93]"
          label="Sign Out"
          onClick={handleSignOut}
        />
      </SettingsList>

      <SettingsList footer="Deleting your account will permanently remove all your data, preferences, and content from SenseOS.">
        <SettingsRow
          icon={<Trash2 className="w-[20px] h-[20px] text-white" />}
          iconBg="bg-[#FF3B30]"
          label="Delete Account"
          destructive
          onClick={handleDeleteAccount}
        />
      </SettingsList>
    </div>
  );
}
