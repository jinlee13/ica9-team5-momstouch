export interface CartItem {
  id: number
  name: string
  brand: string | null
  price: string | null
  original_price: string | null
  thumbnail_url: string | null
  category_main: string | null
  category_sub: string | null
  quantity: number
  priceNum: number
}

function toNum(price: string | null): number {
  if (!price) return 0
  return parseInt(price.replace(/[^0-9]/g, '')) || 0
}

const KEY = 'ddokddok_cart'

function load(): CartItem[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-update'))
}

export const cartStore = {
  get: load,

  add(product: Omit<CartItem, 'quantity' | 'priceNum'>) {
    const items = load()
    const idx = items.findIndex(x => x.id === product.id)
    if (idx >= 0) items[idx].quantity += 1
    else items.push({ ...product, quantity: 1, priceNum: toNum(product.price) })
    save(items)
  },

  remove(id: number) {
    save(load().filter(x => x.id !== id))
  },

  update(id: number, qty: number) {
    if (qty <= 0) { this.remove(id); return }
    save(load().map(x => x.id === id ? { ...x, quantity: qty } : x))
  },

  clear() {
    localStorage.removeItem(KEY)
    window.dispatchEvent(new Event('cart-update'))
  },

  count: () => load().reduce((s, x) => s + x.quantity, 0),
  total: () => load().reduce((s, x) => s + x.priceNum * x.quantity, 0),
}
