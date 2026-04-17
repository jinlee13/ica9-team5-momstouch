import { supabase } from './supabase'
import { getPriority, getAgeGroupForMonths } from './recommendations'
import type { Product, ProductWithPriority } from './recommendations'

// Supabase snake_case → camelCase 변환
function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    categorySlug: row.category_slug as string,
    categoryName: row.category_name as string,
    ageGroupSlug: row.age_group_slug as string,
    ageMinMonths: row.age_min_months as number,
    ageMaxMonths: row.age_max_months as number,
    necessity: row.necessity as Product['necessity'],
    reason: row.reason as string,
    developStage: row.develop_stage as string,
    priceRange: row.price_range as string,
    kcCertified: row.kc_certified as boolean,
    ddokPillars: row.ddok_pillars as string[],
    theoryNote: row.theory_note as string,
    topProducts: row.top_products as Product['topProducts'],
  }
}

export async function fetchMarketProductsByCat(
  main: string,
  mid?: string,
  sub?: string,
  page = 0,
  pageSize = 24,
  ageMonths?: number
): Promise<{ data: MarketProduct[]; hasMore: boolean }> {
  let query = supabase
    .from('market_products')
    .select('*')
    .eq('category_main', main)

  if (mid) query = query.eq('category_mid', mid)
  if (sub) query = query.eq('category_sub', sub)

  // 월령 필터: recommended_age_min <= ageMonths < recommended_age_max
  if (ageMonths !== undefined) {
    query = query.lte('recommended_age_min', ageMonths)
    query = query.or(`recommended_age_max.is.null,recommended_age_max.gt.${ageMonths}`)
  }

  const { data, error } = await query
    .not('thumbnail_url', 'is', null)
    .order('review_count', { ascending: false, nullsFirst: false })
    .range(page * pageSize, (page + 1) * pageSize)

  if (error) return { data: [], hasMore: false }
  return {
    data: (data ?? []) as MarketProduct[],
    hasMore: (data?.length ?? 0) > pageSize,
  }
}

export async function fetchRecommendations(ageMonths: number): Promise<ProductWithPriority[]> {
  const { data, error } = await supabase.from('products').select('*')
  if (error) throw error

  return (data as Record<string, unknown>[])
    .map((row) => ({
      ...mapProduct(row),
      priority: getPriority(ageMonths, row.age_min_months as number, row.age_max_months as number),
    }))
    .filter((p) => p.priority !== 'PASSED')
    .filter((p) => p.priority !== 'LATER' || p.ageMinMonths <= ageMonths + 6)
    .sort((a, b) => {
      const order: Record<string, number> = { NOW: 0, SOON: 1, LATER: 2, PASSED: 3 }
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority]
      const nOrder: Record<string, number> = { ESSENTIAL: 0, SITUATIONAL: 1, OPTIONAL: 2, RENT_OR_USED: 3 }
      return (nOrder[a.necessity] ?? 3) - (nOrder[b.necessity] ?? 3)
    })
}

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return mapProduct(data as Record<string, unknown>)
}

export interface MarketProduct {
  id: number
  name: string
  brand: string | null
  price: string | null
  original_price: string | null
  category: string | null
  category_main: string | null
  category_mid: string | null
  category_sub: string | null
  thumbnail_url: string | null
  detail_url: string | null
  detail_images: string[] | null
  rating: number | null
  review_count: number | null
  age_recommendation: string | null
  source_site: string | null
  recommended_age_min: number | null
  recommended_age_max: number | null
}

export async function fetchMarketProductById(id: number): Promise<MarketProduct | null> {
  const { data, error } = await supabase
    .from('market_products')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as MarketProduct
}

// 카테고리별 마켓 상품 개수 (홈 카드 뱃지용)
export async function fetchMarketCountByCategory(): Promise<Record<string, number>> {
  const mainCategories = ['먹기', '자기·위생', '놀기·배우기', '외출·안전']
  const slugMap: Record<string, string> = {
    '먹기': 'feeding', '자기·위생': 'sleep',
    '놀기·배우기': 'play', '외출·안전': 'outdoor',
  }

  const counts: Record<string, number> = { feeding: 0, sleep: 0, play: 0, outdoor: 0 }

  await Promise.all(mainCategories.map(async (main) => {
    const { count } = await supabase
      .from('market_products')
      .select('*', { count: 'exact', head: true })
      .eq('category_main', main)
    counts[slugMap[main]] = count ?? 0
  }))

  return counts
}

