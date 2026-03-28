import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';
import { useAuthStore } from '../../store/auth';
import { syncUserDocument } from './users';
import { syncPrivacyConsent, syncAppPreferences } from './settings';
import { TrackingEngine } from '../telemetry/engine';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setRole, setConsent, setPreferences, checkPwaState } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check PWA status on mount
    checkPwaState();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch token once for all sync operations
          const idToken = await firebaseUser.getIdToken();

          // Sync user to Firestore and get their role
          const userProfile = await syncUserDocument(firebaseUser, idToken);
          setUser(firebaseUser);
          
          if (userProfile?.role) {
            setRole(userProfile.role);
            TrackingEngine.track('role_detected', 'auth', 'system', { role: userProfile.role });
          }

          // Fetch preferences and consent using the same token
          const [consent, preferences] = await Promise.all([
            syncPrivacyConsent(firebaseUser.uid, idToken),
            syncAppPreferences(firebaseUser.uid, idToken)
          ]);

          setConsent(consent);
          setPreferences(preferences);

        } catch (error) {
          console.error("Failed to sync user document or settings:", error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setRole('user'); // Reset to default unauthenticated role
      }
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, [setUser, setRole, setConsent, setPreferences, checkPwaState]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-black text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-white/50 text-[13px] tracking-widest uppercase font-medium">Initializing SenseOS</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
