import fs from 'fs';
const data = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
data.lifecycle_rules.forEach(p => {
  console.log(`[${p.id}] ${p.name}: ${p.ageMinMonths} ~ ${p.ageMaxMonths}`);
});
