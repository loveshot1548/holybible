import { createClient } from '@supabase/supabase-js';

// Supabase 대시보드(Settings > API)에서 본인의 URL과 KEY를 복사해 넣으세요.
const supabaseUrl = 'https://fenzodpldsxdttzgztcl.supabase.co';
const supabaseAnonKey = 'sb_publishable_-vkRD_NKdbuiLxNbE_PceA_pIE63Ui-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);