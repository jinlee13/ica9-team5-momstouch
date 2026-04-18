'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { fetchMarketProductsByCat, fetchMarketProductsBySearch, type MarketProduct } from '@/lib/supabase-queries'
import { cartStore } from '@/lib/cart'
import CartBadge from '@/components/CartBadge'
import { calculateAgeInMonths, getAgeLabel } from '@/lib/recommendations'

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

// 월령 구간 필터 버튼
const AGE_FILTERS = [
  { label: '전체', value: null },
  { label: '0-3개월', value: 1 },
  { label: '3-6개월', value: 4 },
  { label: '6-12개월', value: 8 },
  { label: '12-24개월', value: 15 },
  { label: '24개월+', value: 28 },
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
  const [sortOrder, setSortOrder] = useState<'popular' | 'newest' | 'price_asc' | 'price_desc'>('popular')
  const [sortOpen, setSortOpen] = useState(false)

  // 검색
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MarketProduct[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 월령 필터
  const [myAgeMonths, setMyAgeMonths] = useState<number | null>(null)   // 우리 아이 월령
  const [selectedAge, setSelectedAge] = useState<number | null>(null)   // 선택된 필터 값
  const [useMyAge, setUseMyAge] = useState(false)                        // 우리 아이 월령 토글

  // localStorage에서 아이 생년월일 읽기
  useEffect(() => {
    const saved = localStorage.getItem('ddokddok_birthdate')
    if (saved) {
      setMyAgeMonths(calculateAgeInMonths(saved))
    }
  }, [])

  const mainCat = CATEGORIES.find(c => c.main === selectedMain)!

  // 실제 쿼리에 넘길 월령 (우리 아이 모드 or 수동 선택)
  const activeAgeMonths: number | undefined =
    useMyAge && myAgeMonths !== null ? myAgeMonths :
    selectedAge !== null ? selectedAge : undefined

  const load = useCallback(async (pg: number, reset = false) => {
    setLoading(true)
    const sub = selectedSub ?? undefined
    const { data, hasMore: more } = await fetchMarketProductsByCat(
      selectedMain, undefined, sub, pg, PAGE_SIZE, activeAgeMonths
    )
    setProducts(prev => reset ? data : [...prev, ...data])
    setHasMore(more)
    setLoading(false)
  }, [selectedMain, selectedSub, activeAgeMonths])

  useEffect(() => {
    setPage(0)
    setProducts([])
    load(0, true)
  }, [selectedMain, selectedSub, activeAgeMonths, load])

  function handleMainChange(main: string) {
    setSelectedMain(main)
    setSelectedSub(null)
    setPage(0)
  }

  function handleSubChange(sub: string | null) {
    setSelectedSub(prev => prev === sub ? null : sub)
    setPage(0)
  }

  function handleAgeFilter(val: number | null) {
    setUseMyAge(false)
    setSelectedAge(val)
    setPage(0)
  }

  function handleToggleMyAge() {
    setUseMyAge(prev => !prev)
    if (!useMyAge) setSelectedAge(null)
    setPage(0)
  }

  function loadMore() {
    const next = page + 1
    setPage(next)
    load(next)
  }

  const isAgeFiltered = useMyAge || selectedAge !== null

  function handleSearchInput(val: string) {
    setSearchInput(val)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (!val.trim()) {
      setSearchQuery('')
      setSearchResults([])
      return
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchQuery(val.trim())
      setSearchLoading(true)
      const results = await fetchMarketProductsBySearch(val.trim())
      setSearchResults(results)
      setSearchLoading(false)
    }, 400)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!searchInput.trim()) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    setSearchQuery(searchInput.trim())
    setSearchLoading(true)
    fetchMarketProductsBySearch(searchInput.trim()).then(results => {
      setSearchResults(results)
      setSearchLoading(false)
    })
  }

  const isSearchMode = searchQuery.length > 0

  const SORT_OPTIONS = [
    { value: 'popular',    label: '인기도순' },
    { value: 'newest',     label: '최신 등록순' },
    { value: 'price_asc',  label: '낮은 가격순' },
    { value: 'price_desc', label: '높은 가격순' },
  ] as const

  function parsePrice(p: string | null): number {
    if (!p) return 0
    return parseInt(p.replace(/[^0-9]/g, '')) || 0
  }

  const sortedProducts = useMemo(() => {
    const arr = [...products]
    if (sortOrder === 'newest') return arr.sort((a, b) => b.id - a.id)
    if (sortOrder === 'price_asc') return arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
    if (sortOrder === 'price_desc') return arr.sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
    return arr // popular: 이미 review_count desc
  }, [products, sortOrder])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:underline" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-3">
            <Link href="/home"
                  className="text-sm font-semibold px-4 py-2 rounded-full bg-white border-2 border-gray-200 text-gray-700 shadow-sm hover:border-purple-300 hover:text-purple-600 transition-all">
              🏠 <span className="hidden sm:inline">마이페이지</span>
            </Link>
            <CartBadge />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* 헤더 + 검색바 인라인 */}
        <div className="flex items-center gap-4 mb-5">
          <h1 className="text-2xl font-black text-gray-900 whitespace-nowrap">🛍️ 전체 상품</h1>
          <form onSubmit={handleSearchSubmit}>
          <div className="relative flex items-center rounded-full border-2 border-purple-300 bg-white shadow-sm hover:border-purple-400 focus-within:border-purple-500 focus-within:shadow-md transition-all w-[380px]">
            <span className="pl-4 text-purple-500 font-black text-base select-none" style={{ color: '#9B7EDE' }}>똑</span>
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchInput(e.target.value)}
              placeholder="육아용품 검색 (예: 유모차, 치발기, 젖병…)"
              className="flex-1 px-3 py-1.5 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none min-w-0"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(''); setSearchQuery(''); setSearchResults([]) }}
                className="px-1.5 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              className="mr-1.5 w-7 h-7 flex items-center justify-center rounded-full transition-all hover:bg-purple-100"
              style={{ color: '#9B7EDE' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </div>
          </form>
        </div>

        {/* 검색 모드 결과 */}
        {isSearchMode && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-bold text-gray-700">
                🔍 &quot;{searchQuery}&quot; 검색 결과
              </span>
              {!searchLoading && (
                <span className="text-xs text-gray-400">{searchResults.length}개</span>
              )}
              <button
                onClick={() => { setSearchInput(''); setSearchQuery(''); setSearchResults([]) }}
                className="ml-auto text-xs text-purple-500 underline hover:text-purple-700"
              >
                검색 초기화
              </button>
            </div>
            {searchLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-4xl animate-pulse">🔍</div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">😅</div>
                <p className="font-semibold">검색 결과가 없어요</p>
                <p className="text-sm mt-1">다른 키워드로 검색해보세요</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map(mp => {
                  const added = addedIds.has(mp.id)
                  return (
                    <div key={mp.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                      <Link href={`/market/${mp.id}`} className="block aspect-square overflow-hidden bg-gray-50">
                        {mp.thumbnail_url ? (
                          <img src={mp.thumbnail_url} alt={mp.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => { const el = e.target as HTMLImageElement; el.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-4xl">🛍️</div>' }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                        )}
                      </Link>
                      {mp.recommended_age_min !== null && mp.recommended_age_min !== undefined && (
                        <div className="px-3 pt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                            {mp.recommended_age_min}개월{mp.recommended_age_max ? `~${mp.recommended_age_max}개월` : '+'}
                          </span>
                        </div>
                      )}
                      <div className="p-3 flex flex-col flex-1">
                        {mp.brand && <p className="text-xs text-gray-400 mb-0.5 truncate">{mp.brand}</p>}
                        <Link href={`/market/${mp.id}`}>
                          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-purple-700 transition-colors mb-1">{mp.name}</p>
                        </Link>
                        <div className="flex items-center gap-1 mb-2">
                          <span className="text-sm font-black text-purple-600">{mp.price ?? '가격 문의'}</span>
                          {mp.original_price && mp.original_price !== mp.price && (
                            <span className="text-xs text-gray-300 line-through">{mp.original_price}</span>
                          )}
                        </div>
                        {mp.rating && <p className="text-xs text-gray-400 mb-2">⭐ {mp.rating} · {mp.review_count?.toLocaleString()}개</p>}
                        <button
                          onClick={() => {
                            cartStore.add({ id: mp.id, name: mp.name, brand: mp.brand, price: mp.price, original_price: mp.original_price, thumbnail_url: mp.thumbnail_url, category_main: mp.category_main, category_sub: mp.category_sub })
                            setAddedIds(prev => new Set(prev).add(mp.id))
                          }}
                          className={`mt-auto w-full py-2 rounded-xl text-xs font-bold border-2 transition-all ${added ? 'bg-green-50 text-green-600 border-green-200' : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'}`}
                        >
                          {added ? '✅ 담김' : '🛒 담기'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 카테고리 탐색 (검색 모드 아닐 때) */}
        {!isSearchMode && <>

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
        <div className="flex flex-wrap gap-2 mb-4">
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

        {/* 월령 필터 — 한 줄 */}
        <div className="flex items-center gap-2 flex-wrap mb-6 bg-white rounded-2xl border-2 border-gray-100 px-4 py-3">
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">👶 월령별 필터</span>
          <div className="w-px h-4 bg-gray-200 mx-1 hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            {myAgeMonths !== null && (
              <button
                onClick={handleToggleMyAge}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border-2 ${
                  useMyAge ? 'text-white border-transparent' : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
                style={useMyAge ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)', borderColor: 'transparent' } : {}}
              >
                ✨ 우리 아이 ({getAgeLabel(myAgeMonths)})
              </button>
            )}
            {AGE_FILTERS.map(f => (
              <button
                key={f.label}
                onClick={() => handleAgeFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border-2 ${
                  !useMyAge && selectedAge === f.value
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-gray-100 bg-white text-gray-600 hover:border-purple-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 상품 그리드 */}
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-4xl animate-pulse">🔍</div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-semibold">해당 카테고리·월령 데이터가 없어요</p>
            {isAgeFiltered && (
              <button onClick={() => { setUseMyAge(false); setSelectedAge(null); }}
                className="mt-3 text-sm text-purple-500 underline">
                월령 필터 해제하기
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center mb-4">
              <p className="text-xs text-gray-400">
                {products.length}개 표시 중
                {isAgeFiltered && (
                  <button onClick={() => { setUseMyAge(false); setSelectedAge(null); }}
                    className="ml-2 text-purple-400 underline">
                    필터 해제
                  </button>
                )}
              </p>
              {/* 정렬 드롭다운 */}
              <div className="ml-auto relative">
                <button
                  onClick={() => setSortOpen(o => !o)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-full px-3 py-1 hover:border-purple-300 hover:text-purple-600 transition-all bg-white"
                >
                  {SORT_OPTIONS.find(o => o.value === sortOrder)?.label}
                  <svg className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border-2 border-purple-100 rounded-2xl shadow-lg z-20 overflow-hidden min-w-[130px]">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortOrder(opt.value); setSortOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${
                          sortOrder === opt.value ? 'text-purple-700 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {opt.value === sortOrder && <span className="mr-1.5">✓</span>}{opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedProducts.map(mp => {
                const added = addedIds.has(mp.id)
                return (
                  <div key={mp.id} className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
                    {/* 이미지 */}
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

                    {/* 월령 뱃지 */}
                    {(mp.recommended_age_min !== null && mp.recommended_age_min !== undefined) && (
                      <div className="px-3 pt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                          {mp.recommended_age_min}개월{mp.recommended_age_max ? `~${mp.recommended_age_max}개월` : '+'}
                        </span>
                      </div>
                    )}

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
        </> /* end !isSearchMode */}
      </div>
    </div>
  )
}
