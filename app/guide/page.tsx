'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculateAgeInMonths, getAgeLabel, CATEGORY_INFO, NECESSITY_LABELS } from '@/lib/recommendations'
import { fetchRecommendations } from '@/lib/supabase-queries'
import type { ProductWithPriority } from '@/lib/recommendations'

const AGE_STAGES = [
  { slug: '0-1m',   label: '0~1개월',   subtitle: '출산 전 필수 준비', min: 0,  max: 1  },
  { slug: '1-3m',   label: '1~3개월',   subtitle: '감각 깨어남의 시기', min: 1,  max: 3  },
  { slug: '3-6m',   label: '3~6개월',   subtitle: '이유식 준비 시기',   min: 3,  max: 6  },
  { slug: '6-12m',  label: '6~12개월',  subtitle: '탐색과 이동의 시기', min: 6,  max: 12 },
  { slug: '12-24m', label: '12~24개월', subtitle: '언어·자아 발달 시기', min: 12, max: 24 },
  { slug: '24-36m', label: '24~36개월', subtitle: '자율성·사회성 시기',  min: 24, max: 36 },
]

export default function GuidePage() {
  const router = useRouter()
  const [ageMonths, setAgeMonths] = useState<number | null>(null)
  const [allProducts, setAllProducts] = useState<ProductWithPriority[]>([])
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  useEffect(() => {
    const birthdate = localStorage.getItem('ddokddok_birthdate')
    if (!birthdate) { router.push('/'); return }
    const months = calculateAgeInMonths(birthdate)
    setAgeMonths(months)
    fetchRecommendations(months).then(setAllProducts)
    // 현재 다음 단계를 기본 선택
    const nextStage = AGE_STAGES.find((s) => s.min > months)
    setSelectedStage(nextStage?.slug ?? AGE_STAGES[0].slug)
  }, [router])

  const stageProducts = allProducts.filter((p) => p.ageGroupSlug === selectedStage)
  const essentials = stageProducts.filter((p) => p.necessity === 'ESSENTIAL')
  const others = stageProducts.filter((p) => p.necessity !== 'ESSENTIAL')

  const currentStage = AGE_STAGES.find((s) => s.slug === selectedStage)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-3">
            <Link href="/home" className="text-sm text-gray-500 hover:text-purple-600 transition-colors">← 홈</Link>
            <Link href="/checklist"
                  className="text-sm font-semibold px-4 py-2 rounded-full border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors">
              ✅ 체크리스트
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">📅 미리 준비 가이드</h1>
          <p className="text-gray-500">
            {ageMonths !== null ? `현재 ${getAgeLabel(ageMonths)} · ` : ''}
            각 시기별로 미리 알아두면 좋은 육아용품을 확인하세요
          </p>
        </div>

        <div className="flex gap-6 md:gap-8">
          {/* 타임라인 사이드바 */}
          <div className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">발달 단계</p>
              {AGE_STAGES.map((stage) => {
                const isPast = ageMonths !== null && stage.max <= ageMonths
                const isCurrent = ageMonths !== null && ageMonths >= stage.min && ageMonths < stage.max
                const isSelected = selectedStage === stage.slug
                return (
                  <button
                    key={stage.slug}
                    onClick={() => setSelectedStage(stage.slug)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      isSelected
                        ? 'text-white shadow-md'
                        : isPast
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-100'
                    }`}
                    style={isSelected ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{stage.label}</span>
                      {isCurrent && !isSelected && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">현재</span>
                      )}
                      {isPast && <span className="text-xs text-gray-400">완료</span>}
                    </div>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-purple-100' : 'text-gray-400'}`}>{stage.subtitle}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 모바일 단계 선택 */}
          <div className="md:hidden w-full mb-4">
            <div className="overflow-x-auto flex gap-2 pb-1">
              {AGE_STAGES.map((stage) => {
                const isCurrent = ageMonths !== null && ageMonths >= stage.min && ageMonths < stage.max
                const isSelected = selectedStage === stage.slug
                return (
                  <button
                    key={stage.slug}
                    onClick={() => setSelectedStage(stage.slug)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      isSelected ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                    style={isSelected ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                    {stage.label}{isCurrent ? ' 🔥' : ''}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            {currentStage && (
              <>
                {/* 단계 헤더 */}
                <div className="rounded-2xl p-5 md:p-6 text-white mb-6"
                     style={{ background: 'linear-gradient(135deg, #9B7EDE 0%, #B794F6 100%)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">{currentStage.label}</p>
                      <h2 className="text-xl md:text-2xl font-bold">{currentStage.subtitle}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black">{stageProducts.length}</p>
                      <p className="text-purple-200 text-xs">추천 아이템</p>
                    </div>
                  </div>

                  {ageMonths !== null && currentStage.min > ageMonths && (
                    <div className="mt-4 bg-white/20 rounded-xl px-4 py-2 inline-block">
                      <span className="text-sm font-semibold">
                        ⏰ {currentStage.min - ageMonths}개월 후 시작 — 지금 미리 준비하세요
                      </span>
                    </div>
                  )}
                  {ageMonths !== null && ageMonths >= currentStage.min && ageMonths < currentStage.max && (
                    <div className="mt-4 bg-white/20 rounded-xl px-4 py-2 inline-block">
                      <span className="text-sm font-semibold">🔥 지금 이 시기에요</span>
                    </div>
                  )}
                </div>

                {/* 필수 아이템 */}
                {essentials.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                      필수 아이템 ({essentials.length}개)
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {essentials.map((p) => (
                        <GuideProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 상황별·선택 아이템 */}
                {others.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-300 inline-block"></span>
                      상황별·선택 아이템 ({others.length}개)
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {others.map((p) => (
                        <GuideProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-16 bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <Link href="/" className="font-bold text-purple-500">똑똑한 엄마</Link>
          <p>이 정보는 참고용이며 의료적 조언이 아닙니다.</p>
        </div>
      </footer>
    </div>
  )
}

function GuideProductCard({ product }: { product: ProductWithPriority }) {
  const necessity = NECESSITY_LABELS[product.necessity]
  const category = CATEGORY_INFO[product.categorySlug]

  return (
    <Link href={`/products/${product.id}`}
          className="flex items-start gap-3 bg-white rounded-2xl p-4 border-2 border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${category?.color ?? 'bg-gray-50'}`}>
        {category?.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${necessity?.bg} ${necessity?.color}`}>
            {necessity?.label}
          </span>
        </div>
        <p className="text-sm font-bold text-gray-800 group-hover:text-purple-600 transition-colors leading-snug">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{product.priceRange}</p>
      </div>
    </Link>
  )
}
