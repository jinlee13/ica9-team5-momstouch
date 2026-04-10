'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  calculateAgeInMonths,
  NECESSITY_LABELS,
  CATEGORY_INFO,
  DDOK_PILLAR_LABELS,
  type TopProduct,
  type Product,
} from '@/lib/recommendations'
import { fetchProductById, fetchDdokFramework, fetchMarketProducts, type MarketProduct } from '@/lib/supabase-queries'
import { trackProductView, trackMarketClick, trackChecklist } from '@/lib/analytics'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [status, setStatus] = useState<string>('')
  const [product, setProduct] = useState<Product | null>(null)
  const [ddok, setDdok] = useState<{ label: string; subtitle: string; reason_template: string } | null>(null)
  const [marketProducts, setMarketProducts] = useState<MarketProduct[]>([])

  useEffect(() => {
    const birthdate = localStorage.getItem('ddokddok_birthdate')
    if (!birthdate) { router.push('/'); return }
    const cl = localStorage.getItem('ddokddok_checklist')
    if (cl) setStatus(JSON.parse(cl)[params.id] ?? '')
    fetchProductById(params.id).then((p) => {
      setProduct(p)
      if (p) {
        const months = calculateAgeInMonths(birthdate)
        fetchDdokFramework(months).then(setDdok)
        fetchMarketProducts(p.categorySlug, params.id).then(setMarketProducts)
        trackProductView(params.id, p.name, p.categoryName)
      }
    })
  }, [params.id, router])

  function updateStatus(newStatus: string) {
    const cl = localStorage.getItem('ddokddok_checklist')
    const next = cl ? JSON.parse(cl) : {}
    if (newStatus) next[params.id] = newStatus
    else delete next[params.id]
    localStorage.setItem('ddokddok_checklist', JSON.stringify(next))
    setStatus(newStatus)
    if (product && newStatus) trackChecklist(params.id, product.name, newStatus)
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-5xl">😕</div>
        <p className="text-gray-600 font-medium text-lg">불러오는 중...</p>
        <Link href="/home" className="px-6 py-3 rounded-2xl text-white font-semibold"
              style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  const necessity = NECESSITY_LABELS[product.necessity]
  const category = CATEGORY_INFO[product.categorySlug]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()}
                    className="text-sm text-gray-500 hover:text-purple-600 transition-colors">
              ← 목록으로
            </button>
            <Link href="/checklist"
                  className="text-sm font-semibold px-4 py-2 rounded-full border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors">
              ✅ 체크리스트
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="grid md:grid-cols-5 gap-6 md:gap-8">
          {/* Left — Main Info */}
          <div className="md:col-span-3 space-y-5 md:space-y-6 order-2 md:order-1">
            {/* Product Header */}
            <div className="bg-white rounded-3xl p-7 border-2 border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl ${category?.color ?? 'bg-gray-50'}`}>
                  {category?.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">{product.categoryName} · {product.ageGroupSlug}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{product.developStage}</p>
                </div>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-4 leading-snug">{product.name}</h1>
              <div className="flex flex-wrap gap-2">
                <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${necessity?.bg} ${necessity?.color}`}>
                  {necessity?.label}
                </span>
                {product.kcCertified && (
                  <span className="text-sm font-bold px-4 py-1.5 rounded-full bg-green-50 text-green-700">
                    ✓ KC 안전인증
                  </span>
                )}
              </div>
            </div>

            {/* Why Now */}
            <div className="bg-white rounded-3xl p-7 border-2 border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">💡</span> 왜 지금 필요한가요?
              </h2>
              <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
                <p className="text-gray-700 leading-relaxed">{product.reason}</p>
              </div>
            </div>

            {/* Top Products from 안혜린 데이터 */}
            {product.topProducts && product.topProducts.length > 0 && (
              <div className="bg-white rounded-3xl p-7 border-2 border-yellow-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="text-2xl">🛒</span> 실제 인기 제품
                </h2>
                <p className="text-xs text-gray-400 mb-4">네이버쇼핑 실제 판매 데이터 기반</p>
                <div className="space-y-3">
                  {product.topProducts.map((tp: TopProduct, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                      <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-700 font-black text-sm flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-snug">{tp.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-sm font-bold text-amber-700">{tp.price}</span>
                          {tp.rating && (
                            <span className="text-xs text-gray-500">⭐ {tp.rating} · 리뷰 {tp.reviews.toLocaleString()}개</span>
                          )}
                          {!tp.rating && (
                            <span className="text-xs text-gray-500">리뷰 {tp.reviews.toLocaleString()}개</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DDOK Theory */}
            {ddok && (
              <div className="bg-white rounded-3xl p-7 border-2 border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🧠</span> DDOK 발달 이론 근거
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.ddokPillars.map((pillar) => {
                    const info = DDOK_PILLAR_LABELS[pillar]
                    return (
                      <span key={pillar}
                            className={`text-sm font-bold px-4 py-2 rounded-full ${info?.color ?? ''}`}>
                        {pillar} · {info?.description}
                      </span>
                    )
                  })}
                </div>
                <p className="text-gray-600 leading-relaxed mb-4">{product.theoryNote}</p>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {ddok.label} · {ddok.subtitle}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">{ddok.reason_template}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right — Sidebar */}
          <div className="md:col-span-2 space-y-5 order-1 md:order-2">
            {/* Buy Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-purple-100 shadow-lg md:sticky md:top-24">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">가격대</p>
                  <p className="font-bold text-gray-800 text-sm">{product.priceRange}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">KC인증</p>
                  <p className={`font-bold text-sm ${product.kcCertified ? 'text-green-600' : 'text-gray-400'}`}>
                    {product.kcCertified ? '✓ 필요' : '확인'}
                  </p>
                </div>
              </div>

              {/* Buy Link — market products */}
              {marketProducts.length > 0 ? (
                <div className="mb-3">
                  <p className="text-xs text-gray-400 font-medium mb-2 text-center">지금 살 수 있는 제품 {marketProducts.length}개</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {marketProducts.map((mp) => (
                      <a
                        key={mp.id}
                        href={mp.detail_url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => product && trackMarketClick(params.id, product.name, mp.id, mp.name, product.categoryName)}
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all group"
                      >
                        {mp.thumbnail_url ? (
                          <img
                            src={mp.thumbnail_url}
                            alt={mp.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-purple-700">
                            {mp.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-bold text-purple-600">{mp.price}</span>
                            {mp.rating && (
                              <span className="text-xs text-gray-400">⭐ {mp.rating}</span>
                            )}
                            {mp.review_count && mp.review_count > 0 ? (
                              <span className="text-xs text-gray-400">리뷰 {mp.review_count.toLocaleString()}</span>
                            ) : null}
                          </div>
                          {mp.brand && (
                            <p className="text-xs text-gray-400 truncate">{mp.brand}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-300 group-hover:text-purple-400 flex-shrink-0">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full py-4 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-sm text-center mb-3">
                  🛒 이 제품의 구매처 데이터를 준비 중이에요
                </div>
              )}

              {/* Checklist */}
              <p className="text-xs text-gray-400 text-center mb-3 font-medium">구매 현황 관리</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'BOUGHT', label: '✅ 완료', active: 'bg-green-100 text-green-700 border-green-300' },
                  { key: 'PENDING', label: '⏳ 보류', active: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                  { key: 'SKIP', label: '🚫 생략', active: 'bg-red-50 text-red-500 border-red-200' },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => updateStatus(status === btn.key ? '' : btn.key)}
                    className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      status === btn.key ? btn.active : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-300'
                    }`}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed text-center">
                이 정보는 참고용이며 의료적 조언이 아닙니다.<br/>
                아이의 발달 상태에 따라 소아과 전문의와 상담하세요.
              </p>
            </div>
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
