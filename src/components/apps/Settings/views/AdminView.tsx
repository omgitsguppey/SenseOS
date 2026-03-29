import React, { useEffect, useState } from 'react';
import { SettingsList, SettingsRow } from '../components/SettingsUI';
import { Users, Activity, DownloadCloud, AlertTriangle, Server, Database } from 'lucide-react';
import { TrackingEngine } from '../../../../lib/telemetry/engine';
import { subscribeToTelemetryEvents, TelemetryEvent, subscribeToUsers, updateUserRole, updateUserQuota } from '../../../../lib/firebase/admin';
import { UserProfile } from '../../../../lib/firebase/users';
import { useAuthStore } from '../../../../store/auth';

export function AdminView() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updatingQuota, setUpdatingQuota] = useState<string | null>(null);

  useEffect(() => {
    TrackingEngine.track('admin_panel_view', 'settings', 'admin');
    
    // Only attempt to subscribe if we have a user and they are an admin, 
    // to prevent permission errors when using the debug role switcher.
    const { user, role } = useAuthStore.getState();
    const isActualAdmin = role === 'admin' || user?.email === 'athenarosiejohnson@gmail.com';
    
    if (!user || !isActualAdmin) {
      setLoading(false);
      return;
    }

    const unsubscribeEvents = subscribeToTelemetryEvents((newEvents) => {
      setEvents(newEvents);
      setLoading(false);
    });

    const unsubscribeUsers = subscribeToUsers((newUsers) => {
      setUsers(newUsers);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeUsers();
    };
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'creator' | 'user') => {
    setUpdatingRole(userId);
    try {
      await updateUserRole(userId, newRole);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleQuotaChange = async (userId: string, newQuotaGB: number) => {
    setUpdatingQuota(userId);
    try {
      // Input is explicitly GB, map back to generic Bytes for backend calculus
      const rawBytes = newQuotaGB * 1024 * 1024 * 1024;
      await updateUserQuota(userId, rawBytes);
    } catch (err) {
      console.error('Failed to update capacity schema', err);
    } finally {
      setUpdatingQuota(null);
    }
  };

  const EVENT_MAP: Record<string, string> = {
    'admin_panel_view': 'Viewed Admin Panel',
    'app_launch': 'Launched App',
    'settings_view': 'Viewed Settings',
    'error_occurred': 'Error Occurred',
    'sense_memory_created': 'Created Sense Memory',
  };

  const getUserName = (userId: string | undefined) => {
    if (!userId) return 'Anonymous';
    const user = users.find(u => u.uid === userId);
    return user?.displayName || 'Unknown User';
  };

  // Calculate some basic stats from recent events
  const uniqueUsers = new Set(events.map(e => e.user_id)).size;
  const errorEvents = events.filter(e => e.event_name?.includes('error')).length;

  return (
    <div className="p-4 pt-6 max-w-[600px] mx-auto">
      <h1 className="text-[34px] font-bold tracking-tight mb-6 px-4">Admin Control Center</h1>

      <div className="grid grid-cols-2 gap-4 px-4 mb-8">
        <div className="bg-[#1C1C1E] p-4 rounded-[12px]">
          <div className="text-white/50 text-[13px] font-medium uppercase tracking-wide mb-1">Recent Events</div>
          <div className="text-3xl font-bold tracking-tight">{loading ? '-' : events.length}</div>
        </div>
        <div className="bg-[#1C1C1E] p-4 rounded-[12px]">
          <div className="text-white/50 text-[13px] font-medium uppercase tracking-wide mb-1">Active Users (Recent)</div>
          <div className="text-3xl font-bold tracking-tight text-[#34C759]">{loading ? '-' : uniqueUsers}</div>
        </div>
        <div className="bg-[#1C1C1E] p-4 rounded-[12px]">
          <div className="text-white/50 text-[13px] font-medium uppercase tracking-wide mb-1">Errors (Recent)</div>
          <div className="text-3xl font-bold tracking-tight text-[#FF3B30]">{loading ? '-' : errorEvents}</div>
        </div>
        <div className="bg-[#1C1C1E] p-4 rounded-[12px]">
          <div className="text-white/50 text-[13px] font-medium uppercase tracking-wide mb-1">Total Users</div>
          <div className="text-3xl font-bold tracking-tight text-[#007AFF]">{loading ? '-' : users.length}</div>
        </div>
      </div>

      <SettingsList title="User Management" footer="Manage user roles and permissions">
        {loading ? (
          <div className="p-4 text-center text-white/50 text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-center text-white/50 text-sm">No users found.</div>
        ) : (
          users.map((u) => (
            <div key={u.uid} className="p-4 border-b border-white/10 last:border-0 flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.displayName || 'User'} className="w-10 h-10 rounded-full bg-[#2C2C2E] object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white/50" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[15px] truncate">{u.displayName || 'Anonymous User'}</div>
                  <div className="text-[13px] text-white/50 truncate">{u.email || u.uid}</div>
                </div>
              </div>
              <div className="ml-4 flex items-center space-x-3 flex-shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Quota (GB)</span>
                  <input 
                    type="number"
                    min="1"
                    disabled={updatingQuota === u.uid}
                    defaultValue={u.storageQuotaBytes ? Math.round(u.storageQuotaBytes / (1024*1024*1024)) : 5}
                    onBlur={(e) => handleQuotaChange(u.uid, Number(e.target.value))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleQuotaChange(u.uid, Number(e.currentTarget.value)) }}
                    className="bg-[#2C2C2E] w-16 text-center text-white text-[13px] font-medium px-2 py-1.5 rounded-lg outline-none disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Role</span>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.uid, e.target.value as any)}
                    disabled={updatingRole === u.uid}
                    className="bg-[#2C2C2E] text-white text-[13px] font-medium px-3 py-1.5 rounded-lg outline-none disabled:opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="creator">Creator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </SettingsList>

      <SettingsList title="Recent Telemetry Events" footer="Live feed from telemetry_events collection">
        {loading ? (
          <div className="p-4 text-center text-white/50 text-sm">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-4 text-center text-white/50 text-sm">No recent events found.</div>
        ) : (
          events.slice(0, 10).map((event) => (
            <div key={event.id} className="p-4 border-b border-white/10 last:border-0">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-[15px]">{EVENT_MAP[event.event_name] || event.event_name}</span>
                <span className="text-xs text-white/50">
                  {new Date(event.utc_timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-[13px] text-white/60 flex space-x-2">
                <span>{getUserName(event.user_id)}</span>
                <span>•</span>
                <span>{event.app_module}</span>
                <span>•</span>
                <span>{event.role}</span>
              </div>
            </div>
          ))
        )}
      </SettingsList>
    </div>
  );
}
