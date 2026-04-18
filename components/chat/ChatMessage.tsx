'use client'

import type { ContextProduct } from '@/lib/chat'

const CATEGORY_ICON: Record<string, string> = {
  '수면': '🛏️',
  '위생': '🧴',
  '수유': '🍼',
  '이유식': '🥣',
  '놀이': '🧸',
  '교구': '🎨',
  '외출': '🚗',
  '안전': '🛡️',
  '의류': '👕',
}

const NECESSITY_BADGE: Record<string, { label: string; color: string }> = {
  ESSENTIAL:    { label: '필수',       color: 'bg-purple-100 text-purple-700' },
  SITUATIONAL:  { label: '상황따라',   color: 'bg-blue-100 text-blue-700' },
  OPTIONAL:     { label: '선택',       color: 'bg-gray-100 text-gray-600' },
  RENT_OR_USED: { label: '중고·대여',  color: 'bg-orange-100 text-orange-700' },
}

interface Props {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  products?: ContextProduct[]
}

export default function ChatMessage({ role, content, isStreaming, products }: Props) {
  const isUser = role === 'user'

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const formatted = escapeHtml(content).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-4`}>
      {/* 말풍선 */}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
        {!isUser && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
               style={{ backgroundColor: '#9B7EDE', color: 'white' }}>
            AI
          </div>
        )}
        <div
          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'text-white rounded-br-sm'
              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
          }`}
          style={isUser ? { backgroundColor: '#9B7EDE' } : {}}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
        {isStreaming && (
          <span className="ml-2 mt-3 flex gap-1 items-center">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>

      {/* 제품 카드 (AI 응답에만, 스트리밍 완료 후) */}
      {!isUser && !isStreaming && products && products.length > 0 && (
        <div className="mt-2 ml-9 w-full max-w-[calc(75%+2.25rem)] flex flex-col gap-2">
          {products.map((p) => {
            const badge = NECESSITY_BADGE[p.necessity] ?? { label: p.necessity, color: 'bg-gray-100 text-gray-600' }
            const icon = CATEGORY_ICON[p.category_name] ?? '📦'
            return (
              <div
                key={p.name}
                className="rounded-xl border bg-white shadow-sm overflow-hidden"
                style={{ borderColor: '#E9E0FF' }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.age_min_months}~{p.age_max_months}개월
                      {p.price_range ? ` · ${p.price_range}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="border-t grid grid-cols-2 divide-x" style={{ borderColor: '#F3EEFF' }}>
                  <a
                    href={`/browse?q=${encodeURIComponent(p.name)}`}
                    className="text-xs text-center py-2 text-purple-600 hover:bg-purple-50 transition-colors font-medium"
                  >
                    🔍 상품 보기
                  </a>
                  <button
                    className="text-xs text-center py-2 text-purple-600 hover:bg-purple-50 transition-colors font-medium"
                    onClick={() => {
                      alert(`${p.name} — 장바구니 기능 준비 중이에요!`)
                    }}
                  >
                    🛒 장바구니 담기
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
