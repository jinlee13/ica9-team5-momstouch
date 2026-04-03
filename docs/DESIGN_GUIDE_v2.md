# 베베맵 디자인 가이드

## 프로젝트 개요

**베베맵(BebéMap)**은 인플루언서 광고비 없이 육아용품 판매처와 고객을 직접 연결하는 육아 추천템 웹앱 서비스입니다.

### 핵심 가치
- 발달 단계별 맞춤 추천으로 불필요한 구매 감소
- 판매자 직거래로 합리적인 공구가 제공
- 월령별(0~3개월, 4~6개월, 7~12개월, 13~24개월, 25~36개월) 아이템 추천

---

## 디자인 컨셉

### 키워드
- **따뜻함**: 부모와 아기를 위한 포근한 느낌
- **부드러움**: 둥근 모서리와 그라데이션으로 친근한 이미지
- **신뢰감**: 깔끔하고 전문적인 레이아웃
- **접근성**: 직관적이고 쉬운 UI/UX

---

## 색상 팔레트

### 메인 컬러 (퍼플 톤)

```css
/* Primary - 메인 퍼플 */
--color-primary: #9B7EDE;

/* Accent - 밝은 퍼플 */
--color-accent: #B794F6;

/* Secondary - 보조 퍼플 */
--color-secondary: #C4B5FD;
```

### 사용 가이드

#### Primary (#9B7EDE)
- **용도**: 주요 버튼, 강조 요소, 브랜드 아이덴티티
- **예시**: CTA 버튼, 로고, 활성화된 탭
- **조합**: 흰색 텍스트와 함께 사용

#### Accent (#B794F6)
- **용도**: 그라데이션, 부가 강조, 호버 효과
- **예시**: 그라데이션 배경, 아이콘 배경
- **조합**: Primary와 함께 그라데이션 구성

#### Secondary (#C4B5FD)
- **용도**: 연한 배경, 서브 요소
- **예시**: 카드 배경, 섹션 구분
- **조합**: 투명도를 낮춰 은은한 배경으로 활용

### 중립 컬러

```css
/* Background */
--color-background: #FFFFFF;

/* Card/Surface */
--color-card: #FFFFFF;

/* Foreground (텍스트) */
--color-foreground: #1A1A1A;

/* Muted (보조 텍스트) */
--color-muted-foreground: #6B7280;

/* Border */
--color-border: #E5E7EB;
```

### 그라데이션 패턴

```css
/* 메인 그라데이션 */
background: linear-gradient(to bottom right, #9B7EDE, #B794F6);

/* 부드러운 배경 그라데이션 */
background: linear-gradient(to bottom right, 
  rgba(155, 126, 222, 0.05), 
  rgba(183, 148, 246, 0.05)
);

/* 히어로 섹션 그라데이션 */
background: linear-gradient(to bottom right, 
  rgba(155, 126, 222, 0.05) 0%, 
  rgba(183, 148, 246, 0.05) 50%, 
  rgba(196, 181, 253, 0.1) 100%
);
```

---

## 타이포그래피

### 폰트 패밀리
시스템 기본 폰트 사용 (깔끔하고 읽기 쉬운 한글 지원)

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
  'Noto Sans KR', sans-serif;
```

### 폰트 크기 스케일

| 용도 | 크기 (모바일) | 크기 (데스크톱) | Tailwind 클래스 |
|------|--------------|----------------|-----------------|
| Hero 타이틀 | 2.25rem (36px) | 3.75rem (60px) | `text-4xl md:text-6xl` |
| 섹션 타이틀 | 1.875rem (30px) | 2.25rem (36px) | `text-3xl md:text-4xl` |
| 카드 타이틀 | 1.25rem (20px) | 1.5rem (24px) | `text-xl md:text-2xl` |
| 본문 (대) | 1.125rem (18px) | 1.25rem (20px) | `text-lg md:text-xl` |
| 본문 (기본) | 1rem (16px) | 1rem (16px) | `text-base` |
| 본문 (소) | 0.875rem (14px) | 0.875rem (14px) | `text-sm` |
| 캡션 | 0.75rem (12px) | 0.75rem (12px) | `text-xs` |

### 폰트 무게

```css
/* 일반 */
font-weight: 400; /* font-normal */

/* 중간 강조 */
font-weight: 600; /* font-semibold */

/* 강한 강조 */
font-weight: 700; /* font-bold */
```

### Line Height

```css
/* 타이틀 */
line-height: 1.2; /* leading-tight */

