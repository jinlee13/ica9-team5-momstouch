# 똑똑한 엄마 — TRD (Technical Requirements Document)

**버전:** 2.0 | **최종 업데이트:** 2026-04-11
**대상 독자:** 개발 팀원 + 개발자 멘토
**전제:** Claude Code AI 코딩 어시스턴트를 활용하여 개발 주도

> v1.2(기획 확정) → v2.0(실제 구현 기준으로 전면 업데이트)
> 실제 배포된 코드 기준으로 작성. 기획과 달라진 사항은 ⚠️로 표기.

---

## 목차

1. [시스템 아키텍처 개요](#1-시스템-아키텍처-개요)
2. [기술 스택 상세](#2-기술-스택-상세)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [핵심 라이브러리 & 모듈](#4-핵심-라이브러리--모듈)
5. [추천 엔진 설계](#5-추천-엔진-설계)
6. [장바구니 & 결제 시스템](#6-장바구니--결제-시스템)
7. [데이터 수집 파이프라인](#7-데이터-수집-파이프라인)
8. [보안 & 법적 고려사항](#8-보안--법적-고려사항)
9. [배포 & 인프라](#9-배포--인프라)
10. [파일 구조 & 주요 경로](#10-파일-구조--주요-경로)

---

## 1. 시스템 아키텍처 개요

### 실제 구현된 구조

```
[클라이언트 — 브라우저]
  Next.js 14 App Router (React + TypeScript)
  - 생년월일 → localStorage 저장
  - 개월 수 계산 (클라이언트)
  - 장바구니 → localStorage 저장
  - 체크리스트 → localStorage 저장
           │ HTTPS (Vercel 자동 적용)
           ▼
[Vercel — 서버리스]
  Next.js App Router
  - 모든 페이지: app/ 디렉토리
  - 서버 컴포넌트 + 클라이언트 컴포넌트 혼합
           │ Supabase JS Client
           ▼
[Supabase — PostgreSQL]
  - products (큐레이션 72개)
  - market_products (크롤링 5,049개)
```

> ⚠️ **기획 변경:** 원래 AWS RDS + Prisma ORM 계획이었으나, 팀 역량과 속도를 고려해 **Supabase(관리형 PostgreSQL)**로 변경. 별도 서버 없이 Supabase JS Client로 직접 쿼리.

### 기획 vs 실제 구현 비교

| 항목 | v1.2 기획 | v2.0 실제 구현 |
|------|-----------|--------------|
| DB | AWS RDS PostgreSQL | **Supabase PostgreSQL** |
| ORM | Prisma | **Supabase JS Client (직접 쿼리)** |
| 상태 관리 | Zustand | **React useState + localStorage** |
| 구매 연결 | 쿠팡 파트너스 링크 | **자체 장바구니 + 결제 UI** |
| 인프라 | AWS S3 + RDS | **Supabase (올인원)** |
| CI/CD | GitHub Actions | **npx vercel --prod (수동 배포)** |

---

## 2. 기술 스택 상세

### 프론트엔드

| 기술 | 버전 | 역할 |
|------|------|------|
| Next.js | 14.2.5 (App Router) | 풀스택 프레임워크 |
| TypeScript | 5.x | 언어 |
| Tailwind CSS | 3.x | 스타일링 |
| React | 18.x | UI 라이브러리 |

### 백엔드 / DB

| 기술 | 역할 |
|------|------|
| Supabase | PostgreSQL 호스팅 + JS Client SDK |
| Next.js API Routes | (현재 미사용, Phase 2에서 활용 예정) |

### 데이터 수집

| 기술 | 역할 |
|------|------|
| Python 3.x | 크롤링 스크립트 |
| BeautifulSoup4 | HTML 파싱 |
| Pandas | 데이터 정제, Excel 변환 |
| `merge_to_excel.py` | 크롤링 데이터 → 통합 Excel |
| `upload_all_v2.py` | Excel → Supabase 업로드 |

### 배포

| 기술 | 역할 |
|------|------|
| Vercel | Next.js 호스팅 |
| GitHub | 코드 저장소 (jinlee13/ica9-team5-momstouch) |

---

## 3. 데이터베이스 설계

### Supabase 테이블 구조

#### 테이블 1: `products` — 큐레이션 상품 (72개)

팀이 직접 선정한 연령별 추천 상품 마스터 데이터.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | text (PK) | 예: `'0-1m-feeding-1'` |
| `name` | text | 상품명 (예: "신생아 속싸개") |
| `category_slug` | text | 대분류 (sleep/feeding/play/outdoor) |
| `age_group_slug` | text | 연령구간 (0-3m, 3-6m, ...) |
| `age_min_months` | int | 최소 권장 개월 수 |
| `age_max_months` | int | 최대 권장 개월 수 |
| `priority` | text | NOW / SOON / LATER |
| `necessity` | text | ESSENTIAL / SITUATIONAL / OPTIONAL / RENT_OR_USED |
| `reason` | text | "왜 지금?" 발달 근거 문구 |
| `develop_stage` | text | 발달 단계 설명 |
| `price_range` | text | 가격대 (예: "3~8만 원대") |

#### 테이블 2: `market_products` — 크롤링 상품 (5,049개)

실제 쇼핑몰에서 크롤링한 시중 상품 데이터.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | int (PK) | 자동 증가 |
| `name` | text | 상품명 |
| `brand` | text | 브랜드 |
| `price` | text | 가격 (문자열, 예: "29,900원") |
| `thumbnail_url` | text | 대표 이미지 URL |
| `detail_images` | text[] | 상세 이미지 URL 배열 |
| `rating` | float | 평점 (0~5) |
| `review_count` | int | 리뷰 수 |
| `age_range` | text | 권장 연령 (예: "0-6개월") |
| `category_main` | text | 대분류 |
| `category_mid` | text | 중분류 |
| `category_sub` | text | 소분류 (예: "기저귀", "젖병") |
| `source_url` | text | 원본 쇼핑몰 URL |

### 두 테이블의 관계

```
products (72개 큐레이션)
    │
    │ PRODUCT_TO_CATEGORY_SUB 매핑 (코드에서 하드코딩)
    │ 예: '0-1m-feeding-1' → '젖병'
    │
    ▼
market_products (5,049개 크롤링)
    category_sub = '젖병' 인 상품들을 필터링하여 표시
```

> **핵심 매핑 파일:** `lib/supabase-queries.ts` 의 `PRODUCT_TO_CATEGORY_SUB`
> 큐레이션 상품 ID → market_products 소분류 문자열 매핑.
> 이 매핑에 없는 카테고리(기저귀 등)는 `/browse` 페이지에서 직접 접근.

---

## 4. 핵심 라이브러리 & 모듈

### `lib/supabase-queries.ts`

Supabase 쿼리 함수 모음. 모든 DB 접근은 이 파일을 통한다.

```typescript
// 주요 exports

// 큐레이션 상품 ID → market_products 소분류 매핑
export const PRODUCT_TO_CATEGORY_SUB: Record<string, string> = {
  '0-1m-feeding-1': '젖병',
  '0-1m-sleep-1': '속싸개',
  // ...
}

// 권장연령 텍스트 파싱
// "0-6개월", "6~12개월", "신생아" → { min, max }
function parseAgeRange(ageStr: string | null): { min: number; max: number } | null

// 큐레이션 상품 추천 목록 (개월 수 기반)
export async function fetchRecommendations(ageMonths: number): Promise<ProductWithPriority[]>

// 시중 상품 목록 (소분류 + 연령 필터)
export async function fetchMarketProducts(
  categorySub: string,
  ageMonths?: number,
  page?: number,
  pageSize?: number
): Promise<MarketProduct[]>

// 카탈로그 직접 조회 (대분류 + 소분류)
export async function fetchMarketProductsByCat(
  main: string,
  mid?: string,
  sub?: string,
  page?: number,
  pageSize?: number
): Promise<MarketProduct[]>

// 시중 상품 단건 조회
export async function fetchMarketProductById(id: number): Promise<MarketProduct | null>
```

### `lib/recommendations.ts`

개월 수 계산 + 연령 그룹 매핑 + 카테고리 정보.

```typescript
// 생년월일 문자열 → 현재 개월 수
export function calculateAgeInMonths(birthdate: string): number

// 개월 수 → "7개월" 형태 레이블
export function getAgeLabel(months: number): string

// 개월 수 → 연령 구간 슬러그
export function getAgeGroupForMonths(months: number): string
// 반환값: '0-3m' | '3-6m' | '6-12m' | '12-18m' | '18-24m' | '24-36m'
```

### `lib/cart.ts`

localStorage 기반 장바구니. 커스텀 이벤트로 GNB 뱃지와 실시간 동기화.

```typescript
export interface CartItem {
  id: number          // market_products.id
  name: string
  brand: string
  price: string       // 원본 문자열 ("29,900원")
  priceNum: number    // 파싱된 숫자 (29900)
  thumbnail_url: string
  quantity: number
}

export const cartStore = {
  get(): CartItem[]                              // 전체 목록
  add(product: Omit<CartItem, 'quantity' | 'priceNum'>): void  // 추가 (이미 있으면 +1)
  remove(id: number): void                       // 삭제
  update(id: number, qty: number): void          // 수량 변경
  clear(): void                                  // 전체 비우기
  count(): number                                // 총 수량
  total(): number                                // 총 금액
}

// 장바구니 변경 시 발생하는 커스텀 이벤트
// window.dispatchEvent(new CustomEvent('cart-update'))
```

### `components/CartBadge.tsx`

GNB에 표시되는 장바구니 수량 뱃지.

```typescript
// 'cart-update' 이벤트 리스닝 → 실시간 count 업데이트
// count > 0 이면 빨간 뱃지 표시
// 클릭 시 /cart 이동
```

---

## 5. 추천 엔진 설계

### 실제 구현된 로직

```
[클라이언트 — app/home/page.tsx]
  1. localStorage에서 birthdate 읽기
  2. calculateAgeInMonths(birthdate) → ageMonths
  3. fetchRecommendations(ageMonths) 호출
  4. 결과를 PRODUCT_TO_CATEGORY_SUB로 필터
     → 매핑 없는 제품 숨김처리 (market_products 데이터 없는 경우)
  5. priority(NOW/SOON/LATER) + categorySlug로 화면 필터링

[Supabase 쿼리 — lib/supabase-queries.ts]
  products 테이블에서
  age_min_months <= ageMonths <= age_max_months 조건으로 조회
  → priority 분류 (NOW: 현재 구간, SOON: 다음 구간, LATER: 이후)
```

### 연령 기반 시중 상품 필터링

```typescript
// market_products의 age_range 필드를 파싱해서
// 아이 개월 수와 겹치는 상품만 필터링

// "0-6개월" → { min: 0, max: 6 }
// "신생아"  → { min: 0, max: 3 }
// "6~12개월" → { min: 6, max: 12 }

// 조건: parsed.min <= ageMonths <= parsed.max
//       또는 age_range가 null인 경우 포함 (전 연령 적용)
```

### 우선순위 탭 구분 기준

| 탭 | 조건 |
|----|------|
| 지금 필요 🔥 | 현재 개월 수가 age_min ~ age_max 구간에 포함 |
| 곧 필요 ⏰ | 현재보다 1~2개월 후 필요한 항목 |
| 아직 이른 것 📦 | 현재보다 3개월+ 이후 필요한 항목 |

---

## 6. 장바구니 & 결제 시스템

### 아키텍처

```
담기 버튼 클릭
    │ cartStore.add()
    ▼
localStorage['ddokddok_cart']
    │ CustomEvent('cart-update')
    ▼
CartBadge (GNB) ← 실시간 count 업데이트

/cart 페이지
    │ cartStore.get()
    ▼
수량 조절(+/-) / 삭제 / 합계 계산

/checkout 페이지
    │ 배송지 입력 + 결제수단 선택
    ▼
주문 완료 화면 (주문번호 발급)
```

> ⚠️ **현재 상태:** 결제 UI만 구현. 실제 PG(Payment Gateway) 연동 없음.
> Phase 2에서 NicePay 또는 KG이니시스 연동 예정 (사업자등록 필요).

### localStorage 스키마

```typescript
// 장바구니
localStorage['ddokddok_cart'] = JSON.stringify(CartItem[])

// 체크리스트
localStorage['ddokddok_checklist'] = JSON.stringify({
  [productId: string]: 'BOUGHT' | 'PENDING' | 'SKIP'
})

// 생년월일
localStorage['ddokddok_birthdate'] = 'YYYY-MM-DD'
```

---

## 7. 데이터 수집 파이프라인

### 전체 흐름

```
[쇼핑몰 크롤링]
    │ Python (BeautifulSoup / Selenium)
    ▼
[데이터 정제]
    │ merge_to_excel.py
    ▼
[통합 Excel 파일]
    컬럼: 상품명, 브랜드, 가격, 썸네일URL, 상세이미지URLs,
          평점, 리뷰수, 권장연령, 대분류, 중분류, 소분류
    │
    │ upload_all_v2.py
    ▼
[Supabase market_products 테이블]
    5,049개 상품 저장 완료
```

### 크롤링 스크립트 주요 함수

```python
# merge_to_excel.py
def real_images(urls: list, max_count: int = 8) -> list:
    """트래킹 픽셀 제거, 실제 이미지 URL만 반환"""

# upload_all_v2.py
def row(name, brand, price, thumbnail, detail_images=None, ...):
    """Supabase insert용 딕셔너리 생성"""
    return {
        "name": name,
        "thumbnail_url": thumbnail,
        "detail_images": detail_images or None,  # text[] 타입
        ...
    }
```

### detail_images 컬럼 설정

Supabase Dashboard에서 수동 추가 필요:
```sql
ALTER TABLE market_products ADD COLUMN detail_images text[];
```
→ 추가 후 `upload_all_v2.py` 재실행하여 상세이미지 데이터 업로드.

---

## 8. 보안 & 법적 고려사항

### 환경변수 관리

```bash
# .env.local (Git에 올리지 말 것!)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Vercel Dashboard에도 동일하게 등록
# (Settings → Environment Variables)
```

> ⚠️ **주의:** `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트에도 노출됨.
> Supabase anon key는 Row Level Security(RLS)로 보호. 현재 RLS는 읽기 전용으로 설정 권장.

### 개인정보

- 생년월일: localStorage에만 저장, 서버 전송 없음
- 장바구니: localStorage에만 저장, 서버 전송 없음
- 결제 정보: 현재 UI만, 실제 데이터 수집 없음

### 크롤링 정책

- 외부 쇼핑몰 크롤링 시 robots.txt 확인 필수
- 과도한 요청으로 서버 부하 주지 않도록 딜레이 설정

---

## 9. 배포 & 인프라

### 배포 방법

```bash
# 1. 코드 변경 후 GitHub에 push
cd ddokddok-mom
git add .
git commit -m "feat: 변경사항 설명"
git push

# 2. Vercel 프로덕션 배포 (GitHub 자동 배포 미설정으로 수동 필요)
npx vercel --prod
```

> ⚠️ **GitHub push만으로는 자동 배포 안 됨.** 반드시 `npx vercel --prod` 실행 필요.

### 배포 환경

| 항목 | 값 |
|------|-----|
| 호스팅 | Vercel |
| 프로덕션 URL | https://ddokddok-mom.vercel.app |
| GitHub 레포 | jinlee13/ica9-team5-momstouch |
| 브랜치 | master |
| Node.js | 18.x |
| 빌드 명령 | `npm run build` |

### Vercel 환경변수 설정 위치

```
Vercel Dashboard
  → Project: ddokddok-mom
  → Settings
  → Environment Variables
  → NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 등록
```

---

## 10. 파일 구조 & 주요 경로

```
ddokddok-mom/
├── app/
│   ├── page.tsx               # 온보딩 (생년월일 입력)
│   ├── home/
│   │   └── page.tsx           # 홈 대시보드 (추천 목록)
│   ├── products/
│   │   └── [id]/page.tsx      # 큐레이션 상품 상세 + 시중 상품 목록
│   ├── market/
│   │   └── [id]/page.tsx      # 시중 상품 상세 (이미지 갤러리 + 담기)
│   ├── browse/
│   │   └── page.tsx           # 전체 상품 카탈로그 (기저귀 등 직접 탐색)
│   ├── cart/
│   │   └── page.tsx           # 장바구니
│   ├── checkout/
│   │   └── page.tsx           # 결제 페이지 (UI)
│   ├── checklist/
│   │   └── page.tsx           # 체크리스트
│   └── guide/
│       └── page.tsx           # 준비 가이드
│
├── lib/
│   ├── supabase.ts            # Supabase client 초기화
│   ├── supabase-queries.ts    # 모든 DB 쿼리 함수 (핵심 파일)
│   ├── recommendations.ts     # 개월 수 계산, 연령 그룹 매핑
│   └── cart.ts                # 장바구니 localStorage 관리
│
├── components/
│   └── CartBadge.tsx          # GNB 장바구니 뱃지
│
└── .env.local                 # 환경변수 (Git 제외)
```

### 핵심 파일 역할 요약

| 파일 | 역할 |
|------|------|
| `lib/supabase-queries.ts` | **모든 DB 접근의 단일 진입점.** PRODUCT_TO_CATEGORY_SUB 매핑 포함. |
| `lib/recommendations.ts` | 개월 수 계산 유틸. 생년월일 → 연령 구간 변환. |
| `lib/cart.ts` | localStorage 장바구니 CRUD + 이벤트 발행. |
| `app/home/page.tsx` | 홈 대시보드. 추천 로직 + 필터링 + GNB. |
| `app/browse/page.tsx` | 전체 상품 카탈로그. market_products 직접 조회. |

---

## Appendix. 자주 하는 작업

### 새 상품 카테고리를 홈 추천에 추가하는 방법

1. Supabase `products` 테이블에 새 행 추가
2. `lib/supabase-queries.ts`의 `PRODUCT_TO_CATEGORY_SUB`에 매핑 추가
   ```typescript
   'new-product-id': '기저귀',  // market_products.category_sub 값과 일치해야 함
   ```
3. 빌드 & 배포

### 크롤링 데이터 업데이트 방법

```bash
# 1. 크롤링 실행 (쇼핑몰별 Python 스크립트)
python crawl_boribori.py

# 2. 통합 Excel 생성
python merge_to_excel.py

# 3. Supabase 업로드
python upload_all_v2.py
```

### 배포 체크리스트

- [ ] `npm run build` 로컬에서 에러 없이 통과 확인
- [ ] `git push` 완료
- [ ] `npx vercel --prod` 실행
- [ ] 배포 URL에서 온보딩 → 홈 → 상품 상세 → 장바구니 흐름 테스트

---

*버전 2.0 — 똑똑한 엄마 팀 | 2026-04-11 업데이트 (MVP 배포 완료 기준)*
