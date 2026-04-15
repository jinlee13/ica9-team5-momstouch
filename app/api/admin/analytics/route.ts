import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function checkAuth(req: NextRequest) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '7')
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  // 전체 이벤트 조회
  const { data: events } = await supabase
    .from('product_events')
    .select('*')
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (!events) return NextResponse.json({ error: 'DB error' }, { status: 500 })

  // 1. 제품별 조회수 TOP 10
  const viewMap: Record<string, { name: string; count: number; category: string }> = {}
  for (const e of events.filter(e => e.event_type === 'view')) {
    if (!e.product_id) continue
    if (!viewMap[e.product_id]) viewMap[e.product_id] = { name: e.product_name ?? '', count: 0, category: e.category_main ?? '' }
    viewMap[e.product_id].count++
  }
  const topViewed = Object.entries(viewMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 2. 마켓 상품 클릭 TOP 10
  const clickMap: Record<string, { name: string; count: number; productName: string }> = {}
  for (const e of events.filter(e => e.event_type === 'market_click')) {
    const key = String(e.market_product_id ?? e.market_product_name)
    if (!clickMap[key]) clickMap[key] = { name: e.market_product_name ?? '', count: 0, productName: e.product_name ?? '' }
    clickMap[key].count++
  }
  const topClicked = Object.entries(clickMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 3. 체크리스트 액션 집계
  const checklistMap: Record<string, { name: string; BOUGHT: number; PENDING: number; SKIP: number }> = {}
  for (const e of events.filter(e => e.event_type === 'checklist')) {
    if (!e.product_id) continue
    if (!checklistMap[e.product_id]) checklistMap[e.product_id] = { name: e.product_name ?? '', BOUGHT: 0, PENDING: 0, SKIP: 0 }
    const action = e.checklist_action as 'BOUGHT' | 'PENDING' | 'SKIP'
    if (action) checklistMap[e.product_id][action]++
  }
  const topChecklist = Object.entries(checklistMap)
    .map(([id, v]) => ({ id, ...v, total: v.BOUGHT + v.PENDING + v.SKIP }))
    .sort((a, b) => b.BOUGHT - a.BOUGHT)
    .slice(0, 10)

  // 4. 카테고리별 관심도
  const catMap: Record<string, number> = {}
  for (const e of events.filter(e => e.event_type === 'view' && e.category_main)) {
    catMap[e.category_main!] = (catMap[e.category_main!] ?? 0) + 1
  }

  // 5. 일별 방문 트렌드 (최근 7일)
  const dailyMap: Record<string, number> = {}
  for (const e of events.filter(e => e.event_type === 'view')) {
    const day = e.created_at.slice(0, 10)
    dailyMap[day] = (dailyMap[day] ?? 0) + 1
  }
  const daily = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b))

  // 6. 총계
  const summary = {
    total_views: events.filter(e => e.event_type === 'view').length,
    total_clicks: events.filter(e => e.event_type === 'market_click').length,
    total_checklist: events.filter(e => e.event_type === 'checklist').length,
    unique_sessions: new Set(events.map(e => e.session_id)).size,
  }

  return NextResponse.json({ summary, topViewed, topClicked, topChecklist, catMap, daily })
}
