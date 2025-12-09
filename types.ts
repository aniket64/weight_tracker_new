export interface User {
  user_name: string;
  created_at: string;
  height_cm?: number;
  target_weight?: number;
  notes?: string;
}

export interface WeightEntry {
  user_name: string;
  date: string; // ISO YYYY-MM-DD
  weight_kg: number;
  note?: string;
}

export type TimeRange = '7days' | '30days' | 'all' | 'custom';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface Stats {
  current: number;
  start: number;
  change: number;
  bmi: number;
  weeklyAvg: number;
  monthlyAvg: number;
  goalProgress: number | null; // percentage
}