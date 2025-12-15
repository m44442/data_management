/**
 * import { PHASE1_CITIES, Phase1CityInfo } from '../data/phase1Cities';ータ統合システム：APIデータとCSVデータの統合
 * 4時点（2007/2012/2014/2021年）の完全データセット構築
 */

import fs from "fs";
import path from "path";
import { PHASE1_CITIES, Phase1CityInfo } from "../data/phase1Cities.js";

// データ型定義
interface UnifiedRetailData {
  prefectureCode: string;
  prefectureName: string;
  cityCode: string;
  cityName: string;
  year: number;
  establishments: number;
  employees: number;
  sales?: number; // CSVのみ
  salesArea?: number; // CSVのみ
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

class DataIntegrationSystem {
  private phase1Cities: Phase1CityInfo[];
  private apiData: APIRetailData[];
  private csvData: CSVRetailData[];
  private unifiedData: UnifiedRetailData[] = [];

  constructor() {
    this.phase1Cities = PHASE1_CITIES;
    this.apiData = [];
    this.csvData = [];
  }

  /**
   * データファイルを読み込む
   */
  async loadDataFiles(): Promise<void> {
    try {
      // APIデータ読み込み（2014年）
      const apiDataPath = path.join(
        process.cwd(),
        "data",
        "processed",
        "2014_retail_data_api.json"
      );
      const apiRawData = JSON.parse(fs.readFileSync(apiDataPath, "utf-8"));
      this.apiData = apiRawData;
      console.log(`✅ APIデータ読み込み完了: ${this.apiData.length}レコード`);

      // CSVデータ読み込み（2007/2012/2021年）
      const csvDataPath = path.join(
        process.cwd(),
        "data",
        "processed",
        "retail_data.json"
      );
      const csvRawData = JSON.parse(fs.readFileSync(csvDataPath, "utf-8"));
      this.csvData = csvRawData;
      console.log(`✅ CSVデータ読み込み完了: ${this.csvData.length}レコード`);
    } catch (error) {
      console.error("❌ データファイル読み込みエラー:", error);
      throw error;
    }
  }

