// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fenzodpldsxdttzgztcl.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_-vkRD_NKdbuiLxNbE_PceA_pIE63Ui-'; 

// 프로젝트 URL이 유효한 경우에만 클라이언트를 생성합니다.
export const supabase = SUPABASE_URL.includes('YOUR-PROJECT') 
  ? null 
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);