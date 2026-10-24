import { createClient } from '@supabase/supabase-js';

// Supabase 연결 정보 (환경 변수나 기존 설정 방식에 맞추어 활용)
const SUPABASE_URL = 'https://fenzodpldsxdttzgztcl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-vkRD_NKdbuiLxNbE_PceA_pIE63Ui-'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 특정 책, 장, 절의 원어 대조(Interlinear) 데이터를 가져오는 함수
 * @param {string} book - 책 이름 (예: '창세기', '마태복음')
 * @param {number} chapter - 장 번호
 * @param {number} verse - 절 번호
 */
export async function fetchVerseInterlinear(book, chapter, verse) {
  const { data, error } = await supabase
    .from('interlinear_bible')
    .select('*')
    .eq('book', book)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .order('word_order', { ascending: true });

  if (error) {
    console.error('성경 원어 데이터 조회 실패:', error.message);
    return [];
  }

  return data;
}