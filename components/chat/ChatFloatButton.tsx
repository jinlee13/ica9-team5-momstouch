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
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white transition-all hover:scale-105 active:scale-95 hover:shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #9B7EDE, #B794F6)' }}
        aria-label="AI 상담 열기"
      >
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 22C9 14.82 13.925 9 20 9s11 5.82 11 13" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
            <rect x="5" y="20" width="7" height="10" rx="3.5" fill="white"/>
            <rect x="28" y="20" width="7" height="10" rx="3.5" fill="white"/>
            <path d="M12 30c0 4.5 3.5 7 8 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="20.5" cy="37" r="2.5" fill="white"/>
          </svg>
        </div>
        <div className="text-left">
          <p className="text-xs font-bold leading-tight">AI 상담원</p>
          <p className="text-purple-100 text-xs leading-tight">육아용품 Q&A</p>
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
