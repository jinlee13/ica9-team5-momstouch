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
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: '#9B7EDE' }}
        aria-label="AI 상담 열기"
      >
        🤱
      </button>

      <ChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ageMonths={ageMonths}
      />
    </>
  )
}
