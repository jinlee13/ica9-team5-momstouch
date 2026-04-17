import productsData from '@/data/products.json'

export interface TopProduct {
  name: string
  price: string
  rating: number | null
  reviews: number
}

export interface Product {
  id: string
  name: string
  categorySlug: string
  categoryName: string
  ageGroupSlug: string
  ageMinMonths: number
  ageMaxMonths: number
  necessity: 'ESSENTIAL' | 'SITUATIONAL' | 'OPTIONAL' | 'RENT_OR_USED'
  reason: string
  developStage: string
  priceRange: string
  kcCertified: boolean
  ddokPillars: string[]
  theoryNote: string
  topProducts?: TopProduct[]
}

export type Priority = 'NOW' | 'SOON' | 'LATER' | 'PASSED'

export interface ProductWithPriority extends Product {
  priority: Priority
}

export function calculateAgeInMonths(birthdate: string): number {
  const birth = new Date(birthdate)
  const now = new Date()
  const diffMs = now.getTime() - birth.getTime()
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44)
  return Math.floor(diffMonths)
}

export function getAgeLabel(months: number): string {
  if (months < 1) return '신생아 (0개월)'
  if (months === 1) return '1개월'
  return `${months}개월`
}

export function getPriority(ageMonths: number, ageMin: number, ageMax: number): Priority {
  if (ageMonths >= ageMin && ageMonths <= ageMax) return 'NOW'
  if (ageMonths < ageMin && ageMin - ageMonths <= 2) return 'SOON'
  if (ageMonths > ageMax) return 'PASSED'
  return 'LATER'
}

export function getRecommendations(ageMonths: number): ProductWithPriority[] {
  const products = productsData.lifecycle_rules as Product[]
  return products
    .map((product) => ({
      ...product,
      priority: getPriority(ageMonths, product.ageMinMonths, product.ageMaxMonths),
    }))
    .filter((p) => p.priority !== 'PASSED')
    .filter((p) => p.priority !== 'LATER' || p.ageMinMonths <= ageMonths + 6)
    .sort((a, b) => {
      const order: Record<Priority, number> = { NOW: 0, SOON: 1, LATER: 2, PASSED: 3 }
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority]
      const necessityOrder: Record<string, number> = { ESSENTIAL: 0, SITUATIONAL: 1, OPTIONAL: 2, RENT_OR_USED: 3 }
      return (necessityOrder[a.necessity] ?? 3) - (necessityOrder[b.necessity] ?? 3)
    })
}

export function getProductById(id: string): Product | undefined {
  return (productsData.lifecycle_rules as Product[]).find((p) => p.id === id)
}

export function getDdokFramework(ageGroupSlug: string) {
  const framework = productsData.ddok_framework as Record<string, { label: string; subtitle: string; reason_template: string }>
  return framework[ageGroupSlug] ?? null
}

export function getAgeGroupForMonths(months: number): string {
  if (months < 3) return '0-3m'
  if (months < 6) return '3-6m'
  if (months < 12) return '6-12m'
  if (months < 24) return '12-24m'
  if (months < 36) return '24-36m'
  return '36m+'
}

export const NECESSITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ESSENTIAL: { label: '필수', color: 'text-purple-700', bg: 'bg-purple-100' },
  SITUATIONAL: { label: '상황형', color: 'text-blue-700', bg: 'bg-blue-100' },
  OPTIONAL: { label: '생략가능', color: 'text-gray-600', bg: 'bg-gray-100' },
  RENT_OR_USED: { label: '중고·대여', color: 'text-green-700', bg: 'bg-green-100' },
}

export const CATEGORY_INFO: Record<string, { name: string; icon: string; color: string }> = {
  sleep: { name: '자기·위생', icon: '🛏️', color: 'bg-indigo-50 border-indigo-200' },
  feeding: { name: '먹기', icon: '🍼', color: 'bg-yellow-50 border-yellow-200' },
  play: { name: '놀기·배우기', icon: '🧸', color: 'bg-pink-50 border-pink-200' },
  outdoor: { name: '외출·안전', icon: '🚗', color: 'bg-green-50 border-green-200' },
}

export const DDOK_PILLAR_LABELS: Record<string, { label: string; description: string; color: string }> = {
  D: { label: 'Doing', description: '몸으로 하기', color: 'text-orange-600 bg-orange-50' },
  O: { label: 'Opening', description: '세상 열기', color: 'text-blue-600 bg-blue-50' },
  K: { label: 'Knowing', description: '나를 알기', color: 'text-pink-600 bg-pink-50' },
  T: { label: 'Timing', description: '지금 이 순간', color: 'text-green-600 bg-green-50' },
}
