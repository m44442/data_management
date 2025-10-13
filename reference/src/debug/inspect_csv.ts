import * as fs from 'fs';
import iconv from 'iconv-lite';

const filepath = process.argv[2] || 'data/raw/estat_2021.csv';

console.log(`=== Inspecting ${filepath} ===\n`);

if (!fs.existsSync(filepath)) {
  console.error(`File not found: ${filepath}`);
  process.exit(1);
}

// Shift-JISで読み込み
const buffer = fs.readFileSync(filepath);
const content = iconv.decode(buffer, 'shift_jis');

// 最初の20行を表示
const lines = content.split('\n').slice(0, 20);

lines.forEach((line, i) => {
  console.log(`${i}: ${line}`);
});

console.log('\n=== End of preview ===');