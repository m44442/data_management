import * as stats from "simple-statistics";

const data = [1, 2, 3, 4, 5];

console.log('=== Test Results ===');
console.log('Mean:', stats.mean(data));
console.log('Median:', stats.median(data));
console.log('Std Dev:', stats.standardDeviation(data));
console.log('\n✅ TypeScript + ts-node is working!');