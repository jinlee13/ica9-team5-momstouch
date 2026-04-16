# 똑똑한 엄마 — 개발 컨텍스트 요약

**작성일:** 2026-04-16  
**작성자:** hwangdrum + Claude Sonnet 4.6  
**배포 URL:** https://ddokddok-mom.vercel.app  
**GitHub:** https://github.com/jinlee13/ica9-team5-momstouch

---

## 1. 프로젝트 개요

아이 생년월일을 입력하면 발달 단계에 맞는 육아용품을 추천하고, 사이트 내 장바구니에서 직접 구매할 수 있는 웹 서비스.

**기술 스택**
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (PostgreSQL) — products 72개 + market_products 5,049개
- Vercel 배포 (`npx vercel --prod` 수동 실행 필요)
- Groq API (LLaMA-3.3-70b) — AI 챗봇 '똑똑이'

---

## 2. 완성된 페이지 목록

| 경로 | 설명 |
|------|------|
| `/` | 온보딩 — 생년월일 입력 |
| `/home` | 홈 대시보드 — 지금/곧/아직 탭, 연령별 추천 |
| `/products/[id]` | 큐레이션 상품 상세 + 시중 상품 카드 목록 |
| `/market/[id]` | 시중 상품 상세 — 이미지 갤러리, 상세이미지 |
| `/browse` | 전체 상품 카탈로그 — 월령 필터 + 카테고리 탐색 |
| `/cart` | 장바구니 — 수량 조절, 합계 |
| `/checkout` | 결제 UI — 배송지 입력, 결제수단 선택 (PG 미연동) |
| `/checklist` | 체크리스트 — 구매완료/보류/생략 상태 관리 |

---

## 3. 핵심 파일 구조

```
ddokddok-mom/
├── app/
│   ├── page.tsx                  # 온보딩 + AI 챗봇 배너
│   ├── home/page.tsx             # 홈 대시보드 + AI 챗봇 배너
│   ├── products/[id]/page.tsx    # 추천 상품 상세
│   ├── market/[id]/page.tsx      # 시중 상품 상세
│   ├── browse/page.tsx           # 전체 카탈로그 + 월령 필터
│   ├── cart/page.tsx             # 장바구니
│   ├── checkout/page.tsx         # 결제
│   ├── checklist/page.tsx        # 체크리스트
│   └── api/chat/route.ts         # Groq 스트리밍 챗봇 API
│
├── components/
│   ├── CartBadge.tsx             # GNB 장바구니 뱃지 (실시간)
│   └── chat/
│       ├── ChatFloatButton.tsx   # 전 페이지 플로팅 🤱 버튼
│       ├── ChatModal.tsx         # 채팅 모달 (스트리밍)
│       ├── ChatMessage.tsx       # 말풍선 컴포넌트
│       └── GuidedOpener.tsx      # 추천 질문 컴포넌트
│
├── lib/
│   ├── supabase.ts               # Supabase client 초기화
│   ├── supabase-queries.ts       # 모든 DB 쿼리 함수 (핵심)
│   ├── recommendations.ts        # 개월 수 계산, 연령 구간 매핑
│   ├── cart.ts                   # 장바구니 localStorage CRUD
│   └── chat.ts                   # 채팅 타입 + localStorage 유틸
│
└── docs/
    ├── PRD_똑똑한엄마.md          # 서비스 기획 문서 v2.0
    ├── TRD_똑똑한엄마.md          # 기술 요구사항 문서 v2.0
    ├── 월령_매핑_스펙.md           # 카테고리별 recommended_age 매핑 규칙
    ├── chatbot-design.md          # 챗봇 기능 설계서
    └── context.md                 # 이 파일 — 개발 맥락 요약
```

---

## 4. Supabase 테이블 구조

### `products` (큐레이션 72개)
팀이 직접 선정한 연령별 추천 상품. 홈 화면 추천의 기반.

| 주요 컬럼 | 설명 |
|-----------|------|
| `id` | 예: `'0-1m-feeding-1'` |
| `age_min_months` / `age_max_months` | 추천 월령 구간 |
| `priority` | NOW / SOON / LATER |
| `necessity` | ESSENTIAL / SITUATIONAL / OPTIONAL / RENT_OR_USED |
| `reason` | "왜 지금?" 발달 근거 문구 |

### `market_products` (크롤링 5,049개)
실제 쇼핑몰에서 크롤링한 시중 상품.

| 주요 컬럼 | 설명 |
|-----------|------|
| `category_main` / `category_mid` / `category_sub` | 대/중/소분류 |
| `thumbnail_url` | 대표 이미지 |
| `detail_images` | 상세 이미지 배열 (text[]) |
| `recommended_age_min` / `recommended_age_max` | 월령 매핑 (integer) |

> **Supabase SQL 추가 완료 (2026-04-16):**
> ```sql
> ALTER TABLE market_products ADD COLUMN detail_images text[];
> ALTER TABLE market_products ADD COLUMN recommended_age_min integer;
> ALTER TABLE market_products ADD COLUMN recommended_age_max integer;
> ```

---

## 5. 핵심 로직

