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
import CartBadge from '@/components/CartBadge'
import ChatModal from '@/components/chat/ChatModal'

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

type StatusFilter = 'ALL' | 'BOUGHT' | 'PENDING' | 'SKIP' | 'NONE'

export default function HomePage() {
  const router = useRouter()
  const [birthdate, setBirthdate] = useState<string | null>(null)
  const [ageMonths, setAgeMonths] = useState(0)
  const [activeTab, setActiveTab] = useState<Priority>('NOW')
  const [activeCategory, setActiveCategory] = useState('all')
  const [products, setProducts] = useState<ProductWithPriority[]>([])
  const [checklistState, setChecklistState] = useState<Record<string, string>>({})
  const [ddok, setDdok] = useState<{ label: string; subtitle: string; reason_template: string } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  useEffect(() => {
    const saved = localStorage.getItem('ddokddok_birthdate')
    if (!saved) { router.push('/'); return }
    setBirthdate(saved)
    const months = calculateAgeInMonths(saved)
    setAgeMonths(months)
    const cl = localStorage.getItem('ddokddok_checklist')
    if (cl) setChecklistState(JSON.parse(cl))
    fetchRecommendations(months).then(all =>
      setProducts(all.filter(p => p.id in PRODUCT_TO_CATEGORY_SUB))
    )
    fetchDdokFramework(months).then(setDdok)
  }, [router])

  function updateStatus(id: string, status: string) {
    const next = { ...checklistState }
    if (status) next[id] = status
    else delete next[id]
    setChecklistState(next)
    localStorage.setItem('ddokddok_checklist', JSON.stringify(next))
  }

  const filtered = products.filter((p) => {
    if (p.priority !== activeTab) return false
    if (activeCategory !== 'all' && p.categorySlug !== activeCategory) return false
    return true
  })

  const nowProducts = products.filter((p) => p.priority === 'NOW')
  const boughtCount = nowProducts.filter((p) => checklistState[p.id] === 'BOUGHT').length
  const pendingCount = nowProducts.filter((p) => checklistState[p.id] === 'PENDING').length
  const skipCount = nowProducts.filter((p) => checklistState[p.id] === 'SKIP').length
  const noneCount = nowProducts.filter((p) => !checklistState[p.id]).length
  const soonProducts = products.filter((p) => p.priority === 'SOON').slice(0, 3)

  const STATUS_TABS: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'ALL', label: '전체', count: nowProducts.length },
    { key: 'NONE', label: '미체크', count: noneCount },
    { key: 'BOUGHT', label: '✅ 완료', count: boughtCount },
    { key: 'PENDING', label: '⏳ 보류', count: pendingCount },
    { key: 'SKIP', label: '🚫 생략', count: skipCount },
  ]

  const checklistFiltered = nowProducts.filter((p) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'NONE') return !checklistState[p.id]
    return checklistState[p.id] === statusFilter
  })

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
            <Link href="/browse"
                  className="text-sm font-semibold px-3 md:px-4 py-2 rounded-full border-2 border-gray-200 text-gray-600 hover:border-purple-200 hover:text-purple-600 transition-colors">
              🛍️ <span className="hidden sm:inline">전체 상품</span>
            </Link>
            <CartBadge />
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-purple-600 border border-gray-200 rounded-full px-2 md:px-3 py-1.5 transition-colors font-semibold">
              🏠 <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* AI 챗봇 배너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <button
          onClick={() => setChatOpen(true)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-white text-left transition-all hover:opacity-90 active:scale-[0.99] shadow-md"
          style={{ background: 'linear-gradient(135deg, #9B7EDE, #B794F6)' }}
        >
          <span className="text-2xl flex-shrink-0">🤱</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">AI에게 물어보세요</p>
            <p className="text-purple-100 text-xs truncate">
              {ageMonths}개월 맞춤 추천 · 육아 Q&A · 제품 비교
            </p>
          </div>
          <span className="text-purple-200 text-lg flex-shrink-0">→</span>
        </button>
      </div>

      {/* ChatModal */}
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} ageMonths={ageMonths} />

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

            {/* 상품 구매 현황 Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-gray-700 mb-3">상품 구매 현황</h3>

              {/* 완료율 */}
              <div className="text-center mb-3">
                <span className="text-4xl font-black" style={{ color: '#9B7EDE' }}>{boughtCount}</span>
                <span className="text-xl text-gray-300 mx-2">/</span>
                <span className="text-xl font-bold text-gray-400">{nowProducts.length}</span>
                <span className="text-xs text-gray-400 block mt-0.5">구매 완료</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div className="h-2 rounded-full transition-all duration-700"
                     style={{
                       width: nowProducts.length > 0 ? `${(boughtCount / nowProducts.length) * 100}%` : '0%',
                       background: 'linear-gradient(to right, #9B7EDE, #B794F6)'
                     }} />
              </div>

              {/* 상태 탭 */}
              <div className="flex flex-wrap gap-1 mb-3">
                {STATUS_TABS.map((tab) => {
                  const isActive = statusFilter === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setStatusFilter(tab.key)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isActive ? 'text-white border-transparent shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-purple-300'
                      }`}
                      style={isActive ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                      {tab.label}
                      <span className={`text-xs px-1 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* 상품 리스트 */}
              <div className="flex-1 overflow-y-auto max-h-52 space-y-2 pr-1">
                {checklistFiltered.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">해당 아이템 없음</p>
                ) : (
                  checklistFiltered.map((p) => {
                    const status = checklistState[p.id] ?? ''
                    return (
                      <div key={p.id} className={`rounded-xl border p-2.5 transition-all ${
                        status === 'BOUGHT' ? 'border-green-200 bg-green-50' :
                        status === 'PENDING' ? 'border-yellow-200 bg-yellow-50' :
                        status === 'SKIP' ? 'border-red-100 bg-red-50' :
                        'border-gray-100 bg-white'
                      }`}>
                        <p className={`text-xs font-semibold mb-2 leading-snug ${status === 'BOUGHT' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {p.name}
                        </p>
                        <div className="flex gap-1">
                          {[
                            { key: 'BOUGHT', label: '✅', active: 'bg-green-100 text-green-700 border-green-300' },
                            { key: 'PENDING', label: '⏳', active: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                            { key: 'SKIP', label: '🚫', active: 'bg-red-50 text-red-500 border-red-200' },
                          ].map((btn) => (
                            <button
                              key={btn.key}
                              onClick={() => updateStatus(p.id, status === btn.key ? '' : btn.key)}
                              className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                                status === btn.key ? btn.active : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-300'
                              }`}>
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
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
                    onStatusChange={updateStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Browse CTA */}
      <div className="max-w-7xl mx-auto px-6 mt-10 mb-4">
        <Link href="/browse"
              className="flex items-center justify-between bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-purple-200 hover:shadow-md transition-all group">
          <div>
            <p className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">🛍️ 전체 상품 둘러보기</p>
            <p className="text-sm text-gray-400 mt-0.5">기저귀, 물티슈, 분유 등 5,000개+ 육아용품 전체 탐색</p>
          </div>
          <span className="text-gray-300 text-xl group-hover:text-purple-400 transition-colors">›</span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="mt-4 bg-white border-t border-gray-100 py-8">
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
  onStatusChange,
}: {
  product: ProductWithPriority
  checklistState: Record<string, string>
  ageMonths: number
  onStatusChange: (id: string, status: string) => void
}) {
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

  function cycleStatus() {
    const next =
      !status ? 'BOUGHT' :
      status === 'BOUGHT' ? 'PENDING' :
      status === 'PENDING' ? 'SKIP' : ''
    onStatusChange(product.id, next)
  }

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
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 font-bold">
              🛒 구매처
            </span>
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
            onClick={cycleStatus}
            className={`flex-1 py-2.5 text-center text-sm font-semibold rounded-xl border-2 transition-all ${checkBtnStyle}`}>
            {checkBtnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
