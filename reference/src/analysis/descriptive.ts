import * as fs from "fs";
import * as path from "path";

interface RetailData {
  city: string;
  year: number;
  establishments: number;
  employees: number;
  sales: number;
  salesArea: number;
}

interface CityStats {
  city: string;
  years: number[];
  establishments: {
    mean: number;
    min: number;
    max: number;
    trend: number; // 年平均変化率
  };
  employees: {
    mean: number;
    min: number;
    max: number;
    trend: number;
  };
  sales: {
    mean: number;
    min: number;
    max: number;
    trend: number;
  };
  salesArea: {
    mean: number;
    min: number;
    max: number;
    trend: number;
  };
}

function calculateStats(
  values: number[],
  years: number[]
): {
  mean: number;
  min: number;
  max: number;
  trend: number;
} {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // 線形回帰で年平均変化率を計算
  const n = values.length;
  const sumX = years.reduce((sum, year) => sum + year, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = years.reduce((sum, year, i) => sum + year * values[i], 0);
  const sumX2 = years.reduce((sum, year) => sum + year * year, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const trend = (slope / mean) * 100; // パーセンテージ変化率

  return {
    mean: Math.round(mean),
    min,
    max,
    trend: Math.round(trend * 100) / 100,
  };
}

function formatNumber(num: number): string {
  return num.toLocaleString("ja-JP");
}

function main() {
  console.log("=== 小売業データ記述統計分析 ===\n");

  // データ読み込み
  const dataPath = path.join(
    __dirname,
    "../../data/processed/retail_data.json"
  );

  if (!fs.existsSync(dataPath)) {
    console.error("❌ データファイルが見つかりません:", dataPath);
    process.exit(1);
  }

  const rawData: RetailData[] = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  console.log(`📊 データ読み込み完了: ${rawData.length}レコード\n`);

  // 都市別にデータを整理
  const cities = [...new Set(rawData.map((d) => d.city))];
  const years = [...new Set(rawData.map((d) => d.year))].sort();

  console.log(`🏙️  対象都市: ${cities.join(", ")}`);
  console.log(`📅 対象年次: ${years.join(", ")}年\n`);

  // 都市別統計計算
  const cityStats: CityStats[] = cities.map((city) => {
    const cityData = rawData
      .filter((d) => d.city === city)
      .sort((a, b) => a.year - b.year);
    const cityYears = cityData.map((d) => d.year);

    return {
      city,
      years: cityYears,
      establishments: calculateStats(
        cityData.map((d) => d.establishments),
        cityYears
      ),
      employees: calculateStats(
        cityData.map((d) => d.employees),
        cityYears
      ),
      sales: calculateStats(
        cityData.map((d) => d.sales),
        cityYears
      ),
      salesArea: calculateStats(
        cityData.map((d) => d.salesArea),
        cityYears
      ),
    };
  });

  // 結果出力
  console.log("=== 都市別統計サマリー ===\n");

  cityStats.forEach((stats) => {
    console.log(`🏙️  ${stats.city} (${stats.years.join(", ")}年)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log(`📈 事業所数:`);
    console.log(`   平均: ${formatNumber(stats.establishments.mean)}所`);
    console.log(
      `   範囲: ${formatNumber(stats.establishments.min)} - ${formatNumber(stats.establishments.max)}所`
    );
    console.log(
      `   トレンド: ${stats.establishments.trend > 0 ? "+" : ""}${stats.establishments.trend}%/年\n`
    );

    console.log(`👥 従業者数:`);
    console.log(`   平均: ${formatNumber(stats.employees.mean)}人`);
    console.log(
      `   範囲: ${formatNumber(stats.employees.min)} - ${formatNumber(stats.employees.max)}人`
    );
    console.log(
      `   トレンド: ${stats.employees.trend > 0 ? "+" : ""}${stats.employees.trend}%/年\n`
    );

    console.log(`💰 販売額:`);
    console.log(`   平均: ${formatNumber(stats.sales.mean)}百万円`);
    console.log(
      `   範囲: ${formatNumber(stats.sales.min)} - ${formatNumber(stats.sales.max)}百万円`
    );
    console.log(
      `   トレンド: ${stats.sales.trend > 0 ? "+" : ""}${stats.sales.trend}%/年\n`
    );

    console.log(`🏢 売場面積:`);
    console.log(`   平均: ${formatNumber(stats.salesArea.mean)}㎡`);
    console.log(
      `   範囲: ${formatNumber(stats.salesArea.min)} - ${formatNumber(stats.salesArea.max)}㎡`
    );
    console.log(
      `   トレンド: ${stats.salesArea.trend > 0 ? "+" : ""}${stats.salesArea.trend}%/年\n`
    );
  });

  // 都市間比較
  console.log("=== 都市間比較（最新年: 2021年） ===\n");

  const latest2021 = rawData.filter((d) => d.year === 2021);
  if (latest2021.length > 0) {
    latest2021.forEach((data) => {
      console.log(`🏙️  ${data.city}:`);
      console.log(`   事業所数: ${formatNumber(data.establishments)}所`);
      console.log(`   従業者数: ${formatNumber(data.employees)}人`);
      console.log(`   販売額: ${formatNumber(data.sales)}百万円`);
      console.log(`   売場面積: ${formatNumber(data.salesArea)}㎡`);
      console.log(
        `   1事業所当たり従業者: ${Math.round(data.employees / data.establishments)}人`
      );
      console.log(
        `   1事業所当たり販売額: ${Math.round(data.sales / data.establishments)}百万円`
      );
      console.log(
        `   従業者1人当たり販売額: ${Math.round((data.sales / data.employees) * 100) / 100}百万円\n`
      );
    });
  }

  // JSONファイルとして統計データを保存
  const outputPath = path.join(
    __dirname,
    "../../results/tables/descriptive_stats.json"
  );
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputData = {
    summary: {
      cities: cities.length,
      years: years.length,
      totalRecords: rawData.length,
      yearRange: `${Math.min(...years)}-${Math.max(...years)}`,
    },
    cityStats,
    rawData,
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), "utf8");
  console.log(`💾 統計データを保存しました: ${outputPath}`);

  console.log("\n✅ 記述統計分析完了!");
}

if (require.main === module) {
  main();
}

export { RetailData, CityStats, calculateStats };
