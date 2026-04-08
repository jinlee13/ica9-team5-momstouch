'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { calculateAgeInMonths, getAgeLabel } from '@/lib/recommendations'
import { fetchMarketProductsByCat, fetchMarketCountByCategory, type MarketProduct } from '@/lib/supabase-queries'

// ── 카테고리 구조 ──────────────────────────────────────
const CATEGORY_TREE: Record<string, {
  icon: string
  color: string
  midCategories: Record<string, string[]>
}> = {
  '먹기': {
    icon: '🍼',
    color: '#F59E0B',
    midCategories: {
      '젖병·수유용품': ['젖병', '분유', '젖병 액세서리'],
    },
  },
  '자기·위생': {
    icon: '🛁',
    color: '#8B5CF6',
    midCategories: {
      '기저귀·위생용품': ['기저귀', '물티슈', '세제·세탁', '손수건', '위생용품'],
      '수면용품': ['속싸개·스와들'],
      '위생·케어용품': ['구강케어', '베이비케어', '스킨케어'],
    },
  },
  '놀기·배우기': {
    icon: '🧸',
    color: '#10B981',
    midCategories: {
      '치발기·완구': ['감각발달완구', '모빌', '사운드완구', '영유아완구', '치발기'],
    },
  },
  '외출·안전': {
    icon: '🚗',
    color: '#3B82F6',
    midCategories: {
      '외출용품': ['아기띠·슬링', '유모차'],
    },
  },
}

const MAIN_CATEGORIES = Object.keys(CATEGORY_TREE)

