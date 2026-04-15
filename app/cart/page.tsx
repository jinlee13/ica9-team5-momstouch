'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cartStore, type CartItem } from '@/lib/cart'
import CartBadge from '@/components/CartBadge'

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(cartStore.get())
    const update = () => setItems(cartStore.get())
    window.addEventListener('cart-update', update)
    return () => window.removeEventListener('cart-update', update)
  }, [])

  const total = items.reduce((s, x) => s + x.priceNum * x.quantity, 0)
  const totalCount = items.reduce((s, x) => s + x.quantity, 0)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/home" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
            <div className="flex items-center gap-3">
              <Link href="/home" className="text-sm text-gray-500 hover:text-purple-600">← 홈</Link>
              <CartBadge />
            </div>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <div className="text-7xl">🛒</div>
          <p className="text-xl font-bold text-gray-700">장바구니가 비어있어요</p>
          <p className="text-gray-400 text-sm">제품 상세 페이지에서 마음에 드는 제품을 담아보세요</p>
          <Link href="/home"
                className="px-8 py-3 rounded-2xl text-white font-semibold text-sm"
                style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
            제품 보러가기 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</Link>
          <div className="flex items-center gap-3">
            <Link href="/home" className="text-sm text-gray-500 hover:text-purple-600">← 홈</Link>
            <CartBadge />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">🛒 장바구니 <span className="text-lg font-normal text-gray-400">({totalCount}개)</span></h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 상품 목록 */}
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border-2 border-gray-100 p-4 flex gap-4">
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl">🛍️</div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm leading-snug mb-1 line-clamp-2">{item.name}</p>
                  {item.brand && <p className="text-xs text-gray-400 mb-2">{item.brand}</p>}
                  <div className="flex items-center gap-2">
                    {item.original_price && item.original_price !== item.price && (
                      <span className="text-xs text-gray-300 line-through">{item.original_price}</span>
                    )}
                    <span className="text-sm font-bold text-purple-600">{item.price ?? '가격 미정'}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between flex-shrink-0">
                  {/* 수량 */}
                  <div className="flex items-center gap-2 border-2 border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => cartStore.update(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold">
                      −
                    </button>
                    <span className="text-sm font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => cartStore.update(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 font-bold">
                      +
                    </button>
                  </div>
                  {/* 소계 */}
                  <div className="text-right">
                    <p className="text-xs text-gray-400">소계</p>
                    <p className="text-sm font-black text-gray-800">
                      {item.priceNum > 0 ? `${(item.priceNum * item.quantity).toLocaleString()}원` : '—'}
                    </p>
                  </div>
                  {/* 삭제 */}
                  <button
                    onClick={() => cartStore.remove(item.id)}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors">
                    삭제
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={() => { if (confirm('장바구니를 비우시겠어요?')) cartStore.clear() }}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors mt-2">
              전체 비우기
            </button>
          </div>

          {/* 주문 요약 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 sticky top-24">
              <h2 className="font-bold text-gray-800 mb-4">주문 요약</h2>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>상품 금액</span>
                  <span>{total > 0 ? `${total.toLocaleString()}원` : '가격 확인 필요'}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>배송비</span>
                  <span className="text-green-600 font-semibold">무료</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-5">
                <div className="flex justify-between font-black text-gray-900">
                  <span>합계</span>
                  <span style={{ color: '#9B7EDE' }}>
                    {total > 0 ? `${total.toLocaleString()}원` : '—'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
                style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
                주문하기 →
              </button>

              <Link href="/home"
                    className="block w-full py-3 rounded-2xl text-center text-sm font-semibold text-gray-500 border-2 border-gray-100 hover:border-purple-200 mt-3 transition-colors">
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
