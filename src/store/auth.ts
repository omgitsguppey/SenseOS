import { create } from 'zustand';
import { UserRole } from '../lib/telemetry/types';
import { PrivacyConsent, AppPreferences, updatePrivacyConsent, updateAppPreferences } from '../lib/firebase/settings';

interface AuthState {
  user: any | null; // Firebase User object
  role: UserRole;
  isPwaInstalled: boolean;
  privacyConsent: PrivacyConsent;
  preferences: AppPreferences;
  
  // Actions
  setUser: (user: any | null) => void;
  setRole: (role: UserRole) => void;
  setConsent: (consent: PrivacyConsent) => void;
  setPreferences: (preferences: AppPreferences) => void;
  updateConsent: (updates: Partial<PrivacyConsent>) => Promise<void>;
  updatePreferences: (updates: Partial<AppPreferences>) => Promise<void>;
  checkPwaState: () => void;
}

const defaultConsent: PrivacyConsent = {
  telemetryEnabled: true,
  mlTrainingEnabled: true,
  updatedAt: new Date().toISOString(),
};

const defaultPreferences: AppPreferences = {
  theme: 'system',
  reducedMotion: false,
  updatedAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: 'user',
  isPwaInstalled: false,
  privacyConsent: defaultConsent,
  preferences: defaultPreferences,

  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setConsent: (consent) => set({ privacyConsent: consent }),
  setPreferences: (preferences) => set({ preferences }),
  
  updateConsent: async (updates) => {
    const { user, privacyConsent } = get();
    // Optimistic update
    set({
      privacyConsent: {
        ...privacyConsent,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    });
    
    if (user?.uid) {
      try {
        await updatePrivacyConsent(user.uid, updates);
      } catch (error) {
        console.error('Failed to update consent in Firestore', error);
        // Revert on failure
        set({ privacyConsent });
      }
    }
  },

  updatePreferences: async (updates) => {
    const { user, preferences } = get();
    // Optimistic update
    set({
      preferences: {
        ...preferences,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
    });
    
    if (user?.uid) {
      try {
        await updateAppPreferences(user.uid, updates);
      } catch (error) {
        console.error('Failed to update preferences in Firestore', error);
        // Revert on failure
        set({ preferences });
      }
    }
  },

  checkPwaState: () => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    set({ isPwaInstalled: isInstalled });
  }
}));