/* 본문 */
line-height: 1.625; /* leading-relaxed */
```

---

## 레이아웃 & 스페이싱

### 컨테이너

```css
/* 최대 너비 */
max-width: 1280px; /* max-w-7xl */

/* 패딩 */
padding: 1rem; /* px-4 (모바일) */
padding: 1rem; /* px-4 (데스크톱) */
```

### 섹션 간격

```css
/* 섹션 상하 여백 (모바일) */
padding: 3rem 0; /* py-12 */

/* 섹션 상하 여백 (데스크톱) */
padding: 4rem 0; /* py-16 */

/* 섹션 하단 마진 */
margin-bottom: 4rem; /* mb-16 */
```

### 그리드 시스템

```css
/* 2열 그리드 (모바일) */
grid-template-columns: repeat(2, 1fr);

/* 3열 그리드 (데스크톱) */
grid-template-columns: repeat(3, 1fr); /* md:grid-cols-3 */

/* 그리드 간격 */
gap: 1.5rem; /* gap-6 */
```

---

## 둥근 모서리 (Border Radius)

### 기본 원칙
베베맵은 **부드럽고 친근한 느낌**을 위해 모든 요소에 둥근 모서리를 적용합니다.

### Border Radius 스케일

```css
/* 기본 카드, 버튼 */
border-radius: 1.25rem; /* rounded-[1.25rem] / rounded-xl */

/* 대형 카드, 섹션 */
border-radius: 1.5rem; /* rounded-[1.5rem] / rounded-2xl */

/* 매우 큰 요소 */
border-radius: 2rem; /* rounded-[2rem] / rounded-3xl */

/* 완전한 원형 (아이콘, 뱃지) */
border-radius: 9999px; /* rounded-full */
```

### 적용 가이드

| 컴포넌트 | Border Radius | Tailwind 클래스 |
|---------|---------------|-----------------|
| 버튼 (CTA) | 9999px | `rounded-full` |
| 카드 | 1.25rem | `rounded-xl` |
| 이미지 카드 | 1.5rem | `rounded-2xl` |
| 섹션 배경 | 2rem | `rounded-3xl` |
| 뱃지/태그 | 9999px | `rounded-full` |
| Input | 1rem | `rounded-lg` |
| 아이콘 배경 | 0.75rem~1rem | `rounded-xl` |

---

## 그림자 (Shadows)

### 그림자 레벨

```css
/* 기본 (Default) */
box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); /* shadow */

/* 강조 (Medium) */
box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); /* shadow-lg */

/* 강한 강조 (Strong) */
box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); /* shadow-xl */

/* 매우 강한 강조 (Very Strong) */
box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); /* shadow-2xl */
```

### 사용 가이드
- **카드**: `hover:shadow-xl` - 호버 시 상승 효과
- **버튼**: `shadow-lg hover:shadow-xl` - 클릭 유도
- **이미지**: `shadow-2xl` - 깊이감 강조

---

## 컴포넌트

### 버튼

#### Primary Button
```tsx
<Button 
  size="lg" 
  className="rounded-full px-8 py-6 shadow-lg hover:shadow-xl transition-all"
>
  버튼 텍스트
</Button>
```

**특징**:
- 완전한 원형 (`rounded-full`)
- 그림자 효과로 입체감
- 호버 시 그림자 확대

#### Secondary Button
```tsx
<Button 
  variant="outline" 
  size="lg" 
  className="rounded-full px-8 py-6 border-2 hover:bg-primary/5"
>
  버튼 텍스트
</Button>
```

**특징**:
- 테두리만 있는 스타일
- 호버 시 배경 색상 추가

### 카드

#### 기본 카드
```tsx
<Card className="p-6 border-2 hover:shadow-lg transition-shadow rounded-xl">
  {/* 카드 내용 */}
</Card>
```

**특징**:
- 2px 테두리
- 호버 시 그림자 효과
- 둥근 모서리 (1.25rem)

#### 이미지 카드
```tsx
<Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2">
  <div className="relative h-48">
    <img className="w-full h-full object-cover" />
  </div>
  <div className="p-6">
    {/* 카드 내용 */}
  </div>
</Card>
```

**특징**:
- 이미지 영역과 텍스트 영역 분리
- 호버 시 위로 이동 효과 (`-translate-y-1`)
- 이미지는 `object-cover`로 비율 유지

#### 그라데이션 배경 카드
```tsx
<Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 p-8">
  {/* 카드 내용 */}
