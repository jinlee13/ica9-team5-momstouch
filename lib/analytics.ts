'use client'

import { supabase } from './supabase'

// 세션 ID 생성 (브라우저 탭 단위)
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = sessionStorage.getItem('ddok_session')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('ddok_session', sid)
  }
  return sid
}

function getAgeMonths(): number {
  if (typeof window === 'undefined') return 0
  const bd = localStorage.getItem('ddokddok_birthdate')
  if (!bd) return 0
  const diff = Date.now() - new Date(bd).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4))
}

// 제품 상세 페이지 조회
export async function trackProductView(
  productId: string,
  productName: string,
  categoryMain: string,
  categorySub?: string
) {
  await supabase.from('product_events').insert({
    event_type: 'view',
    product_id: productId,
    product_name: productName,
    category_main: categoryMain,
    category_sub: categorySub ?? null,
    session_id: getSessionId(),
    age_months: getAgeMonths(),
  })
}

// 마켓 상품 링크 클릭
export async function trackMarketClick(
  productId: string,
  productName: string,
  marketProductId: number,
  marketProductName: string,
  categoryMain: string
) {
  await supabase.from('product_events').insert({
    event_type: 'market_click',
    product_id: productId,
    product_name: productName,
    market_product_id: marketProductId,
    market_product_name: marketProductName,
    category_main: categoryMain,
    session_id: getSessionId(),
    age_months: getAgeMonths(),
  })
}

// 체크리스트 액션
export async function trackChecklist(
  productId: string,
  productName: string,
  action: string
) {
  await supabase.from('product_events').insert({
    event_type: 'checklist',
    product_id: productId,
    product_name: productName,
    checklist_action: action,
    session_id: getSessionId(),
    age_months: getAgeMonths(),
  })
}
