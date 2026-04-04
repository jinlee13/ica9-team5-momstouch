'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  calculateAgeInMonths,
  getRecommendations,
  getAgeLabel,
  NECESSITY_LABELS,
  CATEGORY_INFO,
  type ProductWithPriority,
} from '@/lib/recommendations'

type StatusFilter = 'ALL' | 'BOUGHT' | 'PENDING' | 'SKIP' | 'NONE'

export default function ChecklistPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithPriority[]>([])
  const [checklistState, setChecklistState] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [ageMonths, setAgeMonths] = useState(0)

  useEffect(() => {
    const birthdate = localStorage.getItem('ddokddok_birthdate')
    if (!birthdate) { router.push('/'); return }
    const months = calculateAgeInMonths(birthdate)
    setAgeMonths(months)
    setProducts(getRecommendations(months))
    const cl = localStorage.getItem('ddokddok_checklist')
    if (cl) setChecklistState(JSON.parse(cl))
  }, [router])

  function updateStatus(id: string, status: string) {
    const next = { ...checklistState }
    if (status) next[id] = status
    else delete next[id]
    setChecklistState(next)
    localStorage.setItem('ddokddok_checklist', JSON.stringify(next))
  }

  const nowProducts = products.filter((p) => p.priority === 'NOW')
  const boughtCount = nowProducts.filter((p) => checklistState[p.id] === 'BOUGHT').length
  const pendingCount = nowProducts.filter((p) => checklistState[p.id] === 'PENDING').length
  const skipCount = nowProducts.filter((p) => checklistState[p.id] === 'SKIP').length
  const noneCount = nowProducts.filter((p) => !checklistState[p.id]).length

  const STATUS_TABS: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'ALL', label: '전체', count: nowProducts.length },
    { key: 'NONE', label: '미체크', count: noneCount },
    { key: 'BOUGHT', label: '✅ 구매완료', count: boughtCount },
    { key: 'PENDING', label: '⏳ 보류', count: pendingCount },
    { key: 'SKIP', label: '🚫 생략', count: skipCount },
  ]

  const filtered = nowProducts.filter((p) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'NONE') return !checklistState[p.id]
    return checklistState[p.id] === statusFilter
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-sm text-gray-500 hover:text-purple-600 transition-colors">← 홈으로</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-1">✅ 체크리스트</h1>
          <p className="text-gray-500">{getAgeLabel(ageMonths)} · 지금 필요한 아이템 구매 현황</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '전체', count: nowProducts.length, color: 'text-gray-700', bg: 'bg-white' },
            { label: '구매완료', count: boughtCount, color: 'text-green-600', bg: 'bg-green-50' },
            { label: '보류 중', count: pendingCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: '생략', count: skipCount, color: 'text-red-400', bg: 'bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border-2 border-gray-100 text-center`}>
              <div className={`text-4xl font-black ${stat.color} mb-1`}>{stat.count}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-gray-700">이번 달 완료율</span>
            <span className="text-xl font-black" style={{ color: '#9B7EDE' }}>
              {nowProducts.length > 0 ? Math.round((boughtCount / nowProducts.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4">
            <div className="h-4 rounded-full transition-all duration-700"
                 style={{
                   width: nowProducts.length > 0 ? `${(boughtCount / nowProducts.length) * 100}%` : '0%',
                   background: 'linear-gradient(to right, #9B7EDE, #B794F6)'
                 }} />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                  isActive ? 'text-white border-transparent shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                }`}
                style={isActive ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-gray-100">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium text-lg">해당하는 아이템이 없어요</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((product) => {
              const status = checklistState[product.id] ?? ''
              const necessity = NECESSITY_LABELS[product.necessity]
              const category = CATEGORY_INFO[product.categorySlug]

              return (
                <div key={product.id}
                     className={`bg-white rounded-2xl border-2 shadow-sm transition-all flex flex-col overflow-hidden ${
                       status === 'BOUGHT' ? 'border-green-200 opacity-80' : 'border-gray-100'
                     }`}>
                  <div className="p-5 flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${category?.color ?? 'bg-gray-50'}`}>
                        {category?.icon}
                      </div>
                      <div className="flex-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${necessity?.bg} ${necessity?.color}`}>
                          {necessity?.label}
                        </span>
                        <Link href={`/products/${product.id}`}
                              className={`block mt-1 font-bold text-sm hover:text-purple-600 transition-colors leading-snug ${
                                status === 'BOUGHT' ? 'line-through text-gray-400' : 'text-gray-800'
                              }`}>
                          {product.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{product.priceRange}</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-50 px-5 py-4">
                    <div className="flex gap-2">
                      {[
                        { key: 'BOUGHT', label: '✅ 완료', active: 'bg-green-100 text-green-700 border-green-300' },
                        { key: 'PENDING', label: '⏳ 보류', active: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                        { key: 'SKIP', label: '🚫 생략', active: 'bg-red-50 text-red-500 border-red-200' },
                      ].map((btn) => (
                        <button
                          key={btn.key}
                          onClick={() => updateStatus(product.id, status === btn.key ? '' : btn.key)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                            status === btn.key ? btn.active : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-300'
                          }`}>
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
