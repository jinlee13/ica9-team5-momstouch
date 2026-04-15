-- 1. 제품 테이블
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  category_name TEXT NOT NULL,
  age_group_slug TEXT NOT NULL,
  age_min_months INTEGER NOT NULL,
  age_max_months INTEGER NOT NULL,
  necessity TEXT NOT NULL,
  reason TEXT,
  develop_stage TEXT,
  price_range TEXT,
  kc_certified BOOLEAN DEFAULT FALSE,
  ddok_pillars TEXT[],
  theory_note TEXT,
  top_products JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DDOK 프레임워크 테이블
CREATE TABLE IF NOT EXISTS ddok_frameworks (
  age_group_slug TEXT PRIMARY KEY,
  label TEXT,
  subtitle TEXT,
  reason_template TEXT
);

-- 3. 공개 읽기 허용 (로그인 없이 조회 가능)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ddok_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "누구나 읽기 가능" ON products FOR SELECT USING (true);
CREATE POLICY "누구나 읽기 가능" ON ddok_frameworks FOR SELECT USING (true);
