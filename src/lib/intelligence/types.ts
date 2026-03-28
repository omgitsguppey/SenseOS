// Sense Intelligence Architecture - Layers 2, 3, 4

// ==========================================
// Layer 2: Math Engine
// Deterministic aggregation layer. No AI.
// ==========================================

export interface DerivedMetrics {
  metric_id: string;
  timestamp: string;
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
  total_users: number;
  dau: number;
  session_count: number;
  install_rate: number;
  pwa_conversion_rate: number;
  event_throughput: number;
  dedupe_rate: number;
  parse_success_rate: number;
}

export interface AnomalyFlag {
  anomaly_id: string;
  timestamp: string;
  metric_name: string;
  expected_range: [number, number];
  actual_value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

export interface Cohort {
  cohort_id: string;
  name: string;
  criteria: Record<string, any>;
  user_count: number;
  retention_d1: number;
  retention_d7: number;
  retention_d30: number;
}

// ==========================================
// Layer 3: Memory Engine
// AI-derived memory layer fed only from cleaned math output.
// Target: gemini-3.1-flash-lite-preview
// ==========================================

export interface Anecdote {
  anecdote_id: string;
  timestamp: string;
  source_metric_ids: string[];
  observation: string; // e.g., "Users on iOS are abandoning the settings page 20% faster today."
}

export interface SenseMemory {
  memory_id: string;
  timestamp: string;
  category: 'behavior' | 'anomaly' | 'adoption' | 'system';
  summary: string;
  anecdotes: Anecdote[];
  confidence_score: number; // 0.0 to 1.0
  status: 'active' | 'pruned' | 'decayed';
}

// ==========================================
// Layer 4: Training / Continuity Engine
// Wraps layers 1, 2, and 3. Handles refinement and decay.
// ==========================================

export interface ContinuityState {
  state_id: string;
  version: string;
  last_refined_at: string;
  active_memories_count: number;
  decayed_memories_count: number;
  average_confidence: number;
}

export interface ReinforcementRule {
  rule_id: string;
  target_category: string;
  weight_modifier: number;
  condition: string;
}
