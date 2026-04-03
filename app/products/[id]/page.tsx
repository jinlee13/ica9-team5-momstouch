'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getProductById,
  getAgeGroupForMonths,
  getDdokFramework,
  calculateAgeInMonths,
  NECESSITY_LABELS,
  CATEGORY_INFO,
  DDOK_PILLAR_LABELS,
} from '@/lib/recommendations'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [status, setStatus] = useState<string>('')
  const [ageMonths, setAgeMonths] = useState(0)

  useEffect(() => {
    const birthdate = localStorage.getItem('ddokddok_birthdate')
    if (!birthdate) { router.push('/'); return }
    setAgeMonths(calculateAgeInMonths(birthdate))
    const cl = localStorage.getItem('ddokddok_checklist')
    if (cl) {
      const parsed = JSON.parse(cl)
      setStatus(parsed[params.id] ?? '')
    }
  }, [params.id, router])

  function updateStatus(newStatus: string) {
    const cl = localStorage.getItem('ddokddok_checklist')
    const parsed = cl ? JSON.parse(cl) : {}
    const next = { ...parsed, [params.id]: newStatus }
    localStorage.setItem('ddokddok_checklist', JSON.stringify(next))
    setStatus(newStatus)
  }

  const product = getProductById(params.id)

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-gray-600 font-medium">상품을 찾을 수 없어요</p>
        <Link href="/home" className="text-purple-600 font-semibold">홈으로 돌아가기</Link>
      </div>
    )
  }

  const necessity = NECESSITY_LABELS[product.necessity]
  const category = CATEGORY_INFO[product.categorySlug]
  const ageGroupSlug = getAgeGroupForMonths(product.ageMinMonths)
  const ddok = getDdokFramework(ageGroupSlug)

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-100">
        <button onClick={() => router.back()}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          ← 돌아가기
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${category?.color ?? 'bg-gray-50'}`}>
            {category?.icon}
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">{product.categoryName}</p>
            <p className="text-xs text-gray-400">{product.ageGroupSlug} · {product.developStage}</p>
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-900 leading-tight mb-3">{product.name}</h1>
        <div className="flex flex-wrap gap-2">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${necessity?.bg} ${necessity?.color}`}>
            {necessity?.label}
          </span>
          {product.kcCertified && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700">
              ✓ KC 안전인증
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Why Now */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> 왜 지금 필요한가요?
          </h2>
          <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
            <p className="text-sm text-gray-700 leading-relaxed">{product.reason}</p>
          </div>
        </section>

        {/* DDOK Theory */}
        {ddok && (
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">🧠</span> 발달 이론 근거 (DDOK)
            </h2>
            <div className="bg-white rounded-2xl p-4 border-2 border-purple-100 shadow-sm">
              <div className="flex flex-wrap gap-2 mb-3">
                {product.ddokPillars.map((pillar) => {
                  const info = DDOK_PILLAR_LABELS[pillar]
                  return (
                    <span key={pillar}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full ${info?.color ?? ''}`}>
                      {pillar} · {info?.description}
                    </span>
                  )
                })}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-2">{product.theoryNote}</p>
              <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-2 mt-2">
                {ddok.reason_template}
              </p>
            </div>
          </section>
        )}

        {/* Price & Safety */}
        <section>
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💰</span> 가격 & 안전 정보
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">가격대</p>
              <p className="text-sm font-bold text-gray-800">{product.priceRange}</p>
              <p className="text-xs text-gray-400 mt-1">참고용 가격입니다</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">KC 안전인증</p>
              <p className={`text-sm font-bold ${product.kcCertified ? 'text-green-600' : 'text-gray-500'}`}>
                {product.kcCertified ? '✓ 인증 필요' : '확인 필요'}
              </p>
              <p className="text-xs text-gray-400 mt-1">구매 시 직접 확인</p>
            </div>
          </div>
        </section>

        {/* Affiliate Notice */}
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
          <p className="text-xs text-yellow-700 font-medium">
            📢 쿠팡 파트너스 제휴 안내
          </p>
          <p className="text-xs text-yellow-600 mt-1 leading-relaxed">
            아래 구매 링크는 쿠팡 파트너스 제휴 링크입니다. 구매 시 일정 수수료가 발생할 수 있습니다.
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          이 정보는 참고용이며 의료적 조언이 아닙니다.<br/>
          아이의 발달 상태에 따라 전문가와 상담하세요.
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4 space-y-3">
        {/* Coupang Button */}
        {product.coupangUrl ? (
          <a href={product.coupangUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="block w-full py-4 rounded-full text-white font-bold text-base text-center shadow-lg transition-all hover:shadow-xl"
             style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
            🛍️ 쿠팡에서 바로 구매
          </a>
        ) : (
          <div className="w-full py-4 rounded-full bg-gray-100 text-gray-400 font-medium text-base text-center">
            🔗 구매 링크 준비 중
          </div>
        )}

        {/* Checklist Buttons */}
        <div className="flex gap-2">
          {[
            { key: 'BOUGHT', label: '✅ 구매완료', style: status === 'BOUGHT' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-500 border-gray-200' },
            { key: 'PENDING', label: '⏳ 보류', style: status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-gray-50 text-gray-500 border-gray-200' },
            { key: 'SKIP', label: '🚫 생략', style: status === 'SKIP' ? 'bg-red-50 text-red-500 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => updateStatus(status === btn.key ? '' : btn.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${btn.style}`}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
