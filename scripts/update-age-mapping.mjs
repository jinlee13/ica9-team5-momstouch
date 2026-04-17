import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function determineAgeMapping(name, categorySub) {
  name = (name || '').toLowerCase();
  categorySub = categorySub || '';

  // 구강케어 확인 강제
  const oralKeywords = ["치약", "칫솔", "치실", "구강"];
  if (oralKeywords.some(k => name.includes(k)) || (name.includes("불소") && !name.includes("무불소"))) {
    categorySub = "구강케어";
  } else if (categorySub === "구강케어") {
    categorySub = "베이비케어";
  }

  // 기저귀
  if (categorySub.includes("기저귀") || name.includes("기저귀")) {
    if (name.includes("nb") || name.includes("신생아") || name.includes("1단계")) return [0, 3];
    if (name.includes("s") || name.includes("소형") || name.includes("2단계")) return [1, 6];
    if (name.includes("3단계")) return [3, 12];
    if (name.includes("4단계")) return [6, 24];
    if (name.includes("팬티형")) return [12, 36];
    if (name.includes("밴드형")) return [0, 12];
    return [0, null];
  }

  // 구강케어
  if (categorySub === "구강케어") {
    if (name.includes("무불소")) return [0, 6];
    if (name.includes("불소")) return [6, null];
    return [6, null];
  }

  // 이유식
  if (name.includes("이유식") || name.includes("미음")) {
    if (name.includes("초기")) return [4, 7];
    if (name.includes("중기")) return [7, 10];
    if (name.includes("후기") || name.includes("완료기")) return [10, 18];
  }

  // 장난감
  if (name.includes("모빌")) return [0, 3];
  if (name.includes("딸랑이") || name.includes("래틀")) return [0, 6];
  if (name.includes("치발기") || name.includes("이앓이")) return [3, 12];

  // 기본값 (min=0, max=null)
  return [0, null];
}

async function main() {
  console.log('Fetching market_products...');
  let allProducts = [];
  let page = 0;
  let pageSize = 1000;
  
  while(true) {
    const { data, error } = await supabase
      .from('market_products')
      .select('id, name, category_sub')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    allProducts.push(...data);
    page++;
  }
  
  console.log(`Fetched ${allProducts.length} items. Updating...`);

  let count = 0;
  for (let i = 0; i < allProducts.length; i += 500) {
    const batch = allProducts.slice(i, i + 500);
    const updates = batch.map(p => {
      const [min, max] = determineAgeMapping(p.name, p.category_sub);
      return {
        id: p.id,
        recommended_age_min: min,
        recommended_age_max: max
      };
    });

    const { error } = await supabase
      .from('market_products')
      .upsert(updates);
      
    if (error) {
      console.error('Batch error:', error);
    } else {
      count += batch.length;
      console.log(`Updated ${count} items...`);
    }
  }
  
  console.log('✅ Done! Age mapping update complete.');
}

main();
