import type { AssetCategory } from "@/lib/utils/constants";

export interface Asset {
  id: string;
  user_id: string;
  category: AssetCategory;
  name: string;
  symbol: string | null;
  quantity: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  currency: string;
  country_code: string;
  is_auto_update: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetFormData {
  category: AssetCategory;
  name: string;
  symbol?: string;
  quantity: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  currency?: string;
  country_code?: string;
  is_auto_update?: boolean;
  notes?: string;
}
