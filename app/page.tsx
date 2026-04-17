'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ChatModal from '@/components/chat/ChatModal'

export default function LandingPage() {
  const router = useRouter()
  const [birthdate, setBirthdate] = useState('')
  const [error, setError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [hasSavedBirthdate, setHasSavedBirthdate] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('ddokddok_birthdate')
    if (saved) setHasSavedBirthdate(true)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!birthdate) { setError('생년월일을 입력해주세요.'); return }
    const birth = new Date(birthdate)
    const now = new Date()
    if (birth > now) { setError('출생일이 오늘보다 미래일 수 없어요.'); return }
    localStorage.setItem('ddokddok_birthdate', birthdate)
    router.push('/home')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* GNB */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold" style={{ color: '#9B7EDE' }}>똑똑한 엄마</span>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#how" className="hover:text-purple-600 transition-colors">서비스 소개</a>
            <a href="#categories" className="hover:text-purple-600 transition-colors">카테고리</a>
            <a href="#theory" className="hover:text-purple-600 transition-colors">발달 이론</a>
          </div>
          {hasSavedBirthdate ? (
            <Link href="/home"
                  className="text-sm font-semibold px-5 py-2 rounded-full text-white transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
              마이페이지 →
            </Link>
          ) : (
            <Link href="/home"
                  className="text-sm font-semibold px-5 py-2 rounded-full text-white transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
              추천 받기
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, rgba(155,126,222,0.06) 0%, rgba(183,148,246,0.08) 50%, rgba(196,181,253,0.12) 100%)' }}>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                   style={{ backgroundColor: 'rgba(155,126,222,0.12)', color: '#9B7EDE' }}>
                ✨ WHO·AAP·K-DST 발달 이론 기반
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                지금 우리 아이에게<br/>
                <span style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  딱 필요한 것만
                </span>
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-md">
                아이 생년월일 하나로 발달 단계에 맞는 육아용품을 즉시 추천해드려요.
                수십 개의 SNS와 카페를 돌아다닐 필요 없어요.
              </p>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <div className="flex-1">
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => { setBirthdate(e.target.value); setError('') }}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-base bg-white shadow-sm"
                    placeholder="아이 생년월일"
                  />
                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <button type="submit"
                        className="px-7 py-3.5 rounded-2xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 whitespace-nowrap"
                        style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
                  추천 받기 →
                </button>
              </form>
              <p className="text-xs text-gray-400">🔒 생년월일은 이 기기에만 저장됩니다. 서버로 전송되지 않아요.</p>

              {/* AI 챗봇 배너 */}
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white text-left transition-all hover:opacity-90 active:scale-[0.99] shadow-md w-full max-w-md"
                style={{ background: 'linear-gradient(135deg, #9B7EDE, #B794F6)' }}
              >
                <span className="text-xl flex-shrink-0">🤱</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">AI에게 먼저 물어보세요</p>
                  <p className="text-purple-100 text-xs">육아용품 추천 · Q&A · 제품 비교</p>
                </div>
                <span className="text-purple-200 flex-shrink-0">→</span>
              </button>
              <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} ageMonths={0} />

              {/* Stats */}
              <div className="flex gap-6 md:gap-8 pt-2">
                {[
                  { num: '72개', desc: '추천 아이템' },
                  { num: '6단계', desc: '발달 구간' },
                  { num: '8가지', desc: '이론 근거' },
                ].map((s) => (
                  <div key={s.desc}>
                    <div className="text-xl md:text-2xl font-bold" style={{ color: '#9B7EDE' }}>{s.num}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Preview Card */}
            <div className="hidden md:block relative">
              <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl"
                   style={{ background: 'linear-gradient(135deg, #9B7EDE, #B794F6)' }} />
              <div className="relative bg-white rounded-3xl shadow-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                       style={{ background: 'linear-gradient(135deg, #9B7EDE, #B794F6)' }}>
                    👶
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">우리 아이</p>
                    <p className="font-bold text-gray-800">7개월이에요</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full font-semibold bg-purple-100 text-purple-700">🔥 지금 필요</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: '🛏️', name: '다기능 유아 식탁의자 (하이체어)', badge: '필수', price: '15~40만원', ddok: 'D·T' },
                    { icon: '🍼', name: '이유식 마스터기 (찌기+갈기)', badge: '필수', price: '5~20만원', ddok: 'T' },
                    { icon: '🚗', name: '안전문 (계단·주방 차단)', badge: '필수', price: '5~15만원', ddok: 'D·T' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-purple-50 transition-colors">
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.price}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{item.badge}</span>
                        <span className="text-xs text-purple-400 font-bold">{item.ddok}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>이번 달 필수템 완료율</span>
                    <span className="font-bold text-purple-600">2/6</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full w-1/3"
                         style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">어떻게 사용하나요?</h2>
            <p className="text-gray-500 text-lg">30초 안에 우리 아이 맞춤 추천을 받아보세요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
            {[
              { step: '01', icon: '🗓️', title: '생년월일 입력', desc: '아이 생년월일만 입력하면 개월 수를 자동으로 계산해요. 회원가입 없이 바로 시작!' },
              { step: '02', icon: '🎯', title: '맞춤 추천 확인', desc: '지금 필요 / 곧 필요 / 아직 이른 것으로 나눠 타이밍에 맞는 추천을 보여줘요.' },
              { step: '03', icon: '✅', title: '구매 & 체크', desc: '체크리스트로 구매 현황을 관리하세요. 완료·보류·생략으로 구매 상태를 기록할 수 있어요.' },
            ].map((item) => (
              <div key={item.step} className="relative p-6 md:p-8 rounded-3xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 group">
                <div className="absolute top-6 right-6 text-5xl font-black text-gray-50 group-hover:text-purple-50 transition-colors select-none">{item.step}</div>
                <div className="text-4xl mb-5">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20"
               style={{ background: 'linear-gradient(to bottom right, rgba(155,126,222,0.04), rgba(196,181,253,0.06))' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">4가지 카테고리</h2>
            <p className="text-gray-500 text-lg">발달 단계별로 필요한 모든 것을 담았어요</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: '🛏️', name: '자기·위생', items: '수면, 위생, 목욕', color: 'from-indigo-50 to-indigo-100', badge: 'border-indigo-200' },
              { icon: '🍼', name: '먹기', items: '수유, 이유식, 식기', color: 'from-yellow-50 to-amber-100', badge: 'border-yellow-200' },
              { icon: '🧸', name: '놀기·배우기', items: '발달교구, 놀이완구', color: 'from-pink-50 to-pink-100', badge: 'border-pink-200' },
              { icon: '🚗', name: '외출·안전', items: '외출용품, 안전용품', color: 'from-green-50 to-emerald-100', badge: 'border-green-200' },
            ].map((cat) => (
              <div key={cat.name}
                   className={`p-5 md:p-7 rounded-3xl bg-gradient-to-br ${cat.color} border-2 ${cat.badge} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative`}>
                <div className="text-5xl mb-4">{cat.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-gray-500">{cat.items}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DDOK Theory */}
      <section id="theory" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
                   style={{ backgroundColor: 'rgba(155,126,222,0.12)', color: '#9B7EDE' }}>
                🧠 DDOK 발달 나침반
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
                "왜 지금 이게 필요한가?"를<br/>발달 이론으로 설명해요
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                WHO·AAP·K-DST·피아제·볼비·비고츠키·에릭슨·브론펜브레너 8가지 발달 이론을 통합한
                우리 서비스만의 자체 발달 모델 <strong>DDOK 발달 나침반</strong>으로 모든 추천에 이론적 근거를 제공해요.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'D', label: 'Doing · 몸으로 하기', desc: '대근육·소근육·자조 능력', color: 'bg-orange-50 border-orange-200 text-orange-700' },
                  { key: 'O', label: 'Opening · 세상 열기', desc: '언어·인지·탐색', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                  { key: 'K', label: 'Knowing · 나를 알기', desc: '자아·감정·사회성', color: 'bg-pink-50 border-pink-200 text-pink-700' },
                  { key: 'T', label: 'Timing · 지금 이 순간', desc: '건강검진·안전·환경', color: 'bg-green-50 border-green-200 text-green-700' },
                ].map((pillar) => (
                  <div key={pillar.key} className={`p-4 rounded-2xl border-2 ${pillar.color}`}>
                    <div className="text-2xl font-black mb-1 opacity-60">{pillar.key}</div>
                    <div className="text-sm font-bold">{pillar.label}</div>
                    <div className="text-xs opacity-70 mt-1">{pillar.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { stage: '0~3개월', subtitle: '감각 깨어남의 시기', theory: '피아제 감각운동기 1단계 · 볼비 전애착', items: ['모빌 (흑백/컬러)', '속싸개 / 스와들업', '신생아 카시트'] },
                { stage: '6~12개월', subtitle: '탐색과 애착이 충돌하는 시기', theory: '피아제 대상영속성 · 볼비 명확한 애착', items: ['다기능 유아 식탁의자', '안전문', '소프트 블록'] },
                { stage: '24~36개월', subtitle: '자아 주장·사회성의 시기', theory: '피아제 전조작기 · 에릭슨 자율성', items: ['블록 장난감', '역할놀이 세트', '킥보드'] },
              ].map((stage) => (
                <div key={stage.stage} className="p-5 rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-bold px-3 py-1 rounded-full text-white"
                          style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
                      {stage.stage}
                    </span>
                    <span className="text-sm text-gray-500">{stage.subtitle}</span>
                  </div>
                  <p className="text-xs text-purple-500 font-medium mb-2">📚 {stage.theory}</p>
                  <div className="flex flex-wrap gap-2">
                    {stage.items.map((item) => (
                      <span key={item} className="text-xs px-2 py-1 bg-gray-50 rounded-lg text-gray-600">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20"
               style={{ background: 'linear-gradient(135deg, #9B7EDE 0%, #B794F6 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            지금 우리 아이 개월 수를 입력해보세요
          </h2>
          <p className="text-purple-100 text-lg mb-10">30초 안에 맞춤 추천 목록을 확인할 수 있어요</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="date"
              value={birthdate}
              onChange={(e) => { setBirthdate(e.target.value); setError('') }}
              max={new Date().toISOString().split('T')[0]}
              className="flex-1 px-5 py-4 rounded-2xl border-0 focus:outline-none text-base bg-white/20 text-white placeholder-white/60 focus:bg-white/30"
            />
            <button type="submit"
                    className="px-8 py-4 rounded-2xl bg-white font-bold text-base hover:bg-gray-50 transition-all hover:shadow-xl hover:-translate-y-0.5"
                    style={{ color: '#9B7EDE' }}>
              추천 받기 →
            </button>
          </form>
          {error && <p className="text-pink-200 text-sm mt-3">{error}</p>}
          <p className="text-purple-200 text-xs mt-4">🔒 생년월일은 이 기기에만 저장됩니다</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-white font-bold text-lg">똑똑한 엄마</span>
            <p className="text-xs mt-1">아이 발달 단계에 맞는 육아용품 추천 서비스</p>
          </div>
          <p className="text-xs text-center md:text-right">
            이 정보는 참고용이며 의료적 조언이 아닙니다.
          </p>
        </div>
      </footer>
    </div>
  )
}
