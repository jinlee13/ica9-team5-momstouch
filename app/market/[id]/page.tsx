'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchMarketProductById, type MarketProduct } from '@/lib/supabase-queries'
import { cartStore } from '@/lib/cart'
import CartBadge from '@/components/CartBadge'

export default function MarketProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState<MarketProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImg, setSelectedImg] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const birthdate = localStorage.getItem('ddokddok_birthdate')
    if (!birthdate) { router.push('/'); return }
    fetchMarketProductById(Number(params.id)).then((p) => {
      setProduct(p)
      setLoading(false)
    })
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-4xl animate-pulse">🛍️</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-5xl">😕</div>
        <p className="text-gray-500 font-semibold">제품을 찾을 수 없어요</p>
        <button onClick={() => router.back()}
                className="text-sm text-purple-600 hover:underline">← 돌아가기</button>
      </div>
    )
  }

  // 이미지 목록: detail_images 우선, 없으면 thumbnail_url
  const images: string[] = []
  if (product.detail_images && product.detail_images.length > 0) {
    images.push(...product.detail_images)
  } else if (product.thumbnail_url) {
    images.push(product.thumbnail_url)
  }

  const mainImage = images[selectedImg] ?? product.thumbnail_url ?? ''
  const hasDiscount = product.original_price && product.original_price !== product.price

  function handleAddCart() {
    cartStore.add({
      id: product!.id,
      name: product!.name,
      brand: product!.brand,
      price: product!.price,
      original_price: product!.original_price,
      thumbnail_url: product!.thumbnail_url,
      category_main: product!.category_main,
      category_sub: product!.category_sub,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const SOURCE_LABEL: Record<string, string> = {
    boribori: '보리보리', coochi: '쿠치', doubleheart: '더블하트',
    swaddleup: '스와들업', stokke: '스토케', bamboobebe: '밤부베베',
    motherkmall: '마더케이', naver_shopping: '네이버쇼핑',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-purple-600">
              ← 뒤로
            </button>
            <CartBadge />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="grid md:grid-cols-2 gap-8">

          {/* 왼쪽: 이미지 갤러리 */}
          <div>
            {/* 메인 이미지 */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden mb-3 aspect-square flex items-center justify-center">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.src = ''
                    el.parentElement!.innerHTML = '<div class="text-6xl">🛍️</div>'
                  }}
                />
              ) : (
                <div className="text-7xl">🛍️</div>
              )}
            </div>

            {/* 썸네일 스트립 */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(0, 10).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                      selectedImg === i ? 'border-purple-400 shadow-md' : 'border-gray-100 hover:border-purple-200'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 제품 정보 */}
          <div className="flex flex-col gap-4">

            {/* 헤더 */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
              {/* 카테고리 브레드크럼 */}
              <p className="text-xs text-gray-400 mb-2">
                {[product.category_main, product.category_mid, product.category_sub]
                  .filter(Boolean).join(' › ')}
              </p>

              <h1 className="text-xl font-black text-gray-900 leading-snug mb-2">{product.name}</h1>

              {product.brand && (
                <p className="text-sm text-gray-500 mb-4">브랜드: <strong className="text-gray-700">{product.brand}</strong></p>
              )}

              {/* 가격 */}
              <div className="mb-4">
                {hasDiscount && (
                  <p className="text-sm text-gray-400 line-through">{product.original_price}</p>
                )}
                <p className="text-3xl font-black" style={{ color: '#9B7EDE' }}>
                  {product.price ?? '가격 문의'}
                </p>
                {hasDiscount && (
                  <span className="inline-block mt-1 text-xs font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                    할인중
                  </span>
                )}
              </div>

              {/* 평점 */}
              {(product.rating || product.review_count) && (
                <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
                  {product.rating && <span>⭐ {product.rating}</span>}
                  {product.review_count && product.review_count > 0 && (
                    <span className="text-gray-400">리뷰 {product.review_count.toLocaleString()}개</span>
                  )}
                </div>
              )}

              {/* 장바구니 버튼 */}
              <button
                onClick={handleAddCart}
                className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all"
                style={{
                  background: added
                    ? 'linear-gradient(to right, #10b981, #34d399)'
                    : 'linear-gradient(to right, #9B7EDE, #B794F6)'
                }}
              >
                {added ? '✅ 장바구니에 담겼어요!' : '🛒 장바구니에 담기'}
              </button>

              <Link
                href="/cart"
                className="block w-full py-3 mt-2 rounded-2xl text-center text-sm font-semibold text-gray-500 border-2 border-gray-100 hover:border-purple-200 transition-colors"
              >
                장바구니 보기 →
              </Link>
            </div>

            {/* 상세 정보 */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
              <h2 className="font-bold text-gray-800 mb-3 text-sm">상품 정보</h2>
              <div className="space-y-2.5 text-sm">
                {product.age_recommendation && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-20 flex-shrink-0">권장 연령</span>
                    <span className="text-gray-700 font-medium">{product.age_recommendation}</span>
                  </div>
                )}
                {product.source_site && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-20 flex-shrink-0">판매처</span>
                    <span className="text-gray-700 font-medium">
                      {SOURCE_LABEL[product.source_site] ?? product.source_site}
                    </span>
                  </div>
                )}
                {product.category_sub && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-20 flex-shrink-0">카테고리</span>
                    <span className="text-gray-700 font-medium">{product.category_sub}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 상세 이미지 전체 표시 (스크롤) */}
        {images.length > 1 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">상세 이미지</h2>
            <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden p-4 space-y-3">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`상세 이미지 ${i + 1}`}
                  className="w-full rounded-xl"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-16 bg-white border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <Link href="/home" className="font-bold text-purple-500">똑똑한 엄마</Link>
          <p>이 정보는 참고용이며 의료적 조언이 아닙니다.</p>
        </div>
      </footer>
    </div>
  )
}