// 제품 ID → 엑셀 소분류(category_sub) 정확 매핑 (export: 홈 카드 뱃지용)
export const PRODUCT_TO_CATEGORY_SUB: Record<string, string> = {
  // 수면용품
  '0-1m-sleep-2':  '속싸개·스와들',   // 속싸개 / 스와들업
  // 먹기 - 젖병·수유용품
  '0-1m-feeding-1': '젖병',            // 젖병 & 젖병 소독기
  '1-3m-feeding-3': '젖병 액세서리',   // 젖꼭지
  // 외출·안전
  '0-1m-outdoor-1': '카시트',          // 신생아 카시트
  '0-1m-outdoor-2': '아기띠·슬링',     // 아기띠 (신생아용)
  '0-1m-outdoor-3': '유모차',          // 신생아용 바구니형 유모차
  '1-3m-outdoor-1': '유모차',          // 절충형 유모차
  '3-6m-outdoor-2': '아기띠·슬링',     // 힙시트
  // 놀기·배우기
  '0-1m-play-3':   '모빌',             // 모빌
  '1-3m-play-1':   '감각발달완구',     // 촉감책
  '1-3m-play-2':   '치발기',           // 소리나는 장난감·치발기
  '3-6m-play-1':   '감각발달완구',     // 짐보리 (플레이짐)
  '3-6m-play-2':   '치발기',           // 치발기 (냉장 보관형)
  '6-12m-play-1':  '사운드완구',       // 사운드북
  '6-12m-play-2':  '영유아완구',       // 소프트 블록
  '6-12m-play-3':  '영유아완구',       // 보행기/푸시카
  '12-24m-play-1': '영유아완구',       // 역할놀이 장난감
  '12-24m-play-3': '영유아완구',       // 그림책 세트
  '24-36m-play-1': '영유아완구',       // 블록 장난감
  '24-36m-play-2': '영유아완구',       // 퍼즐
  '24-36m-play-3': '영유아완구',       // 신체 발달 장난감
  // 위생·케어
  '12-24m-sleep-1': '구강케어',        // 유아용 칫솔 & 치약
}

// "0-6개월", "6~12개월", "신생아" 등 텍스트 → {min, max} 파싱
function parseAgeRange(ageStr: string | null): { min: number; max: number } | null {
  if (!ageStr) return null
  const m = ageStr.match(/(\d+)[~\-](\d+)/)
  if (m) return { min: parseInt(m[1]), max: parseInt(m[2]) }
  if (/신생아|newborn/i.test(ageStr)) return { min: 0, max: 3 }
  if (/0개월|0m/i.test(ageStr)) return { min: 0, max: 6 }
  return null
}

export async function fetchMarketProducts(
  categorySlug: string,
  productId: string,
  ageMonths?: number,
  limit = 12
): Promise<MarketProduct[]> {
  const categorySub = PRODUCT_TO_CATEGORY_SUB[productId]
  if (!categorySub) return []

  // 충분히 많이 가져온 뒤 연령 필터링
  const { data } = await supabase
    .from('market_products')
    .select('*')
    .not('thumbnail_url', 'is', null)
    .not('detail_url', 'is', null)
    .eq('category_sub', categorySub)
    .order('review_count', { ascending: false, nullsFirst: false })
    .limit(limit * 4)

  if (!data || data.length === 0) return []

  let results = data as MarketProduct[]

  // 연령 필터: age_recommendation이 있으면 아이 개월수와 비교
  if (ageMonths !== undefined) {
    const ageFiltered = results.filter((mp) => {
      const range = parseAgeRange(mp.age_recommendation)
      if (!range) return true // 연령 정보 없으면 포함
      return ageMonths >= range.min && ageMonths <= range.max
    })
    // 필터 결과가 있을 때만 적용 (결과가 0이면 전체 유지)
    if (ageFiltered.length > 0) results = ageFiltered
  }

  return results.slice(0, limit)
}

export async function fetchDdokFramework(ageMonths: number) {
  const slug = getAgeGroupForMonths(ageMonths)
  const { data, error } = await supabase
    .from('ddok_frameworks')
    .select('*')
    .eq('age_group_slug', slug)
    .single()
  if (error) return null
  return {
    label: data.label as string,
    subtitle: data.subtitle as string,
    reason_template: data.reason_template as string,
  }
}
