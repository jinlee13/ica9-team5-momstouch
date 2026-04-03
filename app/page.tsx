'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [birthdate, setBirthdate] = useState('')
  const [step, setStep] = useState<'intro' | 'input'>('intro')
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('ddokddok_birthdate')
    if (saved) router.push('/home')
  }, [router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!birthdate) {
      setError('생년월일을 입력해주세요.')
      return
    }
    const birth = new Date(birthdate)
    const now = new Date()
    if (birth > now) {
      setError('출생일이 오늘보다 미래일 수 없어요.')
      return
    }
    const maxAge = new Date()
    maxAge.setFullYear(maxAge.getFullYear() - 4)
    if (birth < maxAge) {
      setError('이 서비스는 0~36개월 아이를 위한 서비스예요.')
      return
    }
    localStorage.setItem('ddokddok_birthdate', birthdate)
    router.push('/home')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8"
           style={{ background: 'linear-gradient(to bottom right, rgba(155,126,222,0.08), rgba(183,148,246,0.08))' }}>

        {step === 'intro' ? (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="text-6xl mb-4">👶</div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                 style={{ backgroundColor: 'rgba(155,126,222,0.12)', color: '#9B7EDE' }}>
              ✨ 발달 이론 기반 맞춤 추천
            </div>
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              똑똑한 엄마
            </h1>
            <p className="text-gray-500 text-base leading-relaxed max-w-xs mx-auto">
              아이 생년월일만 입력하면<br/>
              <strong className="text-gray-700">지금 딱 필요한 육아용품</strong>을<br/>
              바로 알려드려요
            </p>

            <div className="grid grid-cols-2 gap-3 text-left mt-4">
              {[
                { icon: '🎯', title: '지금/곧/아직', desc: '타이밍별 추천' },
                { icon: '📚', title: '발달 근거', desc: 'WHO·AAP 기반' },
                { icon: '✅', title: '체크리스트', desc: '구매 관리' },
                { icon: '💜', title: '인플루언서 검증', desc: '실검증 데이터' },
              ].map((item) => (
                <div key={item.title}
                     className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="font-semibold text-sm text-gray-800">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('input')}
              className="w-full py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
              시작하기
            </button>

            <p className="text-xs text-gray-400">생년월일은 기기에만 저장됩니다 🔒</p>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-6">
            <button onClick={() => setStep('intro')} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
              ← 돌아가기
            </button>

            <div className="text-center">
              <div className="text-4xl mb-3">🗓️</div>
              <h2 className="text-2xl font-bold text-gray-900">아이 생년월일을 알려주세요</h2>
              <p className="text-gray-500 text-sm mt-2">개월 수에 맞는 추천을 계산해요</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  생년월일
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => { setBirthdate(e.target.value); setError('') }}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-base transition-colors"
                  style={{ fontFamily: 'inherit' }}
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-full text-white font-semibold text-lg shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
                추천 받기 →
              </button>
            </form>

            <p className="text-center text-xs text-gray-400">
              개인정보 보호 안내: 생년월일은 이 기기에만 저장되며<br/>
              서버로 전송되지 않습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
