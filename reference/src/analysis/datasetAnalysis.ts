/**
 * 統合データセットの詳細分析
 * 欠損レコードの特定と品質チェック
 */

import fs from "fs";
import path from "path";
import { PHASE1_CITIES } from "../data/phase1Cities";

interface UnifiedRetailData {
  prefectureCode: string;
  prefectureName: string;
  cityCode: string;
  cityName: string;
  year: number;
  establishments: number;
  employees: number;
  sales?: number;
  salesArea?: number;
  dataSource: "API" | "CSV";
  region: string;
}

function analyzeUnifiedDataset(): void {
  console.log("🔍 統合データセット詳細分析開始");
  console.log("=".repeat(60));

  // データ読み込み
  const dataPath = path.join(
    process.cwd(),
    "data",
    "processed",
    "unified_retail_dataset.json"
  );
  const unifiedData: UnifiedRetailData[] = JSON.parse(
    fs.readFileSync(dataPath, "utf-8")
  );

  const expectedYears = [2007, 2012, 2014, 2021];
  const expectedCities = PHASE1_CITIES.map((city) => city.cityName);

  console.log("\n📊 基本統計:");
  console.log(`  - 総レコード数: ${unifiedData.length}`);
  console.log(
    `  - 期待レコード数: ${expectedCities.length * expectedYears.length}`
  );
  console.log(
    `  - データ完全性: ${((unifiedData.length / (expectedCities.length * expectedYears.length)) * 100).toFixed(1)}%`
  );

  // 都市別・年別のデータマトリックス作成
  const dataMatrix = new Map<string, Set<number>>();

  unifiedData.forEach((record) => {
    if (!dataMatrix.has(record.cityName)) {
      dataMatrix.set(record.cityName, new Set());
    }
    dataMatrix.get(record.cityName)!.add(record.year);
  });

  // 欠損データチェック
  console.log("\n🔍 欠損データ分析:");
  const missingRecords: Array<{ city: string; year: number }> = [];

  expectedCities.forEach((city) => {
    const availableYears = dataMatrix.get(city) || new Set();
    expectedYears.forEach((year) => {
      if (!availableYears.has(year)) {
        missingRecords.push({ city, year });
      }
    });
  });

  if (missingRecords.length === 0) {
    console.log("  ✅ 欠損データなし！完全なデータセット");
  } else {
    console.log(`  ⚠️ 欠損レコード数: ${missingRecords.length}`);
    missingRecords.forEach((missing) => {
      console.log(`    - ${missing.city} (${missing.year}年)`);
    });
  }

  // 都市別完全性レポート
  console.log("\n🏙️ 都市別データ完全性:");
  expectedCities.forEach((city) => {
    const availableYears = dataMatrix.get(city) || new Set();
    const completeness = (availableYears.size / expectedYears.length) * 100;
    const status = completeness === 100 ? "✅" : "⚠️";
    console.log(
      `  ${status} ${city}: ${availableYears.size}/${expectedYears.length}年 (${completeness.toFixed(0)}%)`
    );

    if (completeness < 100) {
      const missingYears = expectedYears.filter(
        (year) => !availableYears.has(year)
      );
      console.log(`      欠損年: ${missingYears.join(", ")}`);
    }
  });

  // 年別完全性レポート
  console.log("\n📅 年別データ完全性:");
  expectedYears.forEach((year) => {
    const citiesWithData = expectedCities.filter((city) => {
      const availableYears = dataMatrix.get(city) || new Set();
      return availableYears.has(year);
    });
    const completeness = (citiesWithData.length / expectedCities.length) * 100;
    const status = completeness === 100 ? "✅" : "⚠️";
    console.log(
      `  ${status} ${year}年: ${citiesWithData.length}/${expectedCities.length}都市 (${completeness.toFixed(0)}%)`
    );

    if (completeness < 100) {
      const missingCities = expectedCities.filter(
        (city) => !citiesWithData.includes(city)
      );
      console.log(`      欠損都市: ${missingCities.join(", ")}`);
    }
  });

  // データソース別分析
  console.log("\n📋 データソース別分析:");
  const sourceBreakdown = {
    API: unifiedData.filter((d) => d.dataSource === "API").length,
    CSV: unifiedData.filter((d) => d.dataSource === "CSV").length,
  };

  console.log(`  - API（2014年）: ${sourceBreakdown.API}レコード`);
  console.log(`  - CSV（その他年）: ${sourceBreakdown.CSV}レコード`);

  // 地域別分析
  console.log("\n🗾 地域別分析:");
  const regionStats = new Map<string, number>();
  unifiedData.forEach((record) => {
    regionStats.set(record.region, (regionStats.get(record.region) || 0) + 1);
  });

  regionStats.forEach((count, region) => {
    console.log(`  - ${region}: ${count}レコード`);
  });

  // APIデータ vs CSVデータ比較（2014年以外）
  console.log("\n⚖️ データ一貫性チェック（APIデータ品質）:");

  // 2014年APIデータと他年度CSVデータの比較
  expectedCities.forEach((city) => {
    const cityData = unifiedData.filter((d) => d.cityName === city);
    const apiData = cityData.find(
      (d) => d.dataSource === "API" && d.year === 2014
    );
    const csvData = cityData.filter((d) => d.dataSource === "CSV");

    if (apiData && csvData.length > 0) {
      // 事業所数の妥当性チェック（前後年との比較）
      const nearbyYears = csvData.filter(
        (d) => d.year === 2012 || d.year === 2021
      );
      if (nearbyYears.length > 0) {
        const avgEstablishments =
          nearbyYears.reduce((sum, d) => sum + d.establishments, 0) /
          nearbyYears.length;
        const ratio = apiData.establishments / avgEstablishments;

        if (ratio > 3 || ratio < 0.3) {
          console.log(
            `  ⚠️ ${city}: APIデータ異常値の可能性（事業所数比率: ${ratio.toFixed(2)}）`
          );
          console.log(
            `      API(2014): ${apiData.establishments}件 vs 近接年平均: ${Math.round(avgEstablishments)}件`
          );
        } else {
          console.log(
            `  ✅ ${city}: APIデータ正常範囲（比率: ${ratio.toFixed(2)}）`
          );
        }
      }
    }
  });

  console.log("\n=".repeat(60));
  console.log("🎯 分析完了！");
}

analyzeUnifiedDataset();
