'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  calculateAgeInMonths,
  getAgeLabel,
  getRecommendations,
  getAgeGroupForMonths,
  getDdokFramework,
  NECESSITY_LABELS,
  CATEGORY_INFO,
  type ProductWithPriority,
  type Priority,
} from '@/lib/recommendations'

const PRIORITY_TABS: { key: Priority; label: string; emoji: string; desc: string }[] = [
  { key: 'NOW', label: '지금 필요', emoji: '🔥', desc: '현재 개월 수에 딱 맞는 아이템' },
  { key: 'SOON', label: '곧 필요', emoji: '⏰', desc: '2개월 안에 필요한 아이템' },
  { key: 'LATER', label: '아직 이른 것', emoji: '📦', desc: '미리 알아두면 좋은 아이템' },
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

  useEffect(() => {
    const saved = localStorage.getItem('ddokddok_birthdate')
    if (!saved) { router.push('/'); return }
    setBirthdate(saved)
    const months = calculateAgeInMonths(saved)
    setAgeMonths(months)
    setProducts(getRecommendations(months))
    const cl = localStorage.getItem('ddokddok_checklist')
    if (cl) setChecklistState(JSON.parse(cl))
  }, [router])

  const filtered = products.filter((p) => {
    if (p.priority !== activeTab) return false
    if (activeCategory !== 'all' && p.categorySlug !== activeCategory) return false
    return true
  })

  const nowCount = products.filter((p) => p.priority === 'NOW').length
  const soonCount = products.filter((p) => p.priority === 'SOON').length
  const boughtCount = Object.values(checklistState).filter((v) => v === 'BOUGHT').length
  const totalNow = nowCount

  const ageGroupSlug = getAgeGroupForMonths(ageMonths)
  const ddok = getDdokFramework(ageGroupSlug)

  if (!birthdate) return null

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-6"
           style={{ background: 'linear-gradient(to bottom right, rgba(155,126,222,0.1), rgba(183,148,246,0.08))' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500 font-medium">우리 아이는 지금</p>
            <h1 className="text-2xl font-bold text-gray-900">
              <span style={{ color: '#9B7EDE' }}>{getAgeLabel(ageMonths)}</span>이에요
            </h1>
          </div>
          <button
            onClick={() => { localStorage.removeItem('ddokddok_birthdate'); router.push('/') }}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-full px-3 py-1">
            변경
          </button>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">이번 달 필수템 완료</span>
            <span className="text-sm font-bold" style={{ color: '#9B7EDE' }}>{boughtCount}/{totalNow}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-500"
                 style={{
                   width: totalNow > 0 ? `${(boughtCount / totalNow) * 100}%` : '0%',
                   background: 'linear-gradient(to right, #9B7EDE, #B794F6)'
                 }} />
          </div>
        </div>

        {/* DDOK Theory Card */}
        {ddok && (
          <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <p className="text-xs font-bold text-purple-600 mb-1">DDOK 발달 나침반 · {ddok.label}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{ddok.subtitle}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">{ddok.reason_template}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Priority Tabs */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex gap-2">
          {PRIORITY_TABS.map((tab) => {
            const count = products.filter((p) => p.priority === tab.key).length
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 px-2 rounded-xl text-center transition-all duration-200 ${
                  isActive ? 'text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
                style={isActive ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                <div className="text-base">{tab.emoji}</div>
                <div className="text-xs font-semibold mt-0.5">{tab.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? 'text-purple-100' : 'text-gray-400'}`}>{count}개</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-5 py-3 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {CATEGORY_TABS.map((cat) => {
            const isActive = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isActive ? 'text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={isActive ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Product List */}
      <div className="px-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium">이 조건에 해당하는 아이템이 없어요</p>
            <p className="text-sm mt-1">다른 카테고리를 확인해보세요</p>
          </div>
        ) : (
          filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              checklistState={checklistState}
              onChecklistChange={(id, status) => {
                const next = { ...checklistState, [id]: status }
                setChecklistState(next)
                localStorage.setItem('ddokddok_checklist', JSON.stringify(next))
              }}
            />
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav active="home" />
    </div>
  )
}

function ProductCard({
  product,
  checklistState,
  onChecklistChange,
}: {
  product: ProductWithPriority
  checklistState: Record<string, string>
  onChecklistChange: (id: string, status: string) => void
}) {
  const necessity = NECESSITY_LABELS[product.necessity]
  const category = CATEGORY_INFO[product.categorySlug]
  const status = checklistState[product.id]

  return (
    <div className={`bg-white rounded-2xl p-4 border-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
      status === 'BOUGHT' ? 'border-green-200 opacity-80' : 'border-gray-100'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${category?.color ?? 'bg-gray-50'}`}>
          {category?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${necessity?.bg} ${necessity?.color}`}>
              {necessity?.label}
            </span>
            {product.kcCertified && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                KC인증
              </span>
            )}
          </div>
          <Link href={`/products/${product.id}`}>
            <h3 className={`font-semibold text-gray-800 hover:text-purple-600 transition-colors ${
              status === 'BOUGHT' ? 'line-through text-gray-400' : ''
            }`}>
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{product.reason}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-medium text-gray-600">{product.priceRange}</span>
            <div className="flex gap-1">
              {product.ddokPillars.map((p) => (
                <span key={p} className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 font-bold">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <Link href={`/products/${product.id}`}
              className="flex-1 py-2 text-center text-sm font-medium rounded-xl border-2 border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-colors">
          자세히 보기
        </Link>
        <button
          onClick={() => onChecklistChange(product.id, status === 'BOUGHT' ? '' : 'BOUGHT')}
          className={`flex-1 py-2 text-center text-sm font-medium rounded-xl transition-all ${
            status === 'BOUGHT'
              ? 'bg-green-100 text-green-700 border-2 border-green-200'
              : 'border-2 border-purple-200 text-purple-600 hover:bg-purple-50'
          }`}>
          {status === 'BOUGHT' ? '✅ 구매완료' : '체크하기'}
        </button>
      </div>
    </div>
  )
}

function BottomNav({ active }: { active: string }) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-3 flex justify-around z-50">
      {[
        { href: '/home', icon: '🏠', label: '홈', key: 'home' },
        { href: '/checklist', icon: '✅', label: '체크리스트', key: 'checklist' },
      ].map((nav) => (
        <Link key={nav.key} href={nav.href}
              className={`flex flex-col items-center gap-1 ${active === nav.key ? 'text-purple-600' : 'text-gray-400'}`}>
          <span className="text-xl">{nav.icon}</span>
          <span className="text-xs font-medium">{nav.label}</span>
        </Link>
      ))}
    </div>
  )
}