### 홈 화면 추천 필터링
```typescript
// lib/supabase-queries.ts — PRODUCT_TO_CATEGORY_SUB
// 큐레이션 상품 ID → market_products.category_sub 매핑
// 이 매핑에 없는 상품은 홈에서 숨김처리 (market_products 데이터 없음)
export const PRODUCT_TO_CATEGORY_SUB: Record<string, string> = {
  '0-1m-feeding-1': '젖병',
  '0-1m-sleep-2': '속싸개·스와들',
  // ...
}

// 홈 화면: 매핑된 상품만 표시
fetchRecommendations(months).then(all =>
  setProducts(all.filter(p => p.id in PRODUCT_TO_CATEGORY_SUB))
)
```

### 월령 필터 쿼리 (/browse)
```typescript
// recommended_age_min <= ageMonths AND (recommended_age_max IS NULL OR recommended_age_max > ageMonths)
query = query.lte('recommended_age_min', ageMonths)
query = query.or(`recommended_age_max.is.null,recommended_age_max.gt.${ageMonths}`)
```

### 장바구니 (localStorage)
```typescript
// lib/cart.ts — cartStore
cartStore.add(product)   // 추가 (이미 있으면 수량 +1)
cartStore.remove(id)     // 삭제
cartStore.count()        // 총 수량 (GNB 뱃지)
cartStore.total()        // 총 금액
// 변경 시 window.dispatchEvent(new CustomEvent('cart-update')) 발행
```

### AI 챗봇 '똑똑이'
```typescript
// app/api/chat/route.ts
// Groq LLaMA-3.3-70b-versatile 스트리밍
// Supabase products 테이블에서 아이 월령 기반 컨텍스트 자동 주입
// 시스템 프롬프트: 발달 이론(WHO·AAP·K-DST) 기반 육아용품 추천
```

---

## 6. 환경변수

| 변수명 | 용도 | 위치 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | .env.local + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | .env.local + Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 롤 키 (서버 전용) | .env.local + Vercel |
| `GROQ_API_KEY` | Groq LLM API 키 | Vercel (2026-04-16 등록) |
| `ADMIN_PASSWORD` | 어드민 페이지 비밀번호 | Vercel |

---

## 7. 데이터 업로드 파이프라인

```
쇼핑몰 크롤링 (Python)
    ↓
merge_to_excel.py  →  통합 Excel (상품명/가격/이미지/상세이미지)
    ↓
upload_all_v2.py   →  Supabase market_products 업로드
    - get_age_mapping() 함수로 recommended_age_min/max 자동 계산
    - 9개 브랜드/소스: coochi, doubleheart, merged_hygiene,
      swaddleup, stokke, 밤부베베, 마더케이, 보리보리
    - 총 5,049개 업로드 완료 (2026-04-16)
```

> **upload_all_v2.py 실행 전 Supabase에 컬럼 추가 필요**  
> (위 SQL 참고 — 이미 완료됨)

---

## 8. 배포 방법

```bash
# 반드시 아래 순서로:
git add .
git commit -m "feat: 변경사항"
git push origin main  # 또는 dev → PR → main 머지

npx vercel --prod     # GitHub 자동 배포 안 됨, 수동 필수
```

> ⚠️ `main` 브랜치는 보호되어 있어 직접 push 불가 → PR 필요  
> 배포는 `merge/master-to-main` 또는 별도 브랜치 → PR → main 머지 후 `npx vercel --prod`

---

## 9. 브랜치 구조

| 브랜치 | 용도 |
|--------|------|
| `main` | 보호된 메인 브랜치, PR로만 머지 가능 |
| `dev` | 개발 브랜치 |
| `master` | hwangdrum이 작업하던 브랜치 (main에 머지 완료) |
| `feat/chatbot` | 챗봇 기능 개발 브랜치 (main에 반영 완료) |
| `docs/chatbot-design` | 챗봇 설계 문서 브랜치 |

---

## 10. 주요 이슈 & 해결 이력

| 이슈 | 원인 | 해결 |
|------|------|------|
| 기저귀 데이터 안 보임 | `PRODUCT_TO_CATEGORY_SUB`에 기저귀 매핑 없음 | `/browse` 페이지로 직접 접근 경로 추가 |
| 상품 이미지 너무 작음 | w-12 h-12 (48px) | w-20 h-20 (80px) + `/market/[id]` 상세 페이지 |
| 홈에 데이터 없는 상품 표시 | 전체 72개 무조건 표시 | `PRODUCT_TO_CATEGORY_SUB` 필터로 숨김 |
| master → main 동기화 안 됨 | master에만 작업, main 보호 규칙 | PR #4 생성 후 머지 완료 |
| 챗봇 빌드 실패 | Groq client 모듈 레벨 초기화 시 키 없으면 에러 | lazy initialization으로 수정 |
| 챗봇 답변 오류 | GROQ_API_KEY Vercel 미등록 | `vercel env add` 로 등록 + 재배포 |

---

## 11. 다음 작업 (Phase 2 후보)

- [ ] **실제 PG 결제 연동** — 사업자등록 후 NicePay/KG이니시스
- [ ] **기저귀 큐레이션 추가** — `products` 테이블 + `PRODUCT_TO_CATEGORY_SUB` 매핑 확장
- [ ] **회원가입/로그인** — Supabase Auth 활용
- [ ] **장바구니 서버 동기화** — localStorage → Supabase 저장
- [ ] **main 브랜치 자동 배포** — Vercel GitHub 연동 설정
- [ ] **챗봇 RAG 고도화** — pgvector + Supabase 벡터 검색 (docs/chatbot-design.md 참고)

---

*2026-04-16 hwangdrum + Claude Sonnet 4.6*
