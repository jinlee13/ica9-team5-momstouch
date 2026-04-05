# 똑똑한 엄마 — TRD (Technical Requirements Document)

**버전:** 1.2 | **작성일:** 2026-04-01
**대상 독자:** 개발 팀원 + 개발자 멘토
**전제:** Claude Code 등 AI 코딩 어시스턴트를 활용하여 비개발자 팀이 개발을 주도

> 각 섹션마다 기술 결정의 이유(Why)를 함께 설명합니다.
> 코드 예시는 Claude Code에 그대로 붙여넣어 구현 지시 프롬프트로 활용할 수 있습니다.

---

## 목차

1. [시스템 아키텍처 개요](#1-시스템-아키텍처-개요)
2. [기술 스택 상세](#2-기술-스택-상세)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [API 설계](#4-api-설계)
5. [추천 엔진 설계](#5-추천-엔진-설계)
6. [외부 API 연동 명세](#6-외부-api-연동-명세)
7. [데이터 수집 파이프라인](#7-데이터-수집-파이프라인)
8. [보안 & 법적 고려사항](#8-보안--법적-고려사항)
9. [배포 & 인프라](#9-배포--인프라)
10. [개발 우선순위 & 단계별 구현 계획](#10-개발-우선순위--단계별-구현-계획)

---

## 1. 시스템 아키텍처 개요

### 전체 구조 (MVP)

```
[클라이언트]
Next.js (React) — Vercel 배포
온보딩 / 홈 / 카테고리 / 상세 / 체크리스트
        │ HTTPS
        ▼
[백엔드 API 서버]
Next.js API Routes (서버리스)
- 추천 엔진 (Rule-Based)
- 외부 API 프록시 (네이버, SafetyKorea, 쿠팡)
- 데이터 캐싱 레이어
        │
   ┌────┴────┐
   ▼         ▼
[AWS RDS]  [외부 API]
PostgreSQL  - 네이버 쇼핑 검색 API
- products  - 네이버 쇼핑인사이트 API
- lifecycle - SafetyKorea Open API
- api_cache - 쿠팡 파트너스 API
        │
        ▼
[AWS S3]
크롤링 원본 / 상품 이미지 / 정적 에셋
```

### 아키텍처 결정 이유

| 결정 | 이유 |
|------|------|
| **Next.js 풀스택** | 프론트엔드와 API를 하나의 프로젝트에서 관리. AI 코딩 시 컨텍스트 분산 방지. Vercel 무료 티어로 빠른 배포 가능. |
| **서버리스 API Routes** | 별도 Express 서버 불필요. 외부 API 키를 서버사이드에서만 호출하여 보안 유지. |
| **PostgreSQL (RDS)** | 추천 룰 및 상품 메타데이터가 정형화된 관계형 데이터. |
| **S3 별도 분리** | 이미지·크롤링 원본 등 비정형 대용량 파일은 DB가 아닌 오브젝트 스토리지에 보관. |

---

## 2. 기술 스택 상세

### 프론트엔드

| 기술 | 버전 | 역할 | 선택 이유 |
|------|------|------|----------|
| Next.js | 14.x (App Router) | 풀스택 프레임워크 | SSR/SSG 지원, API Routes 내장, Vercel 배포 최적화 |
| TypeScript | 5.x | 언어 | AI가 코드 생성 시 타입 오류 조기 감지 |
| Tailwind CSS | 3.x | 스타일링 | AI가 UI 수정 시 예측 가능. 빠른 프로토타이핑. |
| shadcn/ui | latest | 컴포넌트 라이브러리 | Tailwind 기반, 복사-붙여넣기 방식으로 AI 친화적 |
| Zustand | 4.x | 상태 관리 | Redux 대비 단순. AI가 생성하기 쉬운 패턴. |

### 백엔드

| 기술 | 버전 | 역할 | 선택 이유 |
|------|------|------|----------|
| Next.js API Routes | 14.x | REST API 서버 | 별도 서버 불필요. 프론트와 동일 레포. |
| Prisma | 5.x | ORM | 타입 안전한 DB 쿼리. AI가 스키마 파일 보고 쿼리 생성 용이. |
| PostgreSQL | 15.x | 데이터베이스 | 관계형 데이터, JSON 컬럼 지원 |

### 데이터 수집 & 처리

| 기술 | 역할 |
|------|------|
| Python 3.11 | 크롤링 스크립트 |
| BeautifulSoup4 | HTML 파싱 (정적 페이지) |
| Selenium | 동적 페이지 크롤링 |
| Pandas | 데이터 정제, CSV/JSON 변환 |
| Firecrawl MCP | AI 기반 크롤링 (Claude Code 통합) |

### 인프라 & 배포

| 기술 | 역할 |
|------|------|
| Vercel | Next.js 배포 (프론트 + API Routes) |
| AWS RDS (PostgreSQL) | 운영 DB |
| AWS S3 | 정적 파일 스토리지 |
| GitHub Actions | CI/CD 파이프라인 |

### AI 개발 도구

| 도구 | 활용 방식 |
|------|----------|
| Claude Code | 코드 생성, 리팩토링, 버그 수정, 스키마 생성 |
| Firecrawl MCP | 웹 크롤링 자동화 |
| GPT API | 추천 이유 문구 자동 생성 (Phase 2) |

---

## 3. 데이터베이스 설계

### v1 외부 연동 모드 결정 (Scope Freeze)

> GPT 검토 반영: 외부 API를 stub/manual/live 중 하나로 확정. AI가 임의로 연동 구조를 만들지 않도록 잠금.

| 데이터 | v1 모드 | 설명 |
|--------|:------:|------|
| 가격 | **manual** | seed 데이터에 범위값 직접 입력 ("3~8만 원대") |
| KC/리콜 정보 | **manual** | seed 데이터에 수동 입력, 자동 연동은 Phase 3 |
| 쿠팡 파트너스 링크 | **manual** | 상품별 URL 직접 입력 |
| 인기도 스코어 | **stub** | 기본값 0.5 고정 (Phase 3에서 실제값 교체) |
| 네이버 쇼핑 가격 API | **Phase 2** | v1 제외 |
| 네이버 쇼핑인사이트 API | **Phase 3** | v1 제외 |
| SafetyKorea API | **Phase 3** | v1 제외 |

### Seed 데이터 명세 (v1 핵심 자산)

> 이 서비스는 코드보다 데이터가 먼저. DB seed 파일이 완성되어야 추천 엔진이 작동.

**필요 파일 목록:**
- `prisma/seed/categories.csv`
- `prisma/seed/products.csv`
- `prisma/seed/lifecycle_rules.csv`

**lifecycle_rules.csv 컬럼 명세:**

| 컬럼 | 타입 | 예시 | 필수 |
|------|------|------|:---:|
| `category_slug` | string | `"feeding"` | ✅ |
| `product_name` | string | `"이유식 의자"` | ✅ |
| `age_group_slug` | string | `"6-12m"` | ✅ |
| `age_min_months` | int | `6` | ✅ |
| `age_max_months` | int | `11` | ✅ |
| `priority` | NOW/SOON/LATER | `"NOW"` | ✅ |
| `necessity` | ESSENTIAL/SITUATIONAL/OPTIONAL/RENT_OR_USED | `"ESSENTIAL"` | ✅ |
| `reason` | string | `"7개월은 이유식을 본격 시작하는 시기입니다."` | ✅ |
| `develop_stage` | string | `"이유식 2단계 시작, 앉기 가능"` | 권장 |
| `price_range` | string | `"30,000~80,000원"` | 권장 |
| `kc_certified` | boolean | `true` | 권장 |
| `coupang_url` | string | `"https://..."` | 권장 |

**v1 목표 데이터 수:** 6구간 × 4카테고리 × 3아이템 = **최소 72행**

### 주요 테이블 목록

| 테이블 | 설명 |
|--------|------|
| `categories` | 4개 상위 카테고리 (v1), Phase 2에서 10개 세부 추가 |
| `products` | 육아용품 마스터 데이터 |
| `lifecycle_rules` | 개월 수별 추천 룰 **(핵심 자산 — seed 먼저 완성)** |
| `product_safety` | 안전 인증 정보 (v1은 수동 입력, Phase 3에서 자동화) |
| `api_cache` | 외부 API 응답 캐시 (Phase 2 이후 활성화) |

### Prisma 스키마 (schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 카테고리 (4개 상위 + 10개 세부 구조)
// parentCategoryId == null 이면 상위 카테고리, 아니면 세부 카테고리
model Category {
  id               Int        @id @default(autoincrement())
  slug             String     @unique  // "feeding", "sleep", "hygiene"
  nameKo           String              // "수유", "수면"
  parentCategoryId Int?                // 상위 카테고리 참조 (null = 상위)
  parent           Category?  @relation("CategoryHierarchy", fields: [parentCategoryId], references: [id])
  children         Category[] @relation("CategoryHierarchy")
  icon             String?
  sortOrder        Int        @default(0)
  products         Product[]
  createdAt        DateTime   @default(now())
}

// 육아용품 마스터
model Product {
  id              Int       @id @default(autoincrement())
  categoryId      Int
  nameKo          String    // "신생아 속싸개"
  description     String?
  priceMin        Int?      // 최저가 (원)
  priceMax        Int?      // 최고가 (원)
  brand           String?
  imageUrl        String?
  coupangUrl      String?   // 쿠팡 파트너스 링크
  naverSearchKw   String?   // 네이버 검색 키워드
  isPopular       Boolean   @default(false)
  popularityScore Float?    // 0.0 ~ 1.0
  isActive        Boolean   @default(true)
  category        Category        @relation(fields: [categoryId], references: [id])
  lifecycleRules  LifecycleRule[]
  safetyInfo      ProductSafety?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

// 생애주기 추천 룰 (핵심 자산)
// 개월 수 구간별로 상품을 어떻게 추천할지 정의
model LifecycleRule {
  id              Int       @id @default(autoincrement())
  productId       Int
  ageGroupSlug    String    // "0-3m" | "3-6m" | "6-12m" | "12-18m" | "18-24m" | "24-36m"
  ageMinMonths    Int       // 최소 개월 수
  ageMaxMonths    Int       // 최대 개월 수
  priority        String    // "NOW" | "SOON" | "LATER"
  necessity       String    // "ESSENTIAL" | "SITUATIONAL" | "OPTIONAL" | "RENT_OR_USED"
  reason          String?   // 추천 이유 (발달 근거 문구)
  developStage    String?   // 발달 단계 (예: "목 가누기 시작")
  sortOrder       Int       @default(0)
  product         Product   @relation(fields: [productId], references: [id])

  @@unique([productId, ageGroupSlug])
  @@index([ageMinMonths, ageMaxMonths])
}

// 안전 인증 정보
model ProductSafety {
  id              Int       @id @default(autoincrement())
  productId       Int       @unique
  kcCertified     Boolean   @default(false)
  kcCertNumber    String?
  hasRecall       Boolean   @default(false)
  recallDetail    String?
  lastCheckedAt   DateTime?
  product         Product   @relation(fields: [productId], references: [id])
}

// 체크리스트는 MVP에서 클라이언트 로컬스토리지에만 저장 (서버 전송 없음)
// localStorage key: "ddokddok_checklist"
// 구조:
// {
//   [productId: string]: {
//     status: "BOUGHT" | "PENDING" | "SKIP",
//     updatedAt: string  // ISO8601
//   }
// }

// 외부 API 응답 캐시 (Rate Limit 및 비용 절감)
model ApiCache {
  id          Int       @id @default(autoincrement())
  cacheKey    String    @unique  // 예: "naver_search_유아용품_7m"
  provider    String             // "naver" | "coupang" | "safety_korea"
  data        Json
  expiresAt   DateTime
  createdAt   DateTime  @default(now())

  @@index([cacheKey, expiresAt])
}
```

---

## 4. API 설계

> 모든 API는 Next.js App Router의 `app/api/` 디렉토리에 위치한다.

### API 엔드포인트 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/recommendations` | 연령 구간 기반 추천 목록 |
| GET | `/api/categories` | 카테고리 목록 (상위/세부 계층 포함) |
| GET | `/api/categories/:slug/products` | 카테고리별 상품 목록 |
| GET | `/api/products/:id` | 상품 상세 (안전 정보 포함) |
| GET | `/api/products/:id/price` | 실시간 가격 (네이버 API 프록시) |
| GET | `/api/popular` | 인기 상품 목록 |

> **정리:** `GET /api/recommendations/:id`는 제거. 상품 상세는 `/api/products/:id`로 통일.

### GET `/api/recommendations` 상세

> **개인정보 설계 원칙:** 생년월일 계산은 클라이언트(브라우저)에서 수행. 서버에는 연령 구간(ageGroup)만 전달. 생년월일은 서버로 전송하지 않으므로 PRD 9장 "생년월일은 기기에만 저장됩니다" 문구와 충돌 없음.

**요청 파라미터**

```
GET /api/recommendations?ageGroup=6-12m&filter=NOW&category=feeding
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `ageGroup` | `0-3m\|3-6m\|6-12m\|12-18m\|18-24m\|24-36m` | 필수 | 클라이언트에서 계산된 연령 구간 |
| `filter` | `NOW\|SOON\|LATER\|ALL` | 선택 | 우선순위 필터 (기본: ALL) |
| `category` | string | 선택 | 카테고리 slug 필터 |

**응답 예시**

```json
{
  "ageMonths": 7,
  "ageGroupSlug": "6-12m",
  "filter": "NOW",
  "total": 12,
  "items": [
    {
      "id": 42,
      "nameKo": "이유식 의자",
      "category": { "slug": "feeding", "nameKo": "수유·이유식" },
      "priority": "NOW",
      "necessity": "ESSENTIAL",
      "reason": "7개월은 이유식을 본격적으로 시작하는 시기입니다.",
      "developStage": "이유식 2단계 시작",
      "priceRange": "30,000~80,000원",
      "isPopular": true,
      "coupangUrl": "https://coupang.com/..."
    }
  ]
}
```

### 개월 수 계산 유틸리티

```typescript
// lib/age-calculator.ts

export function calcAgeMonths(birthdate: Date, today: Date = new Date()): number {
  const years = today.getFullYear() - birthdate.getFullYear();
  const months = today.getMonth() - birthdate.getMonth();
  let totalMonths = years * 12 + months;
  if (today.getDate() < birthdate.getDate()) totalMonths--;
  return Math.max(0, totalMonths);
}

export function getAgeGroupSlug(ageMonths: number): string {
  if (ageMonths < 3)  return "0-3m";
  if (ageMonths < 6)  return "3-6m";
  if (ageMonths < 12) return "6-12m";
  if (ageMonths < 18) return "12-18m";
  if (ageMonths < 24) return "18-24m";
  return "24-36m";
}
```

---

## 5. 추천 엔진 설계

### Phase 1 — Rule-Based 엔진

**로직 흐름**

```
[클라이언트]
  생년월일 입력 (localStorage 저장)
  → calcAgeMonths() → getAgeGroupSlug()
  → GET /api/recommendations?ageGroup=6-12m&filter=NOW

[서버]
  ageGroupSlug 수신
  → DB 쿼리: LifecycleRule WHERE ageGroupSlug = '6-12m'
  → priority 분류 (NOW / SOON / LATER)
  → necessity 필터 (ESSENTIAL / SITUATIONAL / OPTIONAL / RENT_OR_USED)
  → finalScore 정렬
  → 응답 반환 (reason, developStage 포함)

[클라이언트]
  추천 카드 렌더링
  → "왜 지금?" 발달 근거 문구 표시 (reason + developStage)
  → "바로 구매" 쿠팡 파트너스 링크 버튼 표시
```

**발달 단계(developStage) 값 기준:**

| 연령 구간 | 대표 발달 이정표 | 기준 문구 예시 |
|---------|--------------|-------------|
| 0-3m | 청각 반응, 수유 리듬 형성 | "신생아기: 수유 리듬이 잡히는 시기예요" |
| 3-6m | 목 가누기, 손 뻗기 | "목을 가눌 수 있어 바운서 활용 시작" |
| 6-12m | 앉기, 이유식 시작 | "이유식 2단계 시작, 앉기 가능" |
| 12-18m | 서기, 첫걸음 | "걸음마 시작: 안전 환경 필요" |
| 18-24m | 달리기, 소근육 발달 | "활발한 탐색기: 신체 놀이 필요" |
| 24-36m | 언어 폭발, 역할 놀이 | "언어 발달 급속기: 상호작용 놀이 권장" |

**추천 스코어링 공식**

```
finalScore = (necessity_weight × 0.7) + (popularityScore × 0.3)

necessity_weight:
  ESSENTIAL    = 1.0
  SITUATIONAL  = 0.7
  OPTIONAL     = 0.4
  RENT_OR_USED = 0.3
```

> **Phase 1 참고:** 인기 데이터(네이버 쇼핑인사이트) 연동 전까지 `popularityScore` 기본값 = **0.5** 로 고정. 사실상 necessity_weight 기준으로만 정렬됨. 인기 연동(Phase 3)이 완료된 후 실제 값으로 교체.

**구현 예시**

```typescript
// lib/recommendation-engine.ts
// 생년월일 → 개월 수 계산은 클라이언트(app/onboarding/page.tsx)에서 수행.
// 이 함수는 서버에서 ageGroupSlug만 받아서 DB 쿼리.

import { prisma } from "@/lib/prisma";

export async function getRecommendations({
  ageGroupSlug,
  filter = "ALL",
  categorySlug,
}: {
  ageGroupSlug: string;  // 클라이언트에서 전달된 연령 구간
  filter?: "NOW" | "SOON" | "LATER" | "ALL";
  categorySlug?: string;
}) {
  // ageGroupSlug → ageMinMonths/ageMaxMonths 매핑
  const ageRangeMap: Record<string, { min: number; max: number }> = {
    "0-3m":   { min: 0,  max: 2  },
    "3-6m":   { min: 3,  max: 5  },
    "6-12m":  { min: 6,  max: 11 },
    "12-18m": { min: 12, max: 17 },
    "18-24m": { min: 18, max: 23 },
    "24-36m": { min: 24, max: 35 },
  };
  const { min: ageMin, max: ageMax } = ageRangeMap[ageGroupSlug] ?? { min: 0, max: 35 };
  const ageMonths = ageMin; // 구간 대표값 (최솟값 기준)

  const rules = await prisma.lifecycleRule.findMany({
    where: {
      ageMinMonths: { lte: ageMonths },
      ageMaxMonths: { gte: ageMonths },
      ...(filter !== "ALL" ? { priority: filter } : {}),
      product: {
        isActive: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
    },
    include: {
      product: { include: { category: true, safetyInfo: true } },
    },
    orderBy: [{ sortOrder: "asc" }],
  });

  return rules;
}
```

### GA4 커스텀 이벤트 명세

서비스 핵심 지표 수집을 위해 아래 이벤트를 GA4에 전송.

| 이벤트명 | 발생 시점 | 주요 파라미터 |
|---------|---------|------------|
| `onboarding_completed` | 생년월일 입력 완료 후 홈 진입 시 | `age_group` |
| `recommendation_viewed` | 추천 카드 화면 노출 시 | `age_group`, `filter`, `item_count` |
| `product_detail_viewed` | 상품 상세 페이지 진입 시 | `product_id`, `category_slug` |
| `external_link_clicked` | 쿠팡 파트너스 링크 클릭 시 | `product_id`, `age_group` |
| `checklist_status_changed` | 체크리스트 상태 변경 시 | `product_id`, `status` |
| `filter_changed` | 지금/곧/아직 탭 전환 시 | `filter_type`, `value` |

---

### Phase 3 — 하이브리드 추천 엔진 (예정)

| 단계 | 방식 | 목적 |
|------|------|------|
| 콘텐츠 기반 필터링 | 상품 메타데이터 유사도 | 새 상품 콜드 스타트 해결 |
| 협업 필터링 | 사용자 체크리스트 패턴 | "비슷한 아이를 가진 부모들이 함께 산 것" |
| LightGBM 순위 모델 | 클릭/구매 데이터 학습 | 개인화 순위 최적화 |

> **Phase 3 전환 조건:** MAU 1,000명 이상 + 체크리스트 데이터 5,000건 이상 축적 시

---

## 6. 외부 API 연동 명세

### 연동 API 전체 목록

| API | 용도 | 한도 | 비용 |
|-----|------|------|------|
| 네이버 쇼핑 검색 API | 상품 가격·링크 | 25,000회/일 | 무료 |
| 네이버 쇼핑인사이트 API | 인기/트렌드 | 1,000회/일 | 무료 |
| SafetyKorea Open API | KC인증, 리콜 정보 | — | 무료 (승인 필요) |
| 쿠팡 파트너스 API | 상품 검색 + 수익화 | — | 무료 (승인 필요) |
| data.go.kr (KOSIS) | 인구통계 | — | 무료 |

### 캐시 정책

| 데이터 | 캐시 만료 |
|--------|---------|
| 네이버 쇼핑 가격 | 24시간 |
| 인기도 스코어 | 48시간 |
| 안전 정보 (KC/리콜) | 7일 |

### 환경변수 목록 (.env.local)

```bash
# DB
DATABASE_URL="postgresql://user:password@host:5432/ddokddok"

# Naver API
NAVER_CLIENT_ID="..."
NAVER_CLIENT_SECRET="..."

# Coupang Partners
COUPANG_ACCESS_KEY="..."
COUPANG_SECRET_KEY="..."

# SafetyKorea
SAFETY_KOREA_API_KEY="..."

# OpenAI (Phase 2)
OPENAI_API_KEY="..."

# AWS
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="ddokddok-assets"
AWS_REGION="ap-northeast-2"
```

> ⚠️ `.env.local` 파일은 절대 Git에 커밋하지 마세요.

---

## 7. 데이터 수집 파이프라인

### 크롤링 파이프라인 구조

```
[맘맘 사이트]      [네이버 쇼핑]    [SafetyKorea]
      │                  │                │
      ▼                  ▼                ▼
[Selenium/BS4]   [Naver Search API] [공공데이터 API]
      │
      ▼
[Pandas 정제]
- 중복 제거
- 가격 정규화
- 카테고리 매핑
      │
      ▼
[DB 업로드] prisma db seed
      │
      ▼
[AWS S3 백업]
```

### 이미 보유한 데이터 활용 (맘맘 크롤링 1.9MB)

| 파일 | 데이터 | 활용 |
|------|--------|------|
| `mom_mom_ranking.json` | 69카테고리, 449개 상품 | 초기 상품 DB 기반 |
| `mom_mom_tip.json` | 연령별 육아 가이드 | 추천 이유 문구 참고 |
| `ranking_structured.json` | 카테고리→상품 매핑 | 카테고리 구조 설계 참고 |

### 배치 갱신 스케줄

| 데이터 | 갱신 주기 | 방법 |
|--------|----------|------|
| 네이버 가격 | 24시간 | API Cache 만료 시 자동 |
| 인기도 스코어 | 48시간 | 배치 스크립트 |
| 안전 정보 | 7일 | 배치 스크립트 |
| 상품 DB | 분기별 | 수동 업데이트 |

---

## 8. 보안 & 법적 고려사항

### 보안 체크리스트

| 항목 | 조치 |
|------|------|
| 외부 API 키 노출 방지 | 모든 외부 API 호출을 서버사이드(API Routes)에서만 처리 |
| .env 파일 Git 제외 | `.gitignore`에 `.env*` 추가 |
| SQL Injection 방지 | Prisma ORM 사용 (파라미터 자동 이스케이프) |
| XSS 방지 | Next.js 기본 이스케이프 처리 |
| HTTPS 강제 | Vercel 배포 시 기본 적용 |

### 개인정보 처리 방침

| 항목 | MVP 처리 방식 | Phase 2 이후 |
|------|-------------|-------------|
| 생년월일 | 브라우저 로컬스토리지만 저장 | 암호화 후 서버 저장 |
| 체크리스트 | 로컬스토리지 | 로그인 후 서버 동기화 |
| 행동 로그 | GA4 익명 통계만 | 동의 기반 수집 |

### 법적 준수 사항

| 법령 | 의무 | 대응 |
|------|------|------|
| 개인정보보호법 | 수집 최소화 | MVP 최소 수집 원칙 |
| 전자상거래법 | 광고 표시 의무 | 쿠팡 링크에 "광고" 배지 |
| 저작권법 | 크롤링 이용 제한 | robots.txt 확인 + 이용약관 검토 |
| 아동복지법 | 의료 조언 오해 방지 | "참고용 정보" 면책 문구 |

---

## 9. 배포 & 인프라

### 인프라 구성

```
[GitHub Repository]
       │ Push to main
       ▼
[GitHub Actions CI/CD]
- 타입 체크 (tsc)
- 린트 (ESLint)
- Prisma 마이그레이션
       │
       ├──► [Vercel] Next.js 앱 (프론트 + API)
       │
       └──► [AWS RDS] PostgreSQL 15 (서울 리전)
```

### 월 예상 비용 (MVP)

| 서비스 | 플랜 | 월 비용 |
|--------|------|--------|
| Vercel | Hobby (무료) | $0 |
| AWS RDS t3.micro | On-demand | ~$15 |
| AWS S3 | 5GB 이하 | ~$1 |
| 네이버/SafetyKorea API | 무료 | $0 |
| **합계** | | **~$17/월** |

---

## 10. 개발 우선순위 & 단계별 구현 계획

### 프로젝트 디렉토리 구조

```
ddokddok/
├── app/
│   ├── page.tsx                    # 온보딩
│   ├── home/page.tsx               # 홈 대시보드
│   ├── category/[slug]/page.tsx    # 카테고리 상세
│   ├── product/[id]/page.tsx       # 상품 상세
│   ├── checklist/page.tsx          # 체크리스트
│   └── api/
│       ├── recommendations/route.ts
│       ├── categories/route.ts
│       └── products/[id]/route.ts
├── components/
│   ├── ui/                         # shadcn/ui 컴포넌트
│   ├── ProductCard.tsx
│   ├── CategoryFilter.tsx
│   └── AgeGroupTabs.tsx
├── lib/
│   ├── prisma.ts
│   ├── age-calculator.ts
│   └── recommendation-engine.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── scripts/
    └── process_mammam.py           # 맘맘 데이터 정제
```

### Phase 1 — 코어 엔진 (1~2개월)

> **v1 목표:** 생년월일 입력 → 발달 근거 추천 → 쿠팡 링크로 구매 연결까지 작동하는 최소 버전

| 주차 | 작업 | 산출물 |
|------|------|--------|
| Week 1~2 | 프로젝트 셋업 (Next.js + Prisma + DB) | 배포 가능 빈 앱 |
| **Week 3~4** | **추천 데이터 72개 입력 (lifecycle_rules seed CSV 완성)** | **seed 파일 = 핵심 자산** |
| Week 5~6 | 온보딩 + 홈 대시보드 + 추천 API 연결 | 추천 작동 확인 |
| Week 7~8 | 상품 상세 + "바로 구매" 버튼 + 체크리스트 + 모바일 QA | MVP 배포 |

> ⚠️ **Week 3~4 seed 데이터 입력이 가장 중요한 작업.** 이 데이터가 없으면 코드가 있어도 추천 품질이 없음. 발달이론 근거(reason + developStage) + 쿠팡 URL 포함.

### Phase 2 — 상품 DB & 외부 연동 (3~4개월)

| 작업 | 비고 |
|------|------|
| 네이버 쇼핑 API 연동 | 실시간 가격 조회 |
| 10개 세부 카테고리 확장 | v1의 4개 상위에서 확장 |
| 추천 이유 문구 자동 생성 | GPT API 활용 |
| 회원가입/로그인 + 체크리스트 서버 동기화 | Phase 2 이후 |

### Phase 3 — 고도화 (5~6개월)

| 작업 | 비고 |
|------|------|
| SafetyKorea API 연동 | KC 인증, 리콜 자동 배지 |
| 쇼핑인사이트 인기 랭킹 | 트렌드 스코어 실제값 |
| 협업 필터링 PoC | MAU 1,000명 + 데이터 5,000건 이상 시 |
| 공동구매/출산예정일 모드 검토 | 파트너십 확보 후 결정 |

### 마일스톤 & 체크포인트

| 마일스톤 | 완료 기준 | 예상 시점 |
|---------|---------|---------|
| M1: 기술 셋업 완료 | Next.js 배포 + DB 연결 확인 | Week 2 |
| M2: 데이터 시드 완료 | 72개 추천 항목 DB 입력 | Week 4 |
| M3: MVP 내부 테스트 | 5명 테스트 사용자 피드백 | Week 7 |
| M4: MVP 공개 배포 | 초대 링크 공유 | Week 8 |
| M5: Phase 2 완료 | 체크리스트 + 가격 연동 | Month 4 |
| M6: Phase 3 완료 | 안전 정보 + AI 고도화 | Month 6 |

### 테스트 전략

핵심 로직의 경계값 테스트를 Phase 1 배포 전에 반드시 통과해야 한다.

**1. 개월 수 계산 (`calcAgeMonths`) 경계값**

| 케이스 | 생년월일 | 오늘 | 기대값 |
|-------|---------|------|-------|
| 월말 아이 | 2025-01-31 | 2025-02-28 | 0개월 |
| 윤년 | 2024-02-29 | 2025-02-28 | 11개월 |
| 생일 당일 | 2025-01-15 | 2025-04-15 | 3개월 |
| 생일 하루 전 | 2025-01-15 | 2025-04-14 | 2개월 |

**2. 연령 구간 매핑 (`getAgeGroupSlug`) 경계값**

| 케이스 | 개월 수 | 기대 구간 |
|-------|--------|--------|
| 구간 경계 하한 | 3개월 0일 | `3-6m` |
| 구간 경계 직전 | 2개월 30일 | `0-3m` |
| 최대 | 36개월 | `24-36m` |

**3. 추천 정렬 스코어 검증**

| necessity | popularityScore | finalScore | 순위 기대 |
|----------|----------------|-----------|---------|
| ESSENTIAL (1.0) | 0.5 (기본) | 0.85 | 1위 |
| SITUATIONAL (0.7) | 0.5 (기본) | 0.64 | 2위 |
| OPTIONAL (0.4) | 0.5 (기본) | 0.43 | 3위 |

---

### Claude Code 활용 가이드

AI 코딩 시 효과적인 지시 패턴:

```
# 컴포넌트 생성 예시
"ProductCard 컴포넌트를 만들어줘.
Props: { product: Product, rule: LifecycleRule }
- 상품명, 카테고리 배지, necessity 배지(필수/상황형/생략/중고) 표시
- Tailwind CSS, shadcn/ui Card 사용
- 쿠팡 링크 버튼 포함 (새 탭)"

# API 라우트 생성 예시
"app/api/recommendations/route.ts를 만들어줘.
lib/recommendation-engine.ts의 getRecommendations 함수를 사용하고,
TRD 4장의 API 명세대로 요청/응답을 처리해줘."

# 버그 수정 예시
"개월 수 계산이 월말 아이에게 1개월 오차가 난다.
lib/age-calculator.ts의 calcAgeMonths를 수정해줘."
```

---

*버전 1.2 — 똑똑한 엄마 팀 (팀 피드백 + GPT 검토 반영)*

*이 TRD는 Claude Code를 활용한 AI 주도 개발을 전제로 작성되었습니다.
각 섹션의 코드 예시는 Claude Code에 직접 붙여넣어 구현 지시 프롬프트로 활용할 수 있습니다.*
