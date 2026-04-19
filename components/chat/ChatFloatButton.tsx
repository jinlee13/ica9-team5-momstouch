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
        style={{ background: '#F3EEFF', border: '3px solid #3B5BDB' }}
        aria-label="AI 상담 열기"
      >
        <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 헤드밴드 */}
          <path d="M9 22C9 14.82 13.925 9 20 9s11 5.82 11 13" stroke="#9333EA" strokeWidth="3" strokeLinecap="round" fill="none"/>
          {/* 왼쪽 이어컵 */}
          <rect x="5" y="20" width="7" height="10" rx="3.5" fill="#9333EA"/>
          {/* 오른쪽 이어컵 */}
          <rect x="28" y="20" width="7" height="10" rx="3.5" fill="#9333EA"/>
          {/* 마이크 암 */}
          <path d="M12 30c0 4.5 3.5 7 8 7" stroke="#9333EA" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          {/* 마이크 */}
          <circle cx="20.5" cy="37" r="2.5" fill="#9333EA"/>
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
