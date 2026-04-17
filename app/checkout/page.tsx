'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cartStore, type CartItem } from '@/lib/cart'

type Step = 'form' | 'done'

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [step, setStep] = useState<Step>('form')
  const [orderNum, setOrderNum] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    addressDetail: '',
    payment: 'card',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const cart = cartStore.get()
    if (cart.length === 0) { router.replace('/cart'); return }
    setItems(cart)
  }, [router])

  const total = items.reduce((s, x) => s + x.priceNum * x.quantity, 0)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '이름을 입력해주세요'
    if (!form.phone.trim()) e.phone = '연락처를 입력해주세요'
    if (!form.address.trim()) e.address = '배송지를 입력해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const num = 'DDK-' + Date.now().toString().slice(-8)
    setOrderNum(num)
    cartStore.clear()
    setStep('done')
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-6">
        <div className="bg-white rounded-3xl p-10 text-center max-w-md w-full shadow-lg border-2 border-purple-100">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">주문 완료!</h1>
          <p className="text-gray-500 text-sm mb-6">주문이 성공적으로 접수되었어요</p>
          <div className="bg-purple-50 rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs text-gray-400 font-semibold mb-1">주문번호</p>
            <p className="font-black text-purple-700 text-lg">{orderNum}</p>
            <p className="text-xs text-gray-400 mt-3 font-semibold">배송지</p>
            <p className="text-sm text-gray-700">{form.address} {form.addressDetail}</p>
            <p className="text-xs text-gray-400 mt-3 font-semibold">결제 방법</p>
            <p className="text-sm text-gray-700">
              {form.payment === 'card' ? '신용/체크카드' : form.payment === 'transfer' ? '계좌이체' : '간편결제'}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-700 leading-relaxed">
            📦 주문 확인 후 1~3일 내 발송 예정이며, 문자로 배송 안내를 드립니다.
          </div>
          <Link href="/home"
                className="block w-full py-3.5 rounded-2xl text-white font-bold text-sm text-center"
                style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
            홈으로 돌아가기
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
          <Link href="/cart" className="text-sm text-gray-500 hover:text-purple-600">← 장바구니</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">주문 / 결제</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-6">

            {/* 왼쪽: 배송 정보 + 결제 수단 */}
            <div className="md:col-span-2 space-y-5">

              {/* 배송 정보 */}
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
                <h2 className="font-bold text-gray-800 mb-5">📦 배송 정보</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">받는 분 *</label>
                    <input
                      value={form.name}
                      onChange={set('name')}
                      placeholder="이름을 입력해주세요"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition-colors ${errors.name ? 'border-red-300' : 'border-gray-100'}`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">연락처 *</label>
                    <input
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="010-0000-0000"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition-colors ${errors.phone ? 'border-red-300' : 'border-gray-100'}`}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">배송지 *</label>
                    <input
                      value={form.address}
                      onChange={set('address')}
                      placeholder="주소 (도로명/지번 주소)"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition-colors mb-2 ${errors.address ? 'border-red-300' : 'border-gray-100'}`}
                    />
                    <input
                      value={form.addressDetail}
                      onChange={set('addressDetail')}
                      placeholder="상세 주소 (동/호수 등)"
                      className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 transition-colors"
                    />
                    {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                  </div>
                </div>
              </div>

              {/* 결제 수단 */}
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
                <h2 className="font-bold text-gray-800 mb-5">💳 결제 수단</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'card', icon: '💳', label: '신용/체크카드' },
                    { key: 'transfer', icon: '🏦', label: '계좌이체' },
                    { key: 'kakaopay', icon: '💛', label: '카카오페이' },
                  ].map((m) => (
                    <label
                      key={m.key}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        form.payment === m.key
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-gray-100 hover:border-purple-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.key}
                        checked={form.payment === m.key}
                        onChange={set('payment')}
                        className="sr-only"
                      />
                      <span className="text-2xl">{m.icon}</span>
                      <span className="text-xs font-semibold text-gray-700 text-center">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* 오른쪽: 주문 상품 + 합계 */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl border-2 border-purple-100 p-6 sticky top-24">
                <h2 className="font-bold text-gray-800 mb-4">주문 상품 ({items.length})</h2>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      {item.thumbnail_url && (
                        <img src={item.thumbnail_url} alt={item.name}
                             className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                             onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.quantity}개 · {item.price ?? '가격 미정'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 text-sm mb-5">
                  <div className="flex justify-between text-gray-600">
                    <span>상품 금액</span>
                    <span>{total > 0 ? `${total.toLocaleString()}원` : '—'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>배송비</span>
                    <span className="text-green-600 font-semibold">무료</span>
                  </div>
                  <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100">
                    <span>최종 결제</span>
                    <span style={{ color: '#9B7EDE' }}>
                      {total > 0 ? `${total.toLocaleString()}원` : '—'}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
                  결제하기 →
                </button>

                <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
                  주문 시 이용약관 및 개인정보처리방침에 동의하는 것으로 간주합니다
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
