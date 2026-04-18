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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" opacity="0.3"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
            <path d="M12 8v1M12 15v1M8 12H7M17 12h-1M9.17 9.17l-.71-.71M15.54 15.54l-.71-.71M9.17 14.83l-.71.71M15.54 8.46l-.71.71" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
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
