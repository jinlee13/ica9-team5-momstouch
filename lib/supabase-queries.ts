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
  const { data, error } = await supabase
    .from('market_products')
    .select('category')
  if (error || !data) return {}

  const counts: Record<string, number> = {
    feeding: 0, sleep: 0, play: 0, outdoor: 0,
  }
  const map: Record<string, string[]> = {
    feeding:  ['젖병', '분유', '이유식', '수유'],
    sleep:    ['기저귀', '손수건', '위생', '세제', '수면', '속싸개'],
    play:     ['치발기', '장난감', '놀이', '모빌'],
    outdoor:  ['아기띠', '유모차', '카시트'],
  }

  for (const row of data as { category: string | null }[]) {
    const cat = row.category ?? ''
    for (const [slug, keywords] of Object.entries(map)) {
      if (keywords.some((k) => cat.includes(k))) {
        counts[slug]++
        break
      }
    }
  }
  return counts
}

// 카테고리 슬러그 → 검색 키워드 매핑
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  feeding:  ['젖병', '분유', '이유식', '수유', '젖꼭지'],
  sleep:    ['기저귀', '손수건', '위생', '세제', '수면', '속싸개', '포대기'],
  play:     ['치발기', '장난감', '놀이', '모빌'],
  outdoor:  ['아기띠', '유모차', '카시트', '외출'],
}

export async function fetchMarketProducts(
  categorySlug: string,
  productName: string,
  limit = 8
): Promise<MarketProduct[]> {
  const keywords = CATEGORY_KEYWORDS[categorySlug] ?? []
  // 제품명 첫 단어도 키워드로 추가
  const nameWord = productName.split(/[\s·,]/)[0]
  if (nameWord && !keywords.includes(nameWord)) keywords.push(nameWord)

  if (keywords.length === 0) return []

  // OR 조건으로 name 또는 category에 키워드 포함
  const orFilter = keywords
    .map((k) => `name.ilike.%${k}%,category.ilike.%${k}%`)
    .join(',')

  const { data, error } = await supabase
    .from('market_products')
    .select('*')
    .or(orFilter)
    .not('thumbnail_url', 'is', null)
    .not('detail_url', 'eq', '')
    .order('review_count', { ascending: false })
    .limit(limit)

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
