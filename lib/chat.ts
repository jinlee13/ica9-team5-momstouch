// lib/chat.ts
export interface ContextProduct {
  name: string
  category_name: string
  necessity: string
  price_range: string | null
  age_min_months: number
  age_max_months: number
  reason: string | null
  image_url?: string | null
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  products?: ContextProduct[]
}

export interface ChatHistory {
  messages: ChatMessage[]
  lastUpdated: number
}

const STORAGE_KEY = 'ddokddok_chat'
const MAX_HISTORY = 20  // 로컬 저장 최대 개수
const MAX_API_TURNS = 10 // API 전송 최대 턴 수 (토큰 절약)

export function loadChatHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const history: ChatHistory = JSON.parse(raw)
    // products는 캐시 버전 불일치 방지를 위해 로드 시 제거 (응답 시 재계산됨)
    return (history.messages ?? []).map(({ products: _p, ...msg }) => msg)
  } catch {
    return []
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  const history: ChatHistory = {
    messages: messages.slice(-MAX_HISTORY),
    lastUpdated: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function clearChatHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/** API 요청용: 최근 N턴만 추출 */
export function getApiMessages(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .slice(-MAX_API_TURNS)
    .map(({ role, content }) => ({ role, content }))
}
