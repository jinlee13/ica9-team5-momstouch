import fs from 'fs';
const file = 'data/products.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.lifecycle_rules.forEach(p => {
  // 1. 속싸개 스와들업: 0~1 -> 0~3
  if (p.id === '0-1m-sleep-2' && p.name.includes('속싸개')) {
    p.ageMaxMonths = 3;
  }
  // 2. 모빌 (흑백/컬러): 0~1 -> 0~3
  if (p.id === '0-1m-play-3' && p.name.includes('모빌')) {
    p.ageMaxMonths = 3;
  }
  // 3. 신생아용 바구니형 유모차: 0~1 -> 0~6
  if (p.id === '0-1m-outdoor-3' && p.name.includes('바구니형 유모차')) {
    p.ageMaxMonths = 6;
  }
  // 4. 사운드북: 6~12 -> 3~12
  if (p.id === '6-12m-play-1' && p.name.includes('사운드북')) {
    p.ageMinMonths = 3;
    p.ageMaxMonths = 12;
  }
});

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('✅ products.json age ranges updated.');
