'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { cartStore } from '@/lib/cart'

export default function CartBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(cartStore.count())
    const update = () => setCount(cartStore.count())
    window.addEventListener('cart-update', update)
    return () => window.removeEventListener('cart-update', update)
  }, [])

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-gray-200 text-gray-700 text-sm font-semibold shadow-sm hover:border-purple-300 hover:text-purple-600 transition-all"
    >
      🛒 <span className="hidden sm:inline">장바구니</span>
      {count > 0 && (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black leading-none text-white" style={{ background: '#9B7EDE' }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
