import type { LiabilityType } from "@/lib/utils/constants";

export interface Liability {
  id: string;
  user_id: string;
  name: string;
  type: LiabilityType;
  principal: number;
  balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiabilityFormData {
  name: string;
  type: LiabilityType;
  principal: number;
  balance: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date?: string;
  notes?: string;
}
