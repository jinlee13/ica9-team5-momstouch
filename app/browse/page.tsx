'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { fetchMarketProductsByCat, type MarketProduct } from '@/lib/supabase-queries'
import { cartStore } from '@/lib/cart'
import CartBadge from '@/components/CartBadge'

const CATEGORIES = [
  {
    main: '자기·위생',
    icon: '🛏️',
    subs: [
      { mid: '수면용품',       subs: ['속싸개·스와들', '신생아침대·범퍼침대', '수면조명·자장가'] },
      { mid: '기저귀·위생용품', subs: ['기저귀', '물티슈', '손수건', '세제·세탁', '위생용품'] },
      { mid: '위생·케어용품',  subs: ['구강케어', '스킨케어', '베이비케어'] },
    ],
  },
  {
    main: '먹기',
    icon: '🍼',
    subs: [
      { mid: '젖병·수유용품', subs: ['젖병', '젖병 액세서리', '분유', '수유쿠션'] },
      { mid: '이유식·식기',  subs: ['이유식', '아기식기', '이유식메이커'] },
    ],
  },
  {
    main: '놀기·배우기',
    icon: '🧸',
    subs: [
      { mid: '치발기·완구', subs: ['치발기', '모빌', '감각발달완구', '사운드완구', '영유아완구'] },
    ],
  },
  {
    main: '외출·안전',
    icon: '🚗',
    subs: [
      { mid: '외출용품', subs: ['유모차', '아기띠·슬링', '여행용품'] },
      { mid: '카시트',   subs: ['카시트'] },
      { mid: '안전용품', subs: ['안전게이트', '모서리보호대'] },
    ],
  },
]

const PAGE_SIZE = 20

export default function BrowsePage() {
  const [selectedMain, setSelectedMain] = useState(CATEGORIES[0].main)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [products, setProducts] = useState<MarketProduct[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set())
  const [totalCount, setTotalCount] = useState(0)

  const mainCat = CATEGORIES.find(c => c.main === selectedMain)!

  const load = useCallback(async (pg: number, reset = false) => {
    setLoading(true)
    const sub = selectedSub ?? undefined
    const { data, hasMore: more } = await fetchMarketProductsByCat(
      selectedMain, undefined, sub, pg, PAGE_SIZE
    )
    setProducts(prev => reset ? data : [...prev, ...data])
    setHasMore(more)
    setLoading(false)
    if (reset) setTotalCount(0) // 정확한 count는 별도 쿼리 필요
  }, [selectedMain, selectedSub])

  useEffect(() => {
    setPage(0)
    setProducts([])
    load(0, true)
  }, [selectedMain, selectedSub, load])

  function handleMainChange(main: string) {
    setSelectedMain(main)
    setSelectedSub(null)
    setPage(0)
  }

  function handleSubChange(sub: string | null) {
    setSelectedSub(prev => prev === sub ? null : sub)
    setPage(0)
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    load(next)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-3">
            <Link href="/home" className="text-sm text-gray-500 hover:text-purple-600">← 홈</Link>
            <CartBadge />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 mb-1">🛍️ 전체 상품</h1>
          <p className="text-gray-500 text-sm">수집된 5,000개+ 육아용품을 카테고리별로 탐색하세요</p>
        </div>

        {/* 대분류 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.main}
              onClick={() => handleMainChange(cat.main)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all ${
                selectedMain === cat.main
                  ? 'text-white shadow-md'
                  : 'bg-white text-gray-600 border-2 border-gray-100 hover:border-purple-200'
              }`}
              style={selectedMain === cat.main ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}
            >
              {cat.icon} {cat.main}
            </button>
          ))}
        </div>

        {/* 소분류 탭 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handleSubChange(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border-2 ${
              !selectedSub ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-100 bg-white text-gray-600 hover:border-purple-200'
            }`}
          >
            전체
          </button>
          {mainCat.subs.flatMap(mid => mid.subs).map(sub => (
            <button
              key={sub}
              onClick={() => handleSubChange(sub)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border-2 ${
                selectedSub === sub ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-gray-100 bg-white text-gray-600 hover:border-purple-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* 상품 그리드 */}
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-4xl animate-pulse">🔍</div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-semibold">해당 카테고리 데이터가 없어요</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">{products.length}개 표시 중</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map(mp => {
                const added = addedIds.has(mp.id)
                return (
                  <div key={mp.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                    {/* 이미지 (클릭 → 상세) */}
                    <Link href={`/market/${mp.id}`} className="block aspect-square overflow-hidden bg-gray-50">
                      {mp.thumbnail_url ? (
                        <img
                          src={mp.thumbnail_url}
                          alt={mp.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement
                            el.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-4xl">🛍️</div>'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                      )}
                    </Link>

                    {/* 정보 */}
                    <div className="p-3 flex flex-col flex-1">
                      {mp.brand && (
                        <p className="text-xs text-gray-400 mb-0.5 truncate">{mp.brand}</p>
                      )}
                      <Link href={`/market/${mp.id}`}>
                        <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-purple-700 transition-colors mb-1">
                          {mp.name}
                        </p>
                      </Link>
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-sm font-black text-purple-600">{mp.price ?? '가격 문의'}</span>
                        {mp.original_price && mp.original_price !== mp.price && (
                          <span className="text-xs text-gray-300 line-through">{mp.original_price}</span>
                        )}
                      </div>
                      {mp.rating && (
                        <p className="text-xs text-gray-400 mb-2">⭐ {mp.rating} · {mp.review_count?.toLocaleString()}개</p>
                      )}

                      {/* 장바구니 */}
                      <button
                        onClick={() => {
                          cartStore.add({
                            id: mp.id, name: mp.name, brand: mp.brand,
                            price: mp.price, original_price: mp.original_price,
                            thumbnail_url: mp.thumbnail_url,
                            category_main: mp.category_main, category_sub: mp.category_sub,
                          })
                          setAddedIds(prev => new Set(prev).add(mp.id))
                        }}
                        className={`mt-auto w-full py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                          added
                            ? 'bg-green-50 text-green-600 border-green-200'
                            : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        {added ? '✅ 담김' : '🛒 담기'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 더보기 */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 rounded-2xl font-semibold text-sm border-2 border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  {loading ? '불러오는 중...' : '더 보기 →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