  /**
   * Phase 1都市にマッチする2014年APIデータを都市レベルで集計
   */
  aggregateAPIDataByCities(): Map<
    string,
    { establishments: number; employees: number }
  > {
    const cityAggregation = new Map<
      string,
      { establishments: number; employees: number }
    >();

    // Phase 1都市の都道府県コードマッピング
    const prefectureCityMap = new Map();
    this.phase1Cities.forEach((city) => {
      prefectureCityMap.set(city.prefectureCode, city);
    });

    console.log("\n📊 2014年APIデータ集計開始...");

    // APIデータを都道府県・データタイプ別に集計
    this.apiData.forEach((record) => {
      const targetCity = prefectureCityMap.get(record.prefectureCode);
      if (!targetCity) return; // Phase 1対象外の都道府県はスキップ

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

    // 集計結果を表示
    cityAggregation.forEach((data, cityKey) => {
      console.log(
        `  ${cityKey}: 事業所${data.establishments}件, 従業者${data.employees}人`
      );
    });

    return cityAggregation;
  }

  /**
   * CSVデータを統合データ形式に変換
   */
  convertCSVData(): UnifiedRetailData[] {
    const convertedData: UnifiedRetailData[] = [];

    this.csvData.forEach((record) => {
      // 都市名からPhase 1都市情報を取得
      const cityInfo = this.phase1Cities.find(
        (city) => city.cityName === record.city
      );
      if (!cityInfo) {
        console.warn(`⚠️ Phase 1対象外の都市: ${record.city}`);
        return;
      }

      convertedData.push({
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

    console.log(`✅ CSV変換完了: ${convertedData.length}レコード`);
    return convertedData;
  }

  /**
   * APIデータを統合データ形式に変換
   */
  convertAPIData(
    cityAggregation: Map<string, { establishments: number; employees: number }>
  ): UnifiedRetailData[] {
    const convertedData: UnifiedRetailData[] = [];

    cityAggregation.forEach((data, cityKey) => {
      const [prefCode, cityName] = cityKey.split("-");
      const cityInfo = this.phase1Cities.find(
        (city) => city.prefectureCode === prefCode && city.cityName === cityName
      );

      if (cityInfo) {
        convertedData.push({
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

    console.log(`✅ API変換完了: ${convertedData.length}レコード`);
    return convertedData;
  }

  /**
   * 統合データセットを構築
   */
  async buildUnifiedDataset(): Promise<UnifiedRetailData[]> {
    console.log("\n🔧 データ統合システム開始...\n");

    // データファイル読み込み
    await this.loadDataFiles();

    // APIデータを都市レベルで集計
    const cityAggregation = this.aggregateAPIDataByCities();

    // CSVデータを変換
    const csvConverted = this.convertCSVData();

    // APIデータを変換
    const apiConverted = this.convertAPIData(cityAggregation);

    // 統合
    this.unifiedData = [...csvConverted, ...apiConverted];

    // 年代順・都市順でソート
    this.unifiedData.sort((a, b) => {
      if (a.cityName !== b.cityName) {
        return a.cityName.localeCompare(b.cityName, "ja");
      }
      return a.year - b.year;
    });

    console.log(`\n🎉 統合データセット構築完了！`);
    console.log(`📊 総レコード数: ${this.unifiedData.length}レコード`);
    console.log(`📅 対象年代: 2007, 2012, 2014, 2021年（4時点）`);
    console.log(
      `🏙️ 対象都市: ${new Set(this.unifiedData.map((d) => d.cityName)).size}都市`
    );

    return this.unifiedData;
  }

  /**
   * 統合データセットを保存
   */
  async saveUnifiedDataset(): Promise<void> {
    const outputPath = path.join(
      process.cwd(),
      "data",
      "processed",
      "unified_retail_dataset.json"
    );

    fs.writeFileSync(
      outputPath,
      JSON.stringify(this.unifiedData, null, 2),
      "utf-8"
    );
    console.log(`💾 統合データセット保存完了: ${outputPath}`);

    // サマリー情報も保存
    const summary = this.generateDatasetSummary();
    const summaryPath = path.join(
      process.cwd(),
      "data",
      "processed",
      "unified_dataset_summary.json"
    );
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
    console.log(`📋 サマリー情報保存完了: ${summaryPath}`);
  }

  /**
   * データセットサマリーを生成
   */
  generateDatasetSummary() {
    const cities = [...new Set(this.unifiedData.map((d) => d.cityName))];
    const years = [...new Set(this.unifiedData.map((d) => d.year))].sort();
    const regions = [...new Set(this.unifiedData.map((d) => d.region))];

    const cityStats = cities.map((city) => {
      const cityData = this.unifiedData.filter((d) => d.cityName === city);
      return {
        cityName: city,
        prefectureName: cityData[0]?.prefectureName,
        region: cityData[0]?.region,
        availableYears: cityData.map((d) => d.year).sort(),
        totalRecords: cityData.length,
      };
    });

    return {
      overview: {
        totalRecords: this.unifiedData.length,
        totalCities: cities.length,
        totalYears: years.length,
        totalRegions: regions.length,
        dataCompletePercentage:
          (this.unifiedData.length / (cities.length * years.length)) * 100,
      },
      years: years,
      cities: cities.sort(),
      regions: regions.sort(),
      cityStatistics: cityStats,
      dataSourceBreakdown: {
        API: this.unifiedData.filter((d) => d.dataSource === "API").length,
        CSV: this.unifiedData.filter((d) => d.dataSource === "CSV").length,
      },
    };
  }

  /**
   * データ品質チェック
   */
  validateDataQuality(): void {
    console.log("\n🔍 データ品質チェック開始...");

    const issues: string[] = [];

    // 1. 都市×年のデータ完全性チェック
    const expectedCombinations = this.phase1Cities.length * 4; // 10都市 × 4年
    if (this.unifiedData.length !== expectedCombinations) {
      issues.push(
        `期待レコード数${expectedCombinations}に対し、実際は${this.unifiedData.length}レコード`
      );
    }

    // 2. 欠損値チェック
    const missingData = this.unifiedData.filter(
      (d) => d.establishments <= 0 || d.employees <= 0
    );
    if (missingData.length > 0) {
      issues.push(
        `${missingData.length}レコードに事業所数または従業者数の異常値（≤0）`
      );
    }

    // 3. 都市別データ完全性
    const cityCompleteness = this.phase1Cities
      .map((city) => {
        const cityRecords = this.unifiedData.filter(
          (d) => d.cityName === city.cityName
        );
        return {
          city: city.cityName,
          expected: 4,
          actual: cityRecords.length,
          missing: 4 - cityRecords.length,
        };
      })
      .filter((c) => c.missing > 0);

    if (cityCompleteness.length > 0) {
      issues.push(
        `データ不完全な都市: ${cityCompleteness.map((c) => `${c.city}(${c.missing}年分欠損)`).join(", ")}`
      );
    }

    // 結果レポート
    if (issues.length === 0) {
      console.log("✅ データ品質: 問題なし");
    } else {
      console.log("⚠️ データ品質の問題:");
      issues.forEach((issue) => console.log(`  - ${issue}`));
    }
  }
}

// メイン実行関数
export async function integrateAllRetailData(): Promise<void> {
  const integrator = new DataIntegrationSystem();

  try {
    // 統合データセット構築
    await integrator.buildUnifiedDataset();

    // データ品質チェック
    integrator.validateDataQuality();

    // 統合データセット保存
    await integrator.saveUnifiedDataset();

    console.log("\n🎉 データ統合処理完了！");
    console.log("📁 出力ファイル:");
    console.log("  - data/processed/unified_retail_dataset.json");
    console.log("  - data/processed/unified_dataset_summary.json");
  } catch (error) {
    console.error("❌ データ統合エラー:", error);
    throw error;
  }
}

// 直接実行用（ESモジュール環境）
// Node.js環境での実行時に使用
