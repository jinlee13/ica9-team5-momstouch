import fs from 'fs';
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

// 1. replace ageGroupSlug "0-1m" and "1-3m" with "0-3m"
data.lifecycle_rules = data.lifecycle_rules.map(product => {
  if (product.ageGroupSlug === '0-1m' || product.ageGroupSlug === '1-3m') {
    product.ageGroupSlug = '0-3m';
  }
  return product;
});

// 2. update ddok_framework
delete data.ddok_framework['0-1m'];
delete data.ddok_framework['1-3m'];
data.ddok_framework['0-3m'] = {
  label: "0~3개월",
  subtitle: "감각 깨어남과 사회적 미소의 시기",
  reason_template: "이 시기 아이는 피아제 감각운동기 1단계로 반사와 감각을 통해 세상을 탐색합니다. 볼비 애착이론에 따르면 일관된 양육 반응과 주 양육자와의 눈 맞춤이 에릭슨의 신뢰감 형성의 토대가 됩니다."
};

fs.writeFileSync('data/products.json', JSON.stringify(data, null, 2));
console.log('products.json updated successfully.');
