import { auth } from './config';
import { UserRole } from '../telemetry/types';
import firebaseConfig from '../../../firebase-applet-config.json';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: any;
  lastLoginAt: any;
}

export async function syncUserDocument(user: any, idToken?: string): Promise<UserProfile | null> {
  if (!user) return null;

  try {
    const token = idToken || await auth.currentUser?.getIdToken();
    if (!token) return null;

    const projectId = firebaseConfig.projectId;
    
    const response = await fetch('/api/users/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        },
        projectId
      })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing user:', error);
    throw error;
  }
}
