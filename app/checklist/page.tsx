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
    const next = { ...checklistState, [id]: status }
    setChecklistState(next)
    localStorage.setItem('ddokddok_checklist', JSON.stringify(next))
  }

  const nowProducts = products.filter((p) => p.priority === 'NOW')
  const boughtCount = nowProducts.filter((p) => checklistState[p.id] === 'BOUGHT').length
  const pendingCount = nowProducts.filter((p) => checklistState[p.id] === 'PENDING').length
  const skipCount = nowProducts.filter((p) => checklistState[p.id] === 'SKIP').length
  const noneCount = nowProducts.filter((p) => !checklistState[p.id]).length

  const STATUS_TABS: { key: StatusFilter; label: string; count: number; color: string }[] = [
    { key: 'ALL', label: '전체', count: nowProducts.length, color: 'bg-gray-100 text-gray-700' },
    { key: 'NONE', label: '미체크', count: noneCount, color: 'bg-gray-50 text-gray-500' },
    { key: 'BOUGHT', label: '구매완료', count: boughtCount, color: 'bg-green-50 text-green-700' },
    { key: 'PENDING', label: '보류', count: pendingCount, color: 'bg-yellow-50 text-yellow-700' },
    { key: 'SKIP', label: '생략', count: skipCount, color: 'bg-red-50 text-red-500' },
  ]

  const filtered = nowProducts.filter((p) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'NONE') return !checklistState[p.id]
    return checklistState[p.id] === statusFilter
  })

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-8 pb-6"
           style={{ background: 'linear-gradient(to bottom right, rgba(155,126,222,0.08), rgba(183,148,246,0.06))' }}>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">✅ 체크리스트</h1>
        <p className="text-sm text-gray-500">{getAgeLabel(ageMonths)} · 지금 필요한 아이템 관리</p>

        {/* Progress */}
        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">이번 달 필수템 완료율</span>
            <span className="text-sm font-bold" style={{ color: '#9B7EDE' }}>
              {nowProducts.length > 0 ? Math.round((boughtCount / nowProducts.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className="h-3 rounded-full transition-all duration-500"
                 style={{
                   width: nowProducts.length > 0 ? `${(boughtCount / nowProducts.length) * 100}%` : '0%',
                   background: 'linear-gradient(to right, #9B7EDE, #B794F6)'
                 }} />
          </div>
          <div className="flex justify-between mt-3">
            {[
              { label: '구매완료', count: boughtCount, color: 'text-green-600' },
              { label: '보류', count: pendingCount, color: 'text-yellow-600' },
              { label: '생략', count: skipCount, color: 'text-red-400' },
              { label: '미체크', count: noneCount, color: 'text-gray-400' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.count}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="px-5 py-3 overflow-x-auto border-b border-gray-100">
        <div className="flex gap-2 w-max">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isActive ? 'text-white shadow-md' : `${tab.color} hover:opacity-80`
                }`}
                style={isActive ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-500'}`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-5 py-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium">해당하는 아이템이 없어요</p>
          </div>
        ) : (
          filtered.map((product) => {
            const status = checklistState[product.id] ?? ''
            const necessity = NECESSITY_LABELS[product.necessity]
            const category = CATEGORY_INFO[product.categorySlug]

            return (
              <div key={product.id}
                   className={`bg-white rounded-2xl p-4 border-2 shadow-sm transition-all ${
                     status === 'BOUGHT' ? 'border-green-200' : 'border-gray-100'
                   }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${category?.color ?? 'bg-gray-50'}`}>
                    {category?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${necessity?.bg} ${necessity?.color}`}>
                        {necessity?.label}
                      </span>
                    </div>
                    <Link href={`/products/${product.id}`}
                          className={`font-semibold text-sm hover:text-purple-600 transition-colors ${
                            status === 'BOUGHT' ? 'line-through text-gray-400' : 'text-gray-800'
                          }`}>
                      {product.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">{product.priceRange}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {[
                    { key: 'BOUGHT', label: '✅', tooltip: '구매완료', active: 'bg-green-100 text-green-700 border-green-300' },
                    { key: 'PENDING', label: '⏳', tooltip: '보류', active: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                    { key: 'SKIP', label: '🚫', tooltip: '생략', active: 'bg-red-50 text-red-500 border-red-200' },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => updateStatus(product.id, status === btn.key ? '' : btn.key)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        status === btn.key ? btn.active : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-300'
                      }`}
                      title={btn.tooltip}>
                      {btn.label} {btn.tooltip}
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-6 py-3 flex justify-around z-50">
        {[
          { href: '/home', icon: '🏠', label: '홈', key: 'home' },
          { href: '/checklist', icon: '✅', label: '체크리스트', key: 'checklist' },
        ].map((nav) => (
          <Link key={nav.key} href={nav.href}
                className={`flex flex-col items-center gap-1 ${nav.key === 'checklist' ? 'text-purple-600' : 'text-gray-400'}`}>
            <span className="text-xl">{nav.icon}</span>
            <span className="text-xs font-medium">{nav.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
