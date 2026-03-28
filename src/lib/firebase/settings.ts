import { auth } from './config';
import firebaseConfig from '../../../firebase-applet-config.json';

export interface PrivacyConsent {
  telemetryEnabled: boolean;
  mlTrainingEnabled: boolean;
  updatedAt: any;
}

export interface AppPreferences {
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  updatedAt: any;
}

const defaultConsent: PrivacyConsent = {
  telemetryEnabled: true,
  mlTrainingEnabled: true,
  updatedAt: new Date().toISOString()
};

const defaultPreferences: AppPreferences = {
  theme: 'system',
  reducedMotion: false,
  updatedAt: new Date().toISOString()
};

export async function syncPrivacyConsent(uid: string, idToken?: string): Promise<PrivacyConsent> {
  try {
    const token = idToken || await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');

    const projectId = firebaseConfig.projectId;
    const response = await fetch(`/api/settings/${uid}/privacy?projectId=${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Get privacy settings failed: ${await response.text()}`);
    }

    const data = await response.json();
    if (!data) {
      await updatePrivacyConsent(uid, defaultConsent, token);
      return defaultConsent;
    }
    return data as PrivacyConsent;
  } catch (error) {
    console.error('Error syncing privacy consent:', error);
    throw error;
  }
}

export async function updatePrivacyConsent(uid: string, updates: Partial<PrivacyConsent>, idToken?: string): Promise<void> {
  try {
    const token = idToken || await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');

    const projectId = firebaseConfig.projectId;
    const response = await fetch(`/api/settings/${uid}/privacy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates, projectId })
    });

    if (!response.ok) {
      throw new Error(`Update privacy settings failed: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Error updating privacy consent:', error);
    throw error;
  }
}

export async function syncAppPreferences(uid: string, idToken?: string): Promise<AppPreferences> {
  try {
    const token = idToken || await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');

    const projectId = firebaseConfig.projectId;
    const response = await fetch(`/api/settings/${uid}/preferences?projectId=${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Get preferences failed: ${await response.text()}`);
    }

    const data = await response.json();
    if (!data) {
      await updateAppPreferences(uid, defaultPreferences, token);
      return defaultPreferences;
    }
    return data as AppPreferences;
  } catch (error) {
    console.error('Error syncing app preferences:', error);
    throw error;
  }
}

export async function updateAppPreferences(uid: string, updates: Partial<AppPreferences>, idToken?: string): Promise<void> {
  try {
    const token = idToken || await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Not authenticated');

    const projectId = firebaseConfig.projectId;
    const response = await fetch(`/api/settings/${uid}/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ updates, projectId })
    });

    if (!response.ok) {
      throw new Error(`Update preferences failed: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Error updating app preferences:', error);
    throw error;
  }
}
