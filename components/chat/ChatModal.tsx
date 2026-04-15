// components/chat/ChatModal.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ChatMessage from './ChatMessage'
import GuidedOpener from './GuidedOpener'
import {
  type ChatMessage as ChatMsg,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  getApiMessages,
} from '@/lib/chat'

interface Props {
  isOpen: boolean
  onClose: () => void
  ageMonths: number
}

export default function ChatModal({ isOpen, onClose, ageMonths }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 모달 열릴 때 히스토리 로드
  useEffect(() => {
    if (isOpen) {
      setMessages(loadChatHistory())
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // 새 메시지마다 스크롤 하단 이동
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMsg = { role: 'user', content: text.trim(), timestamp: Date.now() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    saveChatHistory(nextMessages)
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: getApiMessages(nextMessages),
          ageMonths,
        }),
      })

      if (!res.ok) throw new Error('API 오류')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setStreamingContent(accumulated)
        }
      }

      const assistantMsg: ChatMsg = {
        role: 'assistant',
        content: accumulated,
        timestamp: Date.now(),
      }
      const finalMessages = [...nextMessages, assistantMsg]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)
    } catch {
      const errMsg: ChatMsg = {
        role: 'assistant',
        content: '죄송합니다, 잠시 오류가 발생했어요. 다시 시도해주세요.',
        timestamp: Date.now(),
      }
      const finalMessages = [...nextMessages, errMsg]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)
    } finally {
      setIsLoading(false)
      setStreamingContent('')
    }
  }, [messages, isLoading, ageMonths])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleClear = () => {
    clearChatHistory()
    setMessages([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 pointer-events-none">
      {/* 배경 오버레이 (모바일에서 클릭 닫기) */}
      <div
        className="absolute inset-0 bg-black/20 pointer-events-auto sm:hidden"
        onClick={onClose}
      />

      {/* 채팅창 */}
      <div className="relative w-full sm:w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden border border-gray-100">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
             style={{ backgroundColor: '#9B7EDE' }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">🤱</span>
            <div>
              <p className="text-white font-semibold text-sm">똑똑이 AI</p>
              <p className="text-purple-200 text-xs">{ageMonths}개월 아이 맞춤 상담</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="text-purple-200 hover:text-white text-xs px-2 py-1 rounded transition-colors"
              >
                초기화
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50">
          {messages.length === 0 && !isLoading ? (
            <GuidedOpener ageMonths={ageMonths} onSelect={sendMessage} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && streamingContent && (
                <ChatMessage role="assistant" content={streamingContent} isStreaming />
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1"
                       style={{ backgroundColor: '#9B7EDE', color: 'white' }}>AI</div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* 입력창 */}
        <div className="px-3 py-3 border-t border-gray-100 bg-white flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="궁금한 것을 물어보세요..."
            disabled={isLoading}
            className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-300 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
            style={{ backgroundColor: '#9B7EDE' }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
