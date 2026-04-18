'use client'

import { useState, useEffect } from 'react'
import ChatModal from './ChatModal'
import { calculateAgeInMonths } from '@/lib/recommendations'

export default function ChatFloatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [ageMonths, setAgeMonths] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('ddokddok_birthdate')
    if (saved) setAgeMonths(calculateAgeInMonths(saved))
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 hover:shadow-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(145deg, #EDE6FF, #D9CCFF)', border: '2.5px solid #9B7EDE' }}
        aria-label="AI 상담 열기"
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 헤드밴드 */}
          <path d="M8 18C8 12.477 12.477 8 18 8s10 4.477 10 10" stroke="#9B7EDE" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
          {/* 왼쪽 이어컵 */}
          <rect x="5" y="17" width="5" height="8" rx="2.5" fill="#B794F6"/>
          {/* 오른쪽 이어컵 */}
          <rect x="26" y="17" width="5" height="8" rx="2.5" fill="#B794F6"/>
          {/* 마이크 암 */}
          <path d="M10 25c0 4 3 6 8 6" stroke="#9B7EDE" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          {/* 마이크 */}
          <circle cx="18.5" cy="31.5" r="2" fill="#9B7EDE"/>
        </svg>
      </button>

      <ChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ageMonths={ageMonths}
      />
    </>
  )
}
