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
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-100 hover:border-purple-200 bg-white transition-colors text-xl"
    >
      🛒
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