</Card>
```

**특징**:
- 은은한 그라데이션 배경 (5% 투명도)
- 시각적 구분과 부드러운 느낌

### 뱃지/태그

```tsx
<div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
  <Icon className="w-4 h-4" />
  태그 텍스트
</div>
```

**특징**:
- 완전한 원형 모서리
- 아이콘 + 텍스트 조합
- Primary 색상 10% 배경

### 아이콘 배경

#### 그라데이션 아이콘 배경
```tsx
<div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
  <Icon className="w-7 h-7 text-white" />
</div>
```

**특징**:
- Primary → Accent 그라데이션
- 흰색 아이콘
- 그림자로 입체감

---

## 반응형 디자인

### 브레이크포인트

```css
/* 모바일 퍼스트 */
기본: 0px ~ 767px

/* 태블릿 */
md: 768px ~ 1023px

/* 데스크톱 */
lg: 1024px+
```

### 반응형 패턴

#### 그리드
```tsx
{/* 모바일 2열, 데스크톱 3열 */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-6">
```

#### 플렉스
```tsx
{/* 모바일 세로, 데스크톱 가로 */}
<div className="flex flex-col md:flex-row gap-4">
```

#### 텍스트 크기
```tsx
{/* 모바일 작게, 데스크톱 크게 */}
<h1 className="text-4xl md:text-6xl">
```

#### 패딩
```tsx
{/* 모바일 8, 데스크톱 12 */}
<section className="p-8 md:p-12">
```

---

## 애니메이션 & 트랜지션

### 기본 트랜지션

```css
/* 모든 속성 */
transition: all 0.3s ease;
/* Tailwind: transition-all duration-300 */

/* 그림자만 */
transition: shadow 0.3s ease;
/* Tailwind: transition-shadow */

/* 색상만 */
transition: colors 0.3s ease;
/* Tailwind: transition-colors */
```

### 호버 효과

#### 카드 상승 효과
```tsx
<Card className="hover:-translate-y-1 transition-all duration-300">
```

#### 버튼 확대 효과
```tsx
<Button className="hover:scale-105 transition-all">
```

#### 그림자 강화
```tsx
<div className="shadow-lg hover:shadow-xl transition-shadow">
```

---

## 아이콘

### 아이콘 라이브러리
**Lucide React** 사용

```tsx
import { Heart, ShoppingCart, Star, ArrowRight } from "lucide-react";
```

### 아이콘 크기

| 용도 | 크기 | 클래스 |
|------|------|--------|
| 작은 아이콘 | 16px | `w-4 h-4` |
| 기본 아이콘 | 20px | `w-5 h-5` |
| 중간 아이콘 | 24px | `w-6 h-6` |
| 큰 아이콘 (배경 내) | 28px | `w-7 h-7` |

### 아이콘 색상
- **Primary 강조**: `text-primary`
- **흰색 (배경 위)**: `text-white`
- **기본 텍스트**: `text-foreground`
- **보조 텍스트**: `text-muted-foreground`

---

## 이미지

### 이미지 비율

```css
/* 정사각형 (1:1) */
aspect-ratio: 1 / 1;
/* Tailwind: aspect-square */

/* 16:9 */
aspect-ratio: 16 / 9;
/* Tailwind: aspect-video */
```

### 이미지 처리

```tsx
{/* object-cover로 비율 유지하며 영역 채우기 */}
<img className="w-full h-full object-cover" />

{/* 둥근 모서리 */}
<img className="rounded-2xl" />

{/* 호버 시 확대 */}
<img className="transition-transform duration-300 group-hover:scale-110" />
```

### ImageWithFallback 컴포넌트
이미지 로딩 실패 시 폴백 처리

```tsx
// ⚠️ 아래 경로는 프로젝트 구조에 맞게 수정하세요
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

<ImageWithFallback
  src="이미지URL"
  alt="설명"
  className="w-full h-full object-cover rounded-2xl"
/>
```

---

## 월령별 색상 코드

각 월령대는 퍼플 톤 내에서 미묘한 차이로 구분:

```css
/* 0~3개월 - Primary 기반 */
--color-age-0-3: #9B7EDE;
background: rgba(155, 126, 222, 0.1);
badge-color: #9B7EDE;

/* 4~6개월 - Accent 기반 */
--color-age-4-6: #B794F6;
background: rgba(183, 148, 246, 0.1);
badge-color: #B794F6;

/* 7~12개월 - Secondary 기반 */
--color-age-7-12: #C4B5FD;
background: rgba(196, 181, 253, 0.1);
badge-color: #C4B5FD;

/* 13~24개월 - Primary + Accent 혼합 */
--color-age-13-24: #A98AEA;
background: linear-gradient(to right, rgba(155, 126, 222, 0.1), rgba(183, 148, 246, 0.1));
badge-color: #A98AEA;

/* 25~36개월 - 전체 그라데이션 */
--color-age-25-36: #B794F6;
background: linear-gradient(to right,
  rgba(155, 126, 222, 0.1),
  rgba(183, 148, 246, 0.1),
  rgba(196, 181, 253, 0.15)
);
badge-color: linear-gradient(to right, #9B7EDE, #C4B5FD);
```

---

## 접근성 (Accessibility)

### 색상 대비
- 텍스트와 배경 간 명도 대비 4.5:1 이상 유지
- Primary (#9B7EDE) 위에는 흰색 텍스트 사용

### 포커스 상태
```tsx
{/* 키보드 네비게이션을 위한 포커스 스타일 */}
<button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
```

### 대체 텍스트
```tsx
{/* 모든 이미지에 alt 속성 필수 */}
<img src="..." alt="제품 설명" />

{/* 장식 이미지는 빈 alt */}
<img src="..." alt="" />
```

### 시맨틱 HTML
- `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` 사용
- 헤딩 레벨 순서 유지 (h1 → h2 → h3)

---

## 코드 예시

### 전체 섹션 레이아웃

```tsx
<section className="mb-16">
  <h2 className="text-3xl font-bold mb-8 text-center">
    섹션 제목
  </h2>
  <div className="grid md:grid-cols-3 gap-6">
    {items.map((item) => (
      <Card key={item.id} className="p-6 border-2 hover:shadow-lg transition-shadow">
        {/* 카드 내용 */}
      </Card>
    ))}
  </div>
</section>
```

### 히어로 섹션

```tsx
<section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 py-16 md:py-20">
  <div className="container mx-auto px-4 max-w-7xl">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
          <Icon className="w-4 h-4" />
          뱃지 텍스트
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          메인 타이틀
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          설명 텍스트
        </p>
        <Button size="lg" className="rounded-full px-8 shadow-lg">
          CTA 버튼
        </Button>
      </div>
      <div className="relative">
        {/* 이미지 영역 */}
      </div>
    </div>
  </div>
</section>
```

---

## 디자인 체크리스트

### 모든 컴포넌트에 적용
- [ ] 둥근 모서리 적용 (최소 `rounded-xl`)
- [ ] 호버 효과 추가 (그림자 또는 이동)
- [ ] 트랜지션 적용 (`transition-all duration-300`)
- [ ] 반응형 크기 지정 (`md:`, `lg:` 등)
- [ ] 적절한 간격 유지 (`gap-6`, `mb-8` 등)

### 텍스트 요소
- [ ] 적절한 폰트 크기 사용
- [ ] 명확한 위계 구조 (h1 > h2 > h3)
- [ ] 읽기 쉬운 Line height (`leading-relaxed`)

### 색상 사용
- [ ] Primary 색상은 주요 CTA에만
- [ ] 그라데이션은 배경 요소에
- [ ] 텍스트 대비 확인

### 이미지
- [ ] `object-cover`로 비율 유지
- [ ] `rounded-2xl` 이상 둥근 모서리
- [ ] Alt 텍스트 작성

---

## 브랜드 보이스

### 톤 앤 매너
- **친근함**: 부모들에게 편안하고 친근하게
- **신뢰감**: 전문적이고 정확한 정보 제공
- **따뜻함**: 육아의 어려움을 이해하는 공감
- **간결함**: 복잡하지 않고 쉽게 이해할 수 있는 표현

### 문구 스타일
```text
✅ 좋은 예:
"우리 아이 나이에 딱 맞는 육아용품을 찾아드려요"
"발달 단계별 맞춤 추천으로 불필요한 구매를 줄이고"

❌ 피해야 할 예:
"최고의 육아용품 플랫폼" (과장)
"지금 당장 구매하세요!" (강압적)
```

---

## 마무리

베베맵의 디자인 시스템은 **따뜻함, 부드러움, 신뢰감**을 핵심으로 합니다.

- 모든 요소에 **둥근 모서리(1.25rem 이상)** 적용
- **퍼플 톤 색상 팔레트**로 일관성 유지
- **그라데이션과 그림자**로 깊이감 표현
- **반응형 디자인**으로 모든 디바이스 지원

이 가이드를 따라 일관되고 전문적인 사용자 경험을 제공해주세요.
