// app/api/chat/route.ts
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface RequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  ageMonths: number
}

async function fetchContextProducts(ageMonths: number) {
  const ageMin = Math.max(0, ageMonths - 2)
  const ageMax = ageMonths + 3

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('name, category_name, necessity, reason, develop_stage, price_range, age_min_months, age_max_months')
    .lte('age_min_months', ageMax)
    .gte('age_max_months', ageMin)
    .order('age_min_months', { ascending: true })
    .limit(12)

  if (error || !data) return []
  return data
}

function buildSystemPrompt(ageMonths: number, products: Awaited<ReturnType<typeof fetchContextProducts>>) {
  const necessityMap: Record<string, string> = {
    ESSENTIAL: '필수',
    SITUATIONAL: '상황에 따라',
    OPTIONAL: '선택',
    RENT_OR_USED: '중고·대여 권장',
  }

  const productLines = products
    .map(p =>
      `- [${necessityMap[p.necessity] ?? p.necessity}] ${p.name} (${p.category_name}) | ${p.age_min_months}~${p.age_max_months}개월 | 가격대: ${p.price_range ?? '미정'} | 이유: ${p.reason ?? ''}`
    )
    .join('\n')

  return `당신은 육아용품 추천 전문가 "똑똑이"입니다. 발달 이론(WHO·AAP·K-DST)을 근거로 육아용품을 추천합니다.

현재 아이 개월 수: ${ageMonths}개월

[관련 육아용품 컨텍스트]
${productLines}

답변 규칙:
- 반드시 한국어로 답변하세요
- 추천 상품은 위 컨텍스트 내 상품만 사용하세요
- "왜 지금 필요한지" 발달 근거를 1~2문장으로 설명하세요
- 의료적 진단이나 처방은 하지 마세요
- 답변은 3~5문장으로 간결하게 유지하세요
- 추천 상품명을 **굵게** 표시하세요`
}

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json()
    const { messages, ageMonths } = body

    if (!messages?.length || typeof ageMonths !== 'number') {
      return new Response(JSON.stringify({ error: 'messages와 ageMonths 필수' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const contextProducts = await fetchContextProducts(ageMonths)
    const systemPrompt = buildSystemPrompt(ageMonths, contextProducts)

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 512,
      temperature: 0.7,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('[/api/chat]', error)
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
