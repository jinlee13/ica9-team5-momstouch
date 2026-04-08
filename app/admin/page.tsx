'use client'

import { useState, useEffect, useCallback } from 'react'

type AnalyticsData = {
  summary: { total_views: number; total_clicks: number; total_checklist: number; unique_sessions: number }
  topViewed: { id: string; name: string; count: number; category: string }[]
  topClicked: { id: string; name: string; count: number; productName: string }[]
  topChecklist: { id: string; name: string; BOUGHT: number; PENDING: number; SKIP: number; total: number }[]
  catMap: Record<string, number>
  daily: [string, number][]
}

const CATEGORIES = [
  { value: 'sleep',   label: '자기·위생' },
  { value: 'feeding', label: '먹기' },
  { value: 'play',    label: '놀기·배우기' },
  { value: 'outdoor', label: '외출·안전' },
]
const NECESSITY_OPTIONS = [
  { value: 'ESSENTIAL',    label: '필수' },
  { value: 'SITUATIONAL',  label: '상황형' },
  { value: 'OPTIONAL',     label: '생략가능' },
  { value: 'RENT_OR_USED', label: '중고·대여' },
]
const AGE_GROUPS = ['0-1m','1-3m','3-6m','6-12m','12-24m','24-36m']

const EMPTY_FORM = {
  id: '', name: '', category_slug: 'sleep', category_name: '자기·위생',
  age_group_slug: '0-1m', age_min_months: 0, age_max_months: 1,
  necessity: 'ESSENTIAL', reason: '', develop_stage: '',
  price_range: '', kc_certified: false,
  ddok_pillars: [] as string[], theory_note: '', usage_tips: '',
}

