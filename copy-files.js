const fs = require('fs');
const path = require('path');

const srcDir = 'c:\\Users\\kaces\\Desktop\\개발앱\\육아템\\ica9-team5-momstouch';
const destDir = 'c:\\Users\\kaces\\Desktop\\개발앱\\육아템\\temp_git_repo';

function copyFile(srcFile, destFile) {
  fs.copyFileSync(path.join(srcDir, srcFile), path.join(destDir, destFile));
  console.log(`Copied ${srcFile}`);
}

copyFile('lib/recommendations.ts', 'lib/recommendations.ts');
copyFile('lib/supabase-queries.ts', 'lib/supabase-queries.ts');
copyFile('data/products.json', 'data/products.json');

// scripts folder might need copy too
const srcScriptsDir = path.join(srcDir, 'scripts');
const destScriptsDir = path.join(destDir, 'scripts');
if (!fs.existsSync(destScriptsDir)) fs.mkdirSync(destScriptsDir);

fs.readdirSync(srcScriptsDir).forEach(file => {
  fs.copyFileSync(path.join(srcScriptsDir, file), path.join(destScriptsDir, file));
});

console.log('All files copied successfully.');
