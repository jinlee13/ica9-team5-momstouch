'use client'

import { useState } from 'react'

type Step = 'main' | 'recommend' | 'cs'

interface Props {
  ageMonths: number
  onSelect: (text: string) => void
}

export default function GuidedOpener({ ageMonths, onSelect }: Props) {
  const [step, setStep] = useState<Step>('main')

  if (step === 'main') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
             style={{ backgroundColor: '#F3EEFF' }}>
          🤱
        </div>
        <p className="text-base font-semibold text-gray-800 mb-1">무엇을 도와드릴까요?</p>
        <p className="text-xs text-gray-400 mb-6">아래 메뉴를 선택해주세요</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setStep('recommend')}
            className="flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-sm font-semibold text-gray-700 bg-white transition-all hover:border-purple-300 hover:bg-purple-50"
            style={{ borderColor: '#E9E0FF' }}
          >
            <span className="text-xl">🛍️</span>
            <span>월령별 필수템 추천</span>
          </button>
          <button
            onClick={() => setStep('cs')}
            className="flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-sm font-semibold text-gray-700 bg-white transition-all hover:border-purple-300 hover:bg-purple-50"
            style={{ borderColor: '#E9E0FF' }}
          >
            <span className="text-xl">📦</span>
            <span>CS / 배송 · 반품 · 교환</span>
          </button>
        </div>
      </div>
    )
  }

  const isRecommend = step === 'recommend'
  const title = isRecommend ? '🛍️ 월령별 필수템 추천' : '📦 CS / 배송 · 반품 · 교환'
  const questions = isRecommend
    ? [
        `${ageMonths}개월 아이 필수템 알려줘`,
        '이유식 준비 뭐가 필요해?',
        '수면 제품 추천해줘',
      ]
    : [
        '현재 배송 현황 확인해줘',
        '교환 방법을 알려줘',
        '반품 방법을 알려줘',
      ]

  return (
    <div className="flex flex-col px-4 py-4">
      <button
        onClick={() => setStep('main')}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-4 self-start transition-colors"
      >
        ← 뒤로
      </button>
      <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-sm text-left px-4 py-3 rounded-xl border-2 transition-all hover:border-purple-300 hover:bg-purple-50 text-gray-700 bg-white"
            style={{ borderColor: '#E9E0FF' }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
