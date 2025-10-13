import * as fs from 'fs';
import * as path from 'path';
import { RetailData } from '../data/types';

interface PeriodChange {
  city: string;
  period: string;
  years: string;
  establishments: ChangeMetrics;
  employees: ChangeMetrics;
  sales: ChangeMetrics;
  salesArea: ChangeMetrics;
}

interface ChangeMetrics {
  before: number;
  after: number;
  change: number;
  changeRate: number;
  annualRate: number;  // 年平均変化率
}

function calculateChange(before: number, after: number, years: number): ChangeMetrics {
  const change = after - before;
  const changeRate = (change / before) * 100;
  const annualRate = changeRate / years;  // 年平均変化率
  
  return { 
    before, 
    after, 
    change, 
    changeRate,
    annualRate
  };
}

function analyzePeriods() {
  console.log('=== 期間別変化率分析 ===\n');
  
  // データ読み込み
  const dataPath = path.join(__dirname, '../../data/processed/retail_data.json');
  const data: RetailData[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  const results: PeriodChange[] = [];
  
  // 各都市について分析
  ['高松市', '宮崎市'].forEach(city => {
    const cityData = data.filter(d => d.city === city).sort((a, b) => a.year - b.year);
    
    console.log(`\n🏙️  ${city}の期間別分析:`);
    console.log('─'.repeat(100));
    
    // 期間1: 2007→2012（短期：大型店出店直後の影響）
    const data2007 = cityData.find(d => d.year === 2007);
    const data2012 = cityData.find(d => d.year === 2012);
    
    if (data2007 && data2012) {
      const period1: PeriodChange = {
        city,
        period: '短期（出店直後）',
        years: '2007→2012',
        establishments: calculateChange(data2007.establishments, data2012.establishments, 5),
        employees: calculateChange(data2007.employees, data2012.employees, 5),
        sales: calculateChange(data2007.sales, data2012.sales, 5),
        salesArea: calculateChange(data2007.salesArea!, data2012.salesArea!, 5)
      };
      results.push(period1);
      
      printPeriodResult(period1);
    }
    
    // 期間2: 2012→2021（長期：再開発等の効果）
    const data2021 = cityData.find(d => d.year === 2021);
    
    if (data2012 && data2021) {
      const period2: PeriodChange = {
        city,
        period: '長期（再開発効果）',
        years: '2012→2021',
        establishments: calculateChange(data2012.establishments, data2021.establishments, 9),
        employees: calculateChange(data2012.employees, data2021.employees, 9),
        sales: calculateChange(data2012.sales, data2021.sales, 9),
        salesArea: calculateChange(data2012.salesArea!, data2021.salesArea!, 9)
      };
      results.push(period2);
      
      printPeriodResult(period2);
    }
    
    // 全期間: 2007→2021
    if (data2007 && data2021) {
      const periodTotal: PeriodChange = {
        city,
        period: '全期間',
        years: '2007→2021',
        establishments: calculateChange(data2007.establishments, data2021.establishments, 14),
        employees: calculateChange(data2007.employees, data2021.employees, 14),
        sales: calculateChange(data2007.sales, data2021.sales, 14),
        salesArea: calculateChange(data2007.salesArea!, data2021.salesArea!, 14)
      };
      results.push(periodTotal);
      
      printPeriodResult(periodTotal);
    }
  });
  
  // 両市の比較表
  console.log('\n\n=== 🔥 両市の比較（最重要）===\n');
  printComparisonTable(results);
  
  // JSONで保存
  const outputDir = path.join(__dirname, '../../results/tables');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'period_comparison.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
  
  console.log(`\n✅ 結果を保存: results/tables/period_comparison.json`);
  
  // Markdown表形式でも保存
  generateMarkdownTable(results);
}

function printPeriodResult(period: PeriodChange) {
  console.log(`\n【${period.period}】${period.years}`);
  console.log('指標              | 期間前    | 期間後    | 変化      | 変化率    | 年平均');
  console.log('─'.repeat(100));
  
  const metrics: Array<[string, ChangeMetrics]> = [
    ['事業所数        ', period.establishments],
    ['従業者数        ', period.employees],
    ['販売額(百万円)  ', period.sales],
    ['売場面積(㎡)    ', period.salesArea]
  ];
  
  metrics.forEach(([label, metrics]) => {
    console.log(
      `${label} | ` +
      `${metrics.before.toLocaleString().padStart(9)} | ` +
      `${metrics.after.toLocaleString().padStart(9)} | ` +
      `${metrics.change > 0 ? '+' : ''}${metrics.change.toLocaleString().padStart(9)} | ` +
      `${formatChangeRate(metrics.changeRate)} | ` +
      `${formatChangeRate(metrics.annualRate)}/年`
    );
  });
}

function formatChangeRate(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`.padStart(8);
}

function printComparisonTable(results: PeriodChange[]) {
  const periods = ['短期（出店直後）', '長期（再開発効果）', '全期間'];
  
  // 販売額の変化率で比較
  console.log('【販売額の変化率比較】');
  console.log('期間              | 高松市      | 宮崎市      | 差分(pt)');
  console.log('─'.repeat(70));
  
  periods.forEach(periodName => {
    const takamatsu = results.find(r => r.city === '高松市' && r.period === periodName);
    const miyazaki = results.find(r => r.city === '宮崎市' && r.period === periodName);
    
    if (takamatsu && miyazaki) {
      const diff = takamatsu.sales.changeRate - miyazaki.sales.changeRate;
      console.log(
        `${periodName.padEnd(18)} | ` +
        `${formatChangeRate(takamatsu.sales.changeRate)} | ` +
        `${formatChangeRate(miyazaki.sales.changeRate)} | ` +
        `${diff > 0 ? '+' : ''}${diff.toFixed(1).padStart(8)}`
      );
    }
  });
  
  // 事業所数の変化率で比較
  console.log('\n【事業所数の変化率比較】');
  console.log('期間              | 高松市      | 宮崎市      | 差分(pt)');
  console.log('─'.repeat(70));
  
  periods.forEach(periodName => {
    const takamatsu = results.find(r => r.city === '高松市' && r.period === periodName);
    const miyazaki = results.find(r => r.city === '宮崎市' && r.period === periodName);
    
    if (takamatsu && miyazaki) {
      const diff = takamatsu.establishments.changeRate - miyazaki.establishments.changeRate;
      console.log(
        `${periodName.padEnd(18)} | ` +
        `${formatChangeRate(takamatsu.establishments.changeRate)} | ` +
        `${formatChangeRate(miyazaki.establishments.changeRate)} | ` +
        `${diff > 0 ? '+' : ''}${diff.toFixed(1).padStart(8)}`
      );
    }
  });
  
  // 重要な発見を強調
  console.log('\n🔥 重要な発見:');
  
  const takLong = results.find(r => r.city === '高松市' && r.period === '長期（再開発効果）');
  const miyLong = results.find(r => r.city === '宮崎市' && r.period === '長期（再開発効果）');
  
  if (takLong && miyLong) {
    const salesDiff = takLong.sales.changeRate - miyLong.sales.changeRate;
    console.log(`  • 長期（2012→2021）の販売額変化率: 高松${formatChangeRate(takLong.sales.changeRate)}, 宮崎${formatChangeRate(miyLong.sales.changeRate)}`);
    console.log(`  • 差は${salesDiff.toFixed(1)}ポイント → 高松市の丸亀町再生が効果を発揮`);
  }
}

function generateMarkdownTable(results: PeriodChange[]) {
  const outputPath = path.join(__dirname, '../../results/tables/period_comparison.md');
  
  let markdown = '# 期間別変化率分析\n\n';
  
  ['高松市', '宮崎市'].forEach(city => {
    const cityResults = results.filter(r => r.city === city);
    
    markdown += `## ${city}\n\n`;
    markdown += '| 期間 | 指標 | 期間前 | 期間後 | 変化 | 変化率 | 年平均 |\n';
    markdown += '|------|------|--------|--------|------|--------|--------|\n';
    
    cityResults.forEach(period => {
      const metrics: Array<[string, ChangeMetrics]> = [
        ['事業所数', period.establishments],
        ['従業者数', period.employees],
        ['販売額', period.sales],
        ['売場面積', period.salesArea]
      ];
      
      metrics.forEach(([label, m]) => {
        markdown += `| ${period.period} (${period.years}) | ${label} | ${m.before.toLocaleString()} | ${m.after.toLocaleString()} | ${m.change > 0 ? '+' : ''}${m.change.toLocaleString()} | ${m.changeRate > 0 ? '+' : ''}${m.changeRate.toFixed(1)}% | ${m.annualRate > 0 ? '+' : ''}${m.annualRate.toFixed(2)}%/年 |\n`;
      });
    });
    
    markdown += '\n';
  });
  
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`\n📄 Markdown表を保存: ${outputPath}`);
}

// 実行
if (require.main === module) {
  analyzePeriods();
}