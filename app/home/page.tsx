'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  calculateAgeInMonths,
  getAgeLabel,
  getAgeGroupForMonths,
  NECESSITY_LABELS,
  CATEGORY_INFO,
  type ProductWithPriority,
  type Priority,
} from '@/lib/recommendations'
import { fetchRecommendations, fetchDdokFramework, PRODUCT_TO_CATEGORY_SUB } from '@/lib/supabase-queries'

const PRIORITY_TABS: { key: Priority; label: string; emoji: string; desc: string }[] = [
  { key: 'NOW', label: '지금 필요', emoji: '🔥', desc: '현재 개월 수에 딱 맞는 아이템' },
  { key: 'SOON', label: '곧 필요', emoji: '⏰', desc: '앞으로 2개월 안에 필요한 것' },
  { key: 'LATER', label: '아직 이른 것', emoji: '📦', desc: '미리 알아두면 좋은 것' },
]

const CATEGORY_TABS = [
  { key: 'all', label: '전체', icon: '🏠' },
  { key: 'sleep', label: '자기·위생', icon: '🛏️' },
  { key: 'feeding', label: '먹기', icon: '🍼' },
  { key: 'play', label: '놀기·배우기', icon: '🧸' },
  { key: 'outdoor', label: '외출·안전', icon: '🚗' },
]

