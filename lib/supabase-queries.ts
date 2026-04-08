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

export async function fetchRecommendations(ageMonths: number): Promise<ProductWithPriority[]> {
  const { data, error } = await supabase.from('products').select('*')
  if (error) throw error

  return (data as Record<string, unknown>[])
    .map((row) => ({
      ...mapProduct(row),
      priority: getPriority(ageMonths, row.age_min_months as number, row.age_max_months as number),
    }))
    .filter((p) => p.priority !== 'LATER' || p.ageMinMonths <= ageMonths + 6)
    .sort((a, b) => {
      const order = { NOW: 0, SOON: 1, LATER: 2 }
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
  category: string | null
  thumbnail_url: string | null
  detail_url: string | null
  rating: number | null
  review_count: number | null
  source_site: string | null
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

// 카테고리 슬러그 → 대분류 매핑
const SLUG_TO_MAIN: Record<string, string> = {
  feeding: '먹기',
  sleep:   '자기·위생',
  play:    '놀기·배우기',
  outdoor: '외출·안전',
}

export async function fetchMarketProducts(
  categorySlug: string,
  productName: string,
  limit = 8
): Promise<MarketProduct[]> {
  const categoryMain = SLUG_TO_MAIN[categorySlug]

  let query = supabase
    .from('market_products')
    .select('*')
    .not('thumbnail_url', 'is', null)
    .not('detail_url', 'is', null)
    .order('review_count', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (categoryMain) {
    query = query.eq('category_main', categoryMain)
  }

  const { data, error } = await query
  if (error) return []
  return data as MarketProduct[]
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
