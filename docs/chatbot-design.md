# 챗봇 기능 설계서

> 작성일: 2026-04-15 | 버전: 1.0 | 상태: 설계 확정

---

## 1. 결정 사항 요약

| 항목 | 결정 |
|------|------|
| **챗봇 역할** | 추천 도우미 + 육아 Q&A + 구매 가이드 (3가지 모두) |
| **입력 방식** | 가이드형 질문으로 시작 → 자유 입력 혼합 |
| **AI 백엔드** | Groq 무료 모델 (llama 계열), MVP 즉시 포함 |
| **UI 위치** | 홈 화면 진입점 배너 + 전 페이지 플로팅 버튼 |
| **대화 히스토리** | 로컬스토리지 저장 (재방문 시 복원) |
| **구현 방식** | RAG — Supabase pgvector |

---

## 2. 시스템 아키텍처

```
[클라이언트]
  홈 배너 버튼 + 플로팅 버튼 → ChatModal (팝업)
  로컬스토리지: 대화 히스토리 저장/복원
        ↓ HTTPS

[Next.js API Route  /api/chat]
  1. 사용자 메시지 + 아이 개월 수 수신
  2. Supabase pgvector — 관련 상품 Top 3~5 검색
  3. 상품 컨텍스트 + 히스토리(최근 10턴) → Groq API
  4. 스트리밍 응답 반환
        ↓

[Supabase PostgreSQL + pgvector]
  lifecycle_rules 테이블에 embedding 컬럼 추가
  72개 seed 데이터 임베딩 사전 1회 생성
```

---

## 3. RAG 데이터 흐름

### 임베딩 생성 (1회 실행)

- seed 데이터 입력 시 `lifecycle_rules` 72개 항목 임베딩 생성
- Groq embedding 또는 무료 OpenAI embedding 사용
- Supabase pgvector 컬럼에 저장

### 매 사용자 질문 처리

1. 질문 텍스트 → 임베딩 변환
2. pgvector cosine similarity → 관련 상품 Top 3~5 검색
3. 검색 결과 + 시스템 프롬프트 + 히스토리(최근 10턴) → Groq LLM
4. 응답 스트리밍 → 클라이언트

---

## 4. 시스템 프롬프트 구조

```
당신은 육아용품 추천 전문가입니다.
현재 아이 개월 수: {ageMonths}개월 ({ageGroup} 발달 단계)

[관련 상품 컨텍스트 — pgvector 검색 결과]
{상품명 / 추천 이유 / 가격대 / 쿠팡 링크}

규칙:
- 발달 단계 근거를 들어 설명하세요
- 상품 추천은 위 컨텍스트 내 상품만 사용하세요
- 쿠팡 링크가 있으면 자연스럽게 포함하세요
- 의료적 조언은 하지 마세요
```

---

## 5. UI 컴포넌트

| 컴포넌트 | 설명 |
|---------|------|
| `HomeChatBanner` | 홈 상단 "AI에게 물어보세요" 진입 버튼 |
| `ChatFloatButton` | 우하단 고정 플로팅 버튼 (전 페이지) |
| `ChatModal` | 팝업 모달 — 메시지 스트리밍 표시 |
| `ChatMessage` | 말풍선 컴포넌트 (user / assistant 구분) |
| `GuidedOpener` | 첫 진입 시 가이드 질문 3개 버튼 표시 |

### GuidedOpener 예시 (첫 진입 화면)

```
💬 무엇이 궁금하세요?

  [지금 개월 수에 필요한 것 추천해줘]
  [이유식 준비 뭐가 필요해?]
  [직접 질문하기 →]
```

---

## 6. 로컬스토리지 구조

```json
{
  "chatHistory": [
    { "role": "user", "content": "...", "timestamp": 1234567890 },
    { "role": "assistant", "content": "...", "timestamp": 1234567891 }
  ],
  "lastUpdated": 1234567891
}
```

> API 요청 시 최근 10턴만 포함 (토큰 절약)

---

## 7. DB 스키마 변경

`lifecycle_rules` 테이블에 `embedding vector(1536)` 컬럼 추가

```sql
-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- embedding 컬럼 추가
ALTER TABLE lifecycle_rules
  ADD COLUMN embedding vector(1536);

-- 유사도 검색 인덱스
CREATE INDEX ON lifecycle_rules
  USING ivfflat (embedding vector_cosine_ops);
```

---

## 8. API 엔드포인트

| 엔드포인트 | 역할 |
|-----------|------|
| `POST /api/chat` | 메시지 수신 → RAG 검색 → Groq 호출 → 스트리밍 응답 |
| `POST /api/embed-seed` | seed 임베딩 생성 (1회용 관리자 엔드포인트) |

---

## 9. 구현 단계

| 단계 | 작업 | 비고 |
|------|------|------|
| Step 1 | Supabase pgvector 설정 + embedding 컬럼 추가 | DB 마이그레이션 |
| Step 2 | `/api/embed-seed` — seed 72개 임베딩 생성 | 1회 실행 |
| Step 3 | `/api/chat` — RAG 검색 + Groq 스트리밍 | 핵심 로직 |
| Step 4 | `ChatModal` + `ChatMessage` UI 컴포넌트 | 프론트엔드 |
| Step 5 | `GuidedOpener` + `HomeChatBanner` | 진입점 |
| Step 6 | `ChatFloatButton` (전 페이지) | 플로팅 |
| Step 7 | 로컬스토리지 히스토리 연동 | UX |