export default function HomePage() {
  const router = useRouter()
  const [birthdate, setBirthdate] = useState<string | null>(null)
  const [ageMonths, setAgeMonths] = useState(0)
  const [activeTab, setActiveTab] = useState<Priority>('NOW')
  const [activeCategory, setActiveCategory] = useState('all')
  const [products, setProducts] = useState<ProductWithPriority[]>([])
  const [checklistState, setChecklistState] = useState<Record<string, string>>({})
  const [ddok, setDdok] = useState<{ label: string; subtitle: string; reason_template: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('ddokddok_birthdate')
    if (!saved) { router.push('/'); return }
    setBirthdate(saved)
    const months = calculateAgeInMonths(saved)
    setAgeMonths(months)
    const cl = localStorage.getItem('ddokddok_checklist')
    if (cl) setChecklistState(JSON.parse(cl))
    fetchRecommendations(months).then(setProducts)
    fetchDdokFramework(months).then(setDdok)
  }, [router])

  const filtered = products.filter((p) => {
    if (p.priority !== activeTab) return false
    if (activeCategory !== 'all' && p.categorySlug !== activeCategory) return false
    return true
  })

  const nowCount = products.filter((p) => p.priority === 'NOW').length
  const boughtCount = Object.values(checklistState).filter((v) => v === 'BOUGHT').length
  const soonProducts = products.filter((p) => p.priority === 'SOON').slice(0, 3)

  if (!birthdate) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden sm:block text-sm text-gray-500">
              우리 아이: <strong className="text-gray-800">{getAgeLabel(ageMonths)}</strong>
            </span>
            <span className="sm:hidden text-sm font-bold" style={{ color: '#9B7EDE' }}>{getAgeLabel(ageMonths)}</span>
            <Link href="/checklist"
                  className="text-sm font-semibold px-3 md:px-4 py-2 rounded-full border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors">
              ✅ <span className="hidden sm:inline">체크리스트</span>
            </Link>
            <button
              onClick={() => {
                if (confirm('생년월일을 변경하면 초기화됩니다. 계속하시겠어요?')) {
                  localStorage.removeItem('ddokddok_birthdate')
                  router.push('/')
                }
              }}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-full px-2 md:px-3 py-1.5 transition-colors">
              ⚙️ <span className="hidden sm:inline">생년월일 변경</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="grid md:grid-cols-3 gap-5">
            {/* Age Card */}
            <div className="md:col-span-2 rounded-3xl p-7 text-white relative overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, #9B7EDE 0%, #B794F6 100%)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                   style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
              <p className="text-purple-100 text-sm font-medium mb-1">우리 아이는 지금</p>
              <h1 className="text-4xl font-black mb-4">{getAgeLabel(ageMonths)} <span className="text-2xl font-normal">이에요</span></h1>
              {ddok && (
                <div className="bg-white/20 rounded-2xl p-4">
                  <p className="text-xs text-purple-100 font-semibold mb-1">🧠 DDOK 발달 나침반 · {ddok.label}</p>
                  <p className="text-sm text-white font-medium">{ddok.subtitle}</p>
                  <p className="text-xs text-purple-100 mt-1 leading-relaxed line-clamp-2">{ddok.reason_template}</p>
                </div>
              )}
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4">이번 달 필수템 완료</h3>
              <div className="text-center mb-4">
                <span className="text-5xl font-black" style={{ color: '#9B7EDE' }}>{boughtCount}</span>
                <span className="text-2xl text-gray-300 mx-2">/</span>
                <span className="text-2xl font-bold text-gray-400">{nowCount}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
                <div className="h-3 rounded-full transition-all duration-700"
                     style={{
                       width: nowCount > 0 ? `${(boughtCount / nowCount) * 100}%` : '0%',
                       background: 'linear-gradient(to right, #9B7EDE, #B794F6)'
                     }} />
              </div>
              <Link href="/checklist"
                    className="block w-full py-2.5 text-center text-sm font-semibold rounded-xl border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors">
                체크리스트 관리 →
              </Link>
            </div>
          </div>
        </div>

        {/* Soon Banner */}
        {soonProducts.length > 0 && (
          <div className="mb-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏰</span>
                <span className="font-bold text-amber-800 text-sm md:text-base">곧 필요해요 — 미리 준비하세요!</span>
              </div>
              <button
                onClick={() => setActiveTab('SOON')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors underline underline-offset-2">
                전체 보기 →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {soonProducts.map((p) => {
                const monthsUntil = p.ageMinMonths - ageMonths
                return (
                  <Link key={p.id} href={`/products/${p.id}`}
                        className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100 hover:border-amber-300 transition-all">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center bg-amber-100">
                      <span className="text-xs font-black text-amber-700">{monthsUntil}m</span>
                      <span className="text-xs text-amber-500">후</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.priceRange}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Priority Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1 -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
          {PRIORITY_TABS.map((tab) => {
            const count = products.filter((p) => p.priority === tab.key).length
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive ? 'text-white shadow-lg' : 'bg-white text-gray-500 border-2 border-gray-100 hover:border-purple-200 hover:text-purple-600'
                }`}
                style={isActive ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                <span className="text-lg">{tab.emoji}</span>
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex gap-8">
          {/* Sidebar — Category Filter */}
          <div className="hidden lg:block w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm sticky top-24">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">카테고리</p>
              <div className="space-y-1">
                {CATEGORY_TABS.map((cat) => {
                  const isActive = activeCategory === cat.key
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={isActive ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mobile Category Scroll */}
          <div className="lg:hidden -mx-6 px-6 mb-4 overflow-x-auto flex gap-2 pb-1">
            {CATEGORY_TABS.map((cat) => {
              const isActive = activeCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isActive ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                  style={isActive ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                  {cat.icon} {cat.label}
                </button>
              )
            })}
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border-2 border-gray-100">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-500 font-medium text-lg">이 조건에 해당하는 아이템이 없어요</p>
                <p className="text-gray-400 text-sm mt-2">다른 카테고리나 탭을 확인해보세요</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    checklistState={checklistState}
                    ageMonths={ageMonths}
                    hasMarketData={product.id in PRODUCT_TO_CATEGORY_SUB}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <Link href="/" className="font-bold text-purple-500">똑똑한 엄마</Link>
          <p>이 정보는 참고용이며 의료적 조언이 아닙니다.</p>
        </div>
      </footer>
    </div>
  )
}

function ProductCard({
  product,
  checklistState,
  ageMonths,
  hasMarketData,
}: {
  product: ProductWithPriority
  checklistState: Record<string, string>
  ageMonths: number
  hasMarketData: boolean
}) {
  const router = useRouter()
  const necessity = NECESSITY_LABELS[product.necessity]
  const category = CATEGORY_INFO[product.categorySlug]
  const status = checklistState[product.id]

  const statusStyle =
    status === 'BOUGHT' ? 'border-green-200' :
    status === 'PENDING' ? 'border-yellow-200' :
    status === 'SKIP' ? 'border-red-100' :
    'border-gray-100 hover:border-purple-200'

  const checkBtnStyle =
    status === 'BOUGHT' ? 'bg-green-100 text-green-700 border-green-300' :
    status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
    status === 'SKIP' ? 'bg-red-50 text-red-500 border-red-200' :
    'border-purple-200 text-purple-600 hover:bg-purple-50'

  const checkBtnLabel =
    status === 'BOUGHT' ? '✅ 완료' :
    status === 'PENDING' ? '⏳ 보류' :
    status === 'SKIP' ? '🚫 생략' :
    '☑️ 체크'

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden ${statusStyle}`}>
      {/* Card Top */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${category?.color ?? 'bg-gray-50'}`}>
            {category?.icon}
          </div>
          <div className="flex flex-wrap gap-1 justify-end">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${necessity?.bg} ${necessity?.color}`}>
              {necessity?.label}
            </span>
            {product.kcCertified && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-700">KC</span>
            )}
          </div>
        </div>

        {product.priority === 'SOON' && (
          <div className="mb-2">
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
              ⏰ {product.ageMinMonths - ageMonths}개월 후 필요
            </span>
          </div>
        )}
        <Link href={`/products/${product.id}`}>
          <h3 className={`font-bold text-gray-800 leading-snug hover:text-purple-600 transition-colors mb-2 ${
            status === 'BOUGHT' ? 'line-through text-gray-400' : ''
          }`}>
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{product.reason}</p>
      </div>

      {/* Card Footer */}
      <div className="mt-auto border-t border-gray-50 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-600">{product.priceRange}</span>
          <div className="flex items-center gap-1">
            {hasMarketData ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 font-bold">
                🛒 구매처
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                준비중
              </span>
            )}
            {product.ddokPillars.map((p) => (
              <span key={p} className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-bold">{p}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}`}
                className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl border-2 border-gray-100 text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-all">
            자세히
          </Link>
          <button
            onClick={() => router.push('/checklist')}
            className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-xl border-2 transition-all ${checkBtnStyle}`}>
            {checkBtnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
