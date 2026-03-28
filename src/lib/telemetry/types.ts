export type UserRole = 'user' | 'creator' | 'admin';

export type SenseEventName =
  | 'app_open'
  | 'settings_open'
  | 'settings_section_view'
  | 'settings_row_click'
  | 'consent_updated'
  | 'role_detected'
  | 'app_preference_updated'
  | 'account_action'
  | 'admin_panel_view'
  | 'intelligence_panel_view'
  | 'sign_out_click'
  | 'export_data_request'
  | 'delete_account_request'
  | 'install_state_detected'
  | 'pwa_mode_detected'
  | 'browser_mode_blocked'
  | 'error_render'
  | 'error_action';

export interface SenseEvent {
  event_id: string;              // Dedupe-safe UUIDv4
  event_name: string;            // Name of the event
  utc_timestamp: string;         // ISO 8601 UTC
  user_id: string | null;        // Nullable for anonymous/pre-auth
  session_id: string;            // Unique per app launch
  role: UserRole | 'anonymous';  // Current user role
  app_module: string;            // e.g., 'settings', 'home'
  route: string;                 // Current view/route
  device_platform: string;       // e.g., 'ios', 'android', 'desktop'
  pwa_installed_state: boolean;  // True if running standalone
  environment: 'dev' | 'staging' | 'prod';
  schema_version: string;        // e.g., '1.0.0'
  metadata?: Record<string, any>;// Contextual payload
}
