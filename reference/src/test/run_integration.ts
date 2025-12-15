/**
 * データ統合システム実行スクリプト
 * 4時点データ統合の実行とテスト
 */

import fs from "fs";
import path from "path";
import { PHASE1_CITIES, Phase1CityInfo } from "../data/phase1Cities";

// データ型定義
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

interface APIRetailData {
  prefectureCode: string;
  prefectureName: string;
  statsDataId: string;
  areaCode: string;
  categoryCode: string;
  dataType: "establishments" | "employees";
  value: number;
  unit: string;
  year: number;
  surveyDate: number;
}

interface CSVRetailData {
  city: string;
  year: number;
  establishments: number;
  employees: number;
  sales: number;
  salesArea: number;
}

async function integrateData(): Promise<void> {
  console.log("🚀 データ統合システム実行開始");
  console.log("=".repeat(50));

  try {
    // データファイル読み込み
    console.log("\n📁 データファイル読み込み中...");

    const apiDataPath = path.join(
      process.cwd(),
      "data",
      "processed",
      "2014_retail_data_api.json"
    );
    const csvDataPath = path.join(
      process.cwd(),
      "data",
      "processed",
      "retail_data.json"
    );

    const apiData: APIRetailData[] = JSON.parse(
      fs.readFileSync(apiDataPath, "utf-8")
    );
    const csvData: CSVRetailData[] = JSON.parse(
      fs.readFileSync(csvDataPath, "utf-8")
    );

    console.log(`✅ APIデータ読み込み完了: ${apiData.length}レコード`);
    console.log(`✅ CSVデータ読み込み完了: ${csvData.length}レコード`);

    // APIデータを都市レベルで集計
    console.log("\n📊 2014年APIデータ集計開始...");

    const cityAggregation = new Map<
      string,
      { establishments: number; employees: number }
    >();
    const prefectureCityMap = new Map();

    PHASE1_CITIES.forEach((city) => {
      prefectureCityMap.set(city.prefectureCode, city);
    });

    apiData.forEach((record) => {
      const targetCity = prefectureCityMap.get(record.prefectureCode);
      if (!targetCity) return;

      const cityKey = `${record.prefectureCode}-${targetCity.cityName}`;

      if (!cityAggregation.has(cityKey)) {
        cityAggregation.set(cityKey, { establishments: 0, employees: 0 });
      }

      const cityData = cityAggregation.get(cityKey)!;

      if (record.dataType === "establishments") {
        cityData.establishments += record.value;
      } else if (record.dataType === "employees") {
        cityData.employees += record.value;
      }
    });

    console.log(`✅ API集計完了: ${cityAggregation.size}都市分のデータ`);

    cityAggregation.forEach((data, cityKey) => {
      console.log(
        `  ${cityKey}: 事業所${data.establishments}件, 従業者${data.employees}人`
      );
    });

    // 統合データセット構築
    console.log("\n🔧 統合データセット構築中...");

    const unifiedData: UnifiedRetailData[] = [];

    // CSVデータを変換
    csvData.forEach((record) => {
      const cityInfo = PHASE1_CITIES.find(
        (city) => city.cityName === record.city
      );
      if (!cityInfo) {
        console.warn(`⚠️ Phase 1対象外の都市: ${record.city}`);
        return;
      }

      unifiedData.push({
        prefectureCode: cityInfo.prefectureCode,
        prefectureName: cityInfo.prefectureName,
        cityCode: cityInfo.cityCode,
        cityName: record.city,
        year: record.year,
        establishments: record.establishments,
        employees: record.employees,
        sales: record.sales,
        salesArea: record.salesArea,
        dataSource: "CSV",
        region: cityInfo.region,
      });
    });

    // APIデータを変換
    cityAggregation.forEach((data, cityKey) => {
      const [prefCode, cityName] = cityKey.split("-");
      const cityInfo = PHASE1_CITIES.find(
        (city) => city.prefectureCode === prefCode && city.cityName === cityName
      );

      if (cityInfo) {
        unifiedData.push({
          prefectureCode: cityInfo.prefectureCode,
          prefectureName: cityInfo.prefectureName,
          cityCode: cityInfo.cityCode,
          cityName: cityInfo.cityName,
          year: 2014,
          establishments: data.establishments,
          employees: data.employees,
          dataSource: "API",
          region: cityInfo.region,
        });
      }
    });

    // ソート
    unifiedData.sort((a, b) => {
      if (a.cityName !== b.cityName) {
        return a.cityName.localeCompare(b.cityName, "ja");
      }
      return a.year - b.year;
    });

    console.log(`\n🎉 統合データセット構築完了！`);
    console.log(`📊 総レコード数: ${unifiedData.length}レコード`);
    console.log(`📅 対象年代: 2007, 2012, 2014, 2021年（4時点）`);
    console.log(
      `🏙️ 対象都市: ${new Set(unifiedData.map((d) => d.cityName)).size}都市`
    );

    // 保存
    const outputPath = path.join(
      process.cwd(),
      "data",
      "processed",
      "unified_retail_dataset.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(unifiedData, null, 2), "utf-8");
    console.log(`💾 統合データセット保存完了: ${outputPath}`);

    // サマリー情報生成
    const cities = [...new Set(unifiedData.map((d) => d.cityName))];
    const years = [...new Set(unifiedData.map((d) => d.year))].sort();

    const summary = {
      overview: {
        totalRecords: unifiedData.length,
        totalCities: cities.length,
        totalYears: years.length,
        expectedRecords: cities.length * years.length,
        dataCompletePercentage:
          (unifiedData.length / (cities.length * years.length)) * 100,
      },
      years: years,
      cities: cities.sort(),
      dataSourceBreakdown: {
        API: unifiedData.filter((d) => d.dataSource === "API").length,
        CSV: unifiedData.filter((d) => d.dataSource === "CSV").length,
      },
    };

    const summaryPath = path.join(
      process.cwd(),
      "data",
      "processed",
      "unified_dataset_summary.json"
    );
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
    console.log(`📋 サマリー情報保存完了: ${summaryPath}`);

    console.log("\n📊 データセット統計:");
    console.log(`  - 総レコード数: ${summary.overview.totalRecords}`);
    console.log(`  - 期待レコード数: ${summary.overview.expectedRecords}`);
    console.log(
      `  - データ完全性: ${summary.overview.dataCompletePercentage.toFixed(1)}%`
    );
    console.log(`  - APIデータ: ${summary.dataSourceBreakdown.API}レコード`);
    console.log(`  - CSVデータ: ${summary.dataSourceBreakdown.CSV}レコード`);

    console.log("\n✅ 統合処理成功！");
  } catch (error) {
    console.error("\n❌ 統合処理失敗:", error);
    throw error;
  }
}

integrateData();
