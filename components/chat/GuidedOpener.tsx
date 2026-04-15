// components/chat/GuidedOpener.tsx
'use client'

interface Props {
  ageMonths: number
  onSelect: (text: string) => void
}

export default function GuidedOpener({ ageMonths, onSelect }: Props) {
  const questions = [
    `${ageMonths}개월 아이에게 지금 꼭 필요한 것 알려줘`,
    '이유식 준비 뭐가 필요해?',
    '수면 환경 어떻게 만들어줘야 해?',
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4"
           style={{ backgroundColor: '#F3EEFF' }}>
        🤱
      </div>
      <p className="text-base font-semibold text-gray-800 mb-1">무엇이 궁금하세요?</p>
      <p className="text-xs text-gray-400 mb-5">질문을 선택하거나 직접 입력하세요</p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
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
