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
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 pl-2 pr-4 py-2 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 hover:shadow-2xl"
        style={{ background: '#EDE6FF', border: '2px solid #C4A8FF' }}
        aria-label="AI 상담 열기"
      >
        {/* 왼쪽 원형 헤드셋 아이콘 */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
             style={{ background: '#9333EA' }}>
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 22C9 14.82 13.925 9 20 9s11 5.82 11 13" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <rect x="5" y="20" width="7" height="10" rx="3.5" fill="white"/>
            <rect x="28" y="20" width="7" height="10" rx="3.5" fill="white"/>
            <path d="M12 30c0 4.5 3.5 7 8 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="20.5" cy="37" r="2.5" fill="white"/>
          </svg>
        </div>
        {/* 텍스트 */}
        <div className="flex flex-col items-start">
          <span className="text-sm font-bold leading-tight" style={{ color: '#4C1D95' }}>AI 상담원</span>
          <span className="text-xs leading-tight" style={{ color: '#7C3AED' }}>육아용품 Q&A</span>
        </div>
      </button>

      <ChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ageMonths={ageMonths}
      />
    </>
  )
}