export default function HomePage() {
  const router = useRouter()
  const [birthdate, setBirthdate] = useState<string | null>(null)
  const [ageMonths, setAgeMonths] = useState(0)
  const [activeMain, setActiveMain] = useState(MAIN_CATEGORIES[0])
  const [activeMid, setActiveMid] = useState<string | null>(null)
  const [activeSub, setActiveSub] = useState<string | null>(null)
  const [products, setProducts] = useState<MarketProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [marketCounts, setMarketCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const saved = localStorage.getItem('ddokddok_birthdate')
    if (!saved) { router.push('/'); return }
    setBirthdate(saved)
    setAgeMonths(calculateAgeInMonths(saved))
    fetchMarketCountByCategory().then(setMarketCounts)
  }, [router])

  const loadProducts = useCallback(async (main: string, mid: string | null, sub: string | null, pg: number, append = false) => {
    setLoading(true)
    const result = await fetchMarketProductsByCat(main, mid ?? undefined, sub ?? undefined, pg)
    setProducts(prev => append ? [...prev, ...result.data] : result.data)
    setHasMore(result.hasMore)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!birthdate) return
    setPage(0)
    loadProducts(activeMain, activeMid, activeSub, 0)
  }, [birthdate, activeMain, activeMid, activeSub, loadProducts])

  function selectMain(main: string) {
    setActiveMain(main)
    setActiveMid(null)
    setActiveSub(null)
    setPage(0)
  }

  function selectMid(mid: string) {
    setActiveMid(prev => prev === mid ? null : mid)
    setActiveSub(null)
    setPage(0)
  }

  function selectSub(sub: string) {
    setActiveSub(prev => prev === sub ? null : sub)
    setPage(0)
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    loadProducts(activeMain, activeMid, activeSub, next, true)
  }

  const currentTree = CATEGORY_TREE[activeMain]
  const midCategories = Object.keys(currentTree.midCategories)
  const subCategories = activeMid ? currentTree.midCategories[activeMid] : []

  const SLUG_MAP: Record<string, string> = {
    '먹기': 'feeding', '자기·위생': 'sleep', '놀기·배우기': 'play', '외출·안전': 'outdoor'
  }

  if (!birthdate) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-sm font-bold" style={{ color: '#9B7EDE' }}>{getAgeLabel(ageMonths)}</span>
            <Link href="/guide"
              className="hidden sm:block text-sm font-semibold px-3 py-1.5 rounded-full border-2 border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
              📅 준비 가이드
            </Link>
            <Link href="/checklist"
              className="text-sm font-semibold px-3 py-1.5 rounded-full border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors">
              ✅ 체크리스트
            </Link>
            <button
              onClick={() => { localStorage.removeItem('ddokddok_birthdate'); router.push('/') }}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-full px-2 py-1.5">
              변경
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* 대분류 탭 */}
        <div className="flex gap-2 md:gap-3 mb-5 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
          {MAIN_CATEGORIES.map((main) => {
            const cat = CATEGORY_TREE[main]
            const isActive = activeMain === main
            const cnt = marketCounts[SLUG_MAP[main]] ?? 0
            return (
              <button
                key={main}
                onClick={() => selectMain(main)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all text-sm flex-shrink-0 ${
                  isActive ? 'text-white shadow-lg' : 'bg-white text-gray-500 border-2 border-gray-100 hover:border-gray-300'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` } : {}}>
                <span className="text-lg">{cat.icon}</span>
                <span>{main}</span>
                {cnt > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {cnt}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 중분류 탭 */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {midCategories.map((mid) => (
            <button
              key={mid}
              onClick={() => selectMid(mid)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeMid === mid
                  ? 'text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
              style={activeMid === mid ? { background: `linear-gradient(135deg, ${currentTree.color}, ${currentTree.color}cc)` } : {}}>
              {mid}
            </button>
          ))}
        </div>

        {/* 소분류 칩 */}
        {activeMid && subCategories.length > 0 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            {subCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => selectSub(sub)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeSub === sub
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                style={activeSub === sub ? { background: currentTree.color } : {}}>
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* 현재 필터 표시 */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{activeMain}</span>
          {activeMid && <><span>›</span><span className="font-semibold text-gray-700">{activeMid}</span></>}
          {activeSub && <><span>›</span><span className="font-semibold" style={{ color: currentTree.color }}>{activeSub}</span></>}
          <span className="ml-auto text-xs text-gray-400">{products.length}개 제품</span>
        </div>

        {/* 제품 그리드 */}
        {loading && products.length === 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="w-full h-40 bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-gray-100">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 font-medium">이 카테고리 제품을 준비 중이에요</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} accentColor={currentTree.color} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 rounded-2xl text-white font-bold shadow-md disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${currentTree.color}, ${currentTree.color}cc)` }}>
                  {loading ? '불러오는 중...' : '더 보기'}
                </button>
              </div>
            )}
          </>
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

function ProductCard({ product, accentColor }: { product: MarketProduct; accentColor: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col overflow-hidden">
      {/* 썸네일 */}
      <div className="w-full h-44 bg-gray-50 overflow-hidden flex-shrink-0">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">📦</div>
        )}
      </div>

      {/* 내용 */}
      <div className="p-4 flex flex-col flex-1">
        {product.brand && (
          <p className="text-xs font-bold text-gray-400 mb-1 truncate">{product.brand}</p>
        )}
        <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 mb-2 flex-1">{product.name}</p>

        <div className="flex items-center gap-2 mb-1">
          {product.original_price && product.original_price !== product.price && (
            <span className="text-xs text-gray-300 line-through">{product.original_price}</span>
          )}
          <span className="text-sm font-bold" style={{ color: accentColor }}>{product.price}</span>
        </div>

        {(product.rating || (product.review_count && product.review_count > 0)) && (
          <div className="flex items-center gap-1 mb-3">
            {product.rating && <span className="text-xs text-gray-400">⭐ {product.rating}</span>}
            {product.review_count && product.review_count > 0
              ? <span className="text-xs text-gray-300">· 리뷰 {product.review_count.toLocaleString()}</span>
              : null}
          </div>
        )}

        {product.age_recommendation && (
          <p className="text-xs text-purple-500 font-semibold mb-3">👶 {product.age_recommendation}</p>
        )}

        <a
          href={product.detail_url ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2.5 text-center text-sm font-bold rounded-xl text-white transition-all"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}>
          구매하기 →
        </a>
      </div>
    </div>
  )
}