type Product = typeof EMPTY_FORM & { id: string }

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState<'products' | 'analytics'>('products')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsDays, setAnalyticsDays] = useState(7)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const loadProducts = useCallback(async (pw: string) => {
    const res = await fetch('/api/admin/products', {
      headers: { 'x-admin-password': pw }
    })
    if (res.ok) setProducts(await res.json())
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/products', {
      headers: { 'x-admin-password': password }
    })
    if (res.ok) {
      setAuthed(true)
      setProducts(await res.json())
      localStorage.setItem('admin_pw', password)
    } else {
      setAuthError('비밀번호가 틀렸어요.')
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('admin_pw')
    if (saved) {
      setPassword(saved)
      fetch('/api/admin/products', { headers: { 'x-admin-password': saved } })
        .then(r => r.ok ? r.json().then((d) => { setProducts(d); setAuthed(true) }) : null)
    }
  }, [])

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingProduct(null)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setForm({ ...p, usage_tips: Array.isArray(p.usage_tips) ? (p.usage_tips as string[]).join('\n') : (p.usage_tips ?? '') })
    setEditingProduct(p)
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    const payload = {
      ...form,
      age_min_months: Number(form.age_min_months),
      age_max_months: Number(form.age_max_months),
      usage_tips: form.usage_tips ? form.usage_tips.split('\n').filter(Boolean) : null,
    }
    const method = editingProduct ? 'PATCH' : 'POST'
    const res = await fetch('/api/admin/products', {
      method,
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      showToast(editingProduct ? '✅ 수정 완료!' : '✅ 추가 완료!')
      setShowForm(false)
      loadProducts(password)
    } else {
      const err = await res.json()
      showToast('❌ 오류: ' + err.error)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 을 삭제할까요?`)) return
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'x-admin-password': password, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { showToast('🗑️ 삭제 완료'); loadProducts(password) }
  }

  const loadAnalytics = useCallback(async (pw: string, days: number) => {
    setAnalyticsLoading(true)
    const res = await fetch(`/api/admin/analytics?days=${days}`, {
      headers: { 'x-admin-password': pw }
    })
    if (res.ok) setAnalytics(await res.json())
    setAnalyticsLoading(false)
  }, [])

  useEffect(() => {
    if (authed && activeTab === 'analytics') loadAnalytics(password, analyticsDays)
  }, [authed, activeTab, analyticsDays, loadAnalytics, password])

  const filtered = products.filter((p) => {
    if (filterCat !== 'all' && p.category_slug !== filterCat) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // 로그인 화면
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-2xl font-black text-gray-900">관리자 로그인</h1>
            <p className="text-gray-400 text-sm mt-1">똑똑한 엄마 콘텐츠 관리</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="관리자 비밀번호"
              className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-base"
            />
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button type="submit"
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-base"
                    style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
              로그인
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black" style={{ color: '#9B7EDE' }}>똑똑한 엄마</span>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-bold">관리자</span>
            <div className="flex gap-1 ml-2">
              {(['products', 'analytics'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  style={activeTab === tab ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                  {tab === 'products' ? '📦 제품 관리' : '📊 분석'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">총 {products.length}개 제품</span>
            <button onClick={openAdd}
                    className="px-4 py-2 rounded-xl text-white text-sm font-bold shadow-md"
                    style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
              + 제품 추가
            </button>
            <button onClick={() => { localStorage.removeItem('admin_pw'); setAuthed(false) }}
                    className="text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1.5 hover:text-gray-600">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* ── 분석 탭 ── */}
        {activeTab === 'analytics' && (
          <div>
            {/* 기간 선택 */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm font-bold text-gray-600">기간:</span>
              {[7, 14, 30].map((d) => (
                <button key={d} onClick={() => setAnalyticsDays(d)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${analyticsDays === d ? 'text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
                  style={analyticsDays === d ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                  최근 {d}일
                </button>
              ))}
              <button onClick={() => loadAnalytics(password, analyticsDays)}
                className="ml-2 px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-500 hover:border-purple-300">
                새로고침
              </button>
            </div>

            {analyticsLoading ? (
              <div className="text-center py-20 text-gray-400">데이터 불러오는 중...</div>
            ) : !analytics ? (
              <div className="text-center py-20 text-gray-400">데이터 없음</div>
            ) : (
              <div className="space-y-6">
                {/* 요약 카드 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '총 제품 조회', value: analytics.summary.total_views, emoji: '👁️' },
                    { label: '구매 링크 클릭', value: analytics.summary.total_clicks, emoji: '🛒' },
                    { label: '체크리스트 액션', value: analytics.summary.total_checklist, emoji: '✅' },
                    { label: '방문 세션', value: analytics.summary.unique_sessions, emoji: '👤' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <div className="text-3xl font-black" style={{ color: '#9B7EDE' }}>{s.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* 많이 본 제품 TOP 10 */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>👁️</span> 많이 본 제품 TOP 10
                    </h3>
                    {analytics.topViewed.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">데이터 없음</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.topViewed.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.category}</p>
                            </div>
                            <span className="text-sm font-bold text-purple-600">{p.count}회</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 구매 클릭 TOP 10 */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🛒</span> 구매 클릭 많은 상품 TOP 10
                    </h3>
                    {analytics.topClicked.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">데이터 없음</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.topClicked.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                              <p className="text-xs text-gray-400">{p.productName} 에서</p>
                            </div>
                            <span className="text-sm font-bold text-blue-600">{p.count}회</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 체크리스트 완료 TOP */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>✅</span> 체크리스트 많이 담은 제품
                    </h3>
                    {analytics.topChecklist.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">데이터 없음</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.topChecklist.map((p, i) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                              <div className="flex gap-2 mt-0.5">
                                <span className="text-xs text-green-600">✅ {p.BOUGHT}</span>
                                <span className="text-xs text-yellow-600">⏳ {p.PENDING}</span>
                                <span className="text-xs text-red-400">🚫 {p.SKIP}</span>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-green-600">{p.total}회</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 카테고리별 관심도 */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>📂</span> 카테고리별 관심도
                    </h3>
                    {Object.keys(analytics.catMap).length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-8">데이터 없음</p>
                    ) : (() => {
                      const total = Object.values(analytics.catMap).reduce((a, b) => a + b, 0)
                      const colors: Record<string, string> = {
                        '먹기': '#F59E0B', '자기·위생': '#8B5CF6',
                        '놀기·배우기': '#10B981', '외출·안전': '#3B82F6',
                      }
                      return (
                        <div className="space-y-3">
                          {Object.entries(analytics.catMap)
                            .sort(([,a],[,b]) => b - a)
                            .map(([cat, count]) => (
                              <div key={cat}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium text-gray-700">{cat}</span>
                                  <span className="text-gray-500">{count}회 ({Math.round(count/total*100)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div className="h-2 rounded-full transition-all"
                                    style={{ width: `${Math.round(count/total*100)}%`, background: colors[cat] ?? '#9B7EDE' }} />
                                </div>
                              </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 제품 관리 탭 ── */}
        {activeTab === 'products' && <>
        {/* 검색/필터 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제품명 검색..."
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {[{ value: 'all', label: '전체' }, ...CATEGORIES].map((c) => (
              <button key={c.value} onClick={() => setFilterCat(c.value)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                        filterCat === c.value ? 'text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'
                      }`}
                      style={filterCat === c.value ? { background: 'linear-gradient(to right, #9B7EDE, #B794F6)' } : {}}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제품 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">제품명</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">카테고리</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden sm:table-cell">개월</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">필요도</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">팁</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 md:hidden">{p.category_name} · {p.age_group_slug}</p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{p.category_name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 hidden sm:table-cell">{p.age_min_months}~{p.age_max_months}개월</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        p.necessity === 'ESSENTIAL' ? 'bg-purple-100 text-purple-700' :
                        p.necessity === 'SITUATIONAL' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{NECESSITY_OPTIONS.find(n => n.value === p.necessity)?.label}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {p.usage_tips && (p.usage_tips as unknown as string[]).length > 0
                        ? <span className="text-xs text-green-600 font-semibold">✓ {(p.usage_tips as unknown as string[]).length}개</span>
                        : <span className="text-xs text-gray-300">없음</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(p)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 transition-all font-semibold">
                          수정
                        </button>
                        <button onClick={() => handleDelete(p.id, p.name)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-all font-semibold">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-gray-400">검색 결과가 없어요</div>
            )}
          </div>
        </div>
        </>}
      </div>

      {/* 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-lg font-black text-gray-900">
                {editingProduct ? '제품 수정' : '새 제품 추가'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">제품 ID <span className="text-red-400">*</span></label>
                  <input value={form.id} onChange={(e) => setForm({...form, id: e.target.value})}
                         disabled={!!editingProduct}
                         placeholder="예: 0-1m-sleep-5"
                         className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm disabled:bg-gray-50 disabled:text-gray-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">제품명 <span className="text-red-400">*</span></label>
                  <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                         placeholder="예: 신생아 침대"
                         className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">카테고리</label>
                  <select value={form.category_slug}
                          onChange={(e) => {
                            const cat = CATEGORIES.find(c => c.value === e.target.value)
                            setForm({...form, category_slug: e.target.value, category_name: cat?.label ?? ''})
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">필요도</label>
                  <select value={form.necessity} onChange={(e) => setForm({...form, necessity: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm">
                    {NECESSITY_OPTIONS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">연령 그룹</label>
                  <select value={form.age_group_slug} onChange={(e) => setForm({...form, age_group_slug: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm">
                    {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 block mb-1.5">최소 개월</label>
                    <input type="number" value={form.age_min_months}
                           onChange={(e) => setForm({...form, age_min_months: Number(e.target.value)})}
                           className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 block mb-1.5">최대 개월</label>
                    <input type="number" value={form.age_max_months}
                           onChange={(e) => setForm({...form, age_max_months: Number(e.target.value)})}
                           className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">가격대</label>
                  <input value={form.price_range} onChange={(e) => setForm({...form, price_range: e.target.value})}
                         placeholder="예: 50,000~150,000원"
                         className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">발달 단계</label>
                  <input value={form.develop_stage} onChange={(e) => setForm({...form, develop_stage: e.target.value})}
                         placeholder="예: 감각운동기"
                         className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="kc" checked={form.kc_certified}
                         onChange={(e) => setForm({...form, kc_certified: e.target.checked})}
                         className="w-4 h-4 accent-purple-500" />
                  <label htmlFor="kc" className="text-sm font-semibold text-gray-700">KC 안전인증 제품</label>
                </div>
              </div>

              {/* 추천 이유 */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">추천 이유</label>
                <textarea value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})}
                          rows={2} placeholder="왜 이 시기에 필요한지 설명해주세요"
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-sm resize-none" />
              </div>

              {/* 활용 팁 */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">
                  활용 팁 <span className="text-gray-400 font-normal">(한 줄에 하나씩 입력)</span>
                </label>
                <textarea value={form.usage_tips}
                          onChange={(e) => setForm({...form, usage_tips: e.target.value})}
                          rows={4}
                          placeholder={"처음 2주는 짧게 10분씩 사용해보세요\n아이가 익숙해지면 시간을 늘려가세요\n세척 후 완전히 건조 후 사용하세요"}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none text-sm resize-none bg-amber-50" />
                <p className="text-xs text-amber-600 mt-1">💡 줄 바꿈으로 팁을 구분해주세요</p>
              </div>

              {/* DDOK 필러 */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">DDOK 필러</label>
                <div className="flex gap-3">
                  {['D','O','K','T'].map((p) => (
                    <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox"
                             checked={form.ddok_pillars.includes(p)}
                             onChange={(e) => setForm({
                               ...form,
                               ddok_pillars: e.target.checked
                                 ? [...form.ddok_pillars, p]
                                 : form.ddok_pillars.filter(x => x !== p)
                             })}
                             className="accent-purple-500" />
                      <span className="text-sm font-bold text-purple-700">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                      className="px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md disabled:opacity-60"
                      style={{ background: 'linear-gradient(to right, #9B7EDE, #B794F6)' }}>
                {saving ? '저장 중...' : editingProduct ? '수정 완료' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
