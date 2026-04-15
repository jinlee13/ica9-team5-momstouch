import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, '../data/products.json'), 'utf8'))

const supabase = createClient(
  'https://skjfosoymcgsbqlqntaz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function migrate() {
  console.log('🚀 Supabase 마이그레이션 시작...')

  // 1. 제품 데이터 업로드
  const products = data.lifecycle_rules.map((p) => ({
    id: p.id,
    name: p.name,
    category_slug: p.categorySlug,
    category_name: p.categoryName,
    age_group_slug: p.ageGroupSlug,
    age_min_months: p.ageMinMonths,
    age_max_months: p.ageMaxMonths,
    necessity: p.necessity,
    reason: p.reason,
    develop_stage: p.developStage,
    price_range: p.priceRange,
    kc_certified: p.kcCertified,
    ddok_pillars: p.ddokPillars,
    theory_note: p.theoryNote,
    top_products: p.topProducts || null,
  }))

  const { error: productsError } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'id' })

  if (productsError) {
    console.error('❌ 제품 업로드 실패:', productsError.message)
  } else {
    console.log(`✅ 제품 ${products.length}개 업로드 완료`)
  }

  // 2. DDOK 프레임워크 업로드
  const ddokRows = Object.entries(data.ddok_framework).map(([slug, val]) => ({
    age_group_slug: slug,
    label: val.label,
    subtitle: val.subtitle,
    reason_template: val.reason_template,
  }))

  const { error: ddokError } = await supabase
    .from('ddok_frameworks')
    .upsert(ddokRows, { onConflict: 'age_group_slug' })

  if (ddokError) {
    console.error('❌ DDOK 업로드 실패:', ddokError.message)
  } else {
    console.log(`✅ DDOK 프레임워크 ${ddokRows.length}개 업로드 완료`)
  }

  console.log('🎉 마이그레이션 완료!')
}

migrate()
