import { auth } from './config';
import { UserProfile } from './users';
import firebaseConfig from '../../../firebase-applet-config.json';

export interface TelemetryEvent {
  id: string;
  event_name: string;
  utc_timestamp: number;
  user_id: string;
  session_id: string;
  role: string;
  app_module: string;
  route: string;
  device_platform: string;
  pwa_installed_state: boolean;
  environment: string;
  schema_version: string;
  metadata?: Record<string, any>;
}

export async function getRecentTelemetryEvents(limitCount = 50): Promise<TelemetryEvent[]> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    const projectId = firebaseConfig.projectId;
    const response = await fetch(`/api/admin/telemetry?projectId=${projectId}&limit=${limitCount}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch telemetry events: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching telemetry events:', error);
    return [];
  }
}

export function subscribeToTelemetryEvents(callback: (events: TelemetryEvent[]) => void, limitCount = 50) {
  let isSubscribed = true;

  async function fetchEvents() {
    if (!isSubscribed) return;
    try {
      const events = await getRecentTelemetryEvents(limitCount);
      if (isSubscribed) {
        callback(events);
      }
    } catch (error) {
      console.error('Error in telemetry subscription:', error);
    } finally {
      if (isSubscribed) {
        setTimeout(fetchEvents, 5000); // Poll every 5 seconds
      }
    }
  }

  fetchEvents();

  return () => {
    isSubscribed = false;
  };
}

export async function getUsers(limitCount = 100): Promise<UserProfile[]> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    const projectId = firebaseConfig.projectId;
    const response = await fetch(`/api/admin/users?projectId=${projectId}&limit=${limitCount}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export function subscribeToUsers(callback: (users: UserProfile[]) => void, limitCount = 100) {
  let isSubscribed = true;

  async function fetchUsers() {
    if (!isSubscribed) return;
    try {
      const users = await getUsers(limitCount);
      if (isSubscribed) {
        callback(users);
      }
    } catch (error) {
      console.error('Error in users subscription:', error);
    } finally {
      if (isSubscribed) {
        setTimeout(fetchUsers, 5000); // Poll every 5 seconds
      }
    }
  }

  fetchUsers();

  return () => {
    isSubscribed = false;
  };
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'creator' | 'user'): Promise<void> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    const projectId = firebaseConfig.projectId;
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole, projectId })
    });

    if (!response.ok) {
      throw new Error(`Failed to update user role: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

export async function updateUserQuota(userId: string, storageQuotaBytes: number): Promise<void> {
  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Not authenticated');

    const projectId = firebaseConfig.projectId;
    const response = await fetch(`/api/admin/users/${userId}/quota`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ storageQuotaBytes, projectId })
    });

    if (!response.ok) {
      throw new Error(`Failed to update quota: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Error updating user quota:', error);
    throw error;
  }
}
