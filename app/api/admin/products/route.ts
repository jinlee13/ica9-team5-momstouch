import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function checkAuth(req: NextRequest) {
  const password = req.headers.get('x-admin-password')
  return password === process.env.ADMIN_PASSWORD
}

// GET — 전체 목록 조회
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('products').select('*').order('age_min_months').order('category_slug')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — 제품 추가
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  const body = await req.json()
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('products').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH — 제품 수정
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  const body = await req.json()
  const { id, ...updates } = body
  const supabase = getAdminClient()
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — 제품 삭제
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  const { id } = await req.json()
  const supabase = getAdminClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
