export type UserRole = 'user' | 'creator' | 'admin';

export interface SenseEvent {
  id: string;
  timestamp: string;
  schemaVersion: string;
  userId: string;
  userType: UserRole;
  sessionId: string;
  action: string;
  target: string;
  metadata: Record<string, any>;
  environment: 'dev' | 'staging' | 'prod';
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserPreferences {
  darkMode: boolean;
  reduceMotion: boolean;
  notificationsEnabled: boolean;
  language: string;
  safeMode: boolean;
}

export interface PrivacyConsent {
  gdprAccepted: boolean;
  telemetryEnabled: boolean;
  analyticsEnabled: boolean;
  personalizedIntelligence: boolean;
  marketingEnabled: boolean;
  memoryStorageEnabled: boolean;
  lastUpdated: string;
}

export interface CreatorSettings {
  monetizationIntent: 'none' | 'active' | 'exploring';
  brandProfileLinked: boolean;
  captionTrainingEnabled: boolean;
  publishingDefaults: 'draft' | 'public' | 'private';
}

export interface AdminTelemetryStats {
  totalUsers: number;
  totalCreators: number;
  totalAdmins: number;
  dailyActiveUsers: number;
  sessionCount: number;
  installRate: number;
  pwaConversionRate: number;
  eventThroughput: number;
  dedupeRate: number;
  parseSuccessRate: number;
  anomalyCount: number;
  queueHealth: 'healthy' | 'degraded' | 'failing';
  lastSync: string;
  schemaVersion: string;
  environment: string;
}

export interface SenseMemory {
  id: string;
  timestamp: string;
  category: 'behavior' | 'anomaly' | 'adoption' | 'system';
  summary: string;
  anecdote: string;
  confidenceScore: number;
  sourceEvents: string[]; // IDs of events that formed this memory
  status: 'active' | 'pruned' | 'decayed';
}
