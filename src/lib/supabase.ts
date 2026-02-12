import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 설정 키 타입
export type SettingsKey = 
  | 'pinned_products'      // 즐겨찾기 제품
  | 'brandiz_form'         // 브랜디즈 견적서 양식
  | 'hotang_form';         // 호탱감탱 견적서 양식

export interface SharedSetting {
  key: SettingsKey;
  value: unknown;
  updated_at: string;
}
