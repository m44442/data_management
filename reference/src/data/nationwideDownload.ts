import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import iconv from "iconv-lite";
import {
  NATIONWIDE_CITIES,
  getCityByCode,
  getTargetCityCodes,
} from "./nationwideCities";
import {
  NationwideRetailData,
  BatchProcessingConfig,
  ProcessingProgress,
} from "./nationwideTypes";

interface EstatRow {
  [key: string]: string;
}

interface RetailData {
  city: string;
  cityCode: string;
  prefectureName: string;
  region: string;
  year: number;
  establishments: number;
  employees: number;
  sales: number;
  salesArea: number;
  population: number;
  hasLargeRetailFacility: boolean;
}

// 数値パース用のユーティリティ関数
function parseNumber(value: string): number {
  if (!value || value === "-" || value === "***" || value === "X") return 0;
  const cleaned = value.replace(/[,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ファイル名から年次を抽出
function extractYearFromFilename(filepath: string): number | null {
  const filename = path.basename(filepath);
  const yearMatch = filename.match(/(\d{4})/);
  return yearMatch ? parseInt(yearMatch[1]) : null;
}

// 全国データ収集のメイン関数
async function loadNationwideData(
  config: BatchProcessingConfig
): Promise<NationwideRetailData[]> {
  console.log("=== 全国小売業データ収集開始 ===\n");

  const allData: NationwideRetailData[] = [];
  const progress: ProcessingProgress = {
    totalTasks: config.targetCities.length * config.targetYears.length,
    completedTasks: 0,
    currentTask: "",
    estimatedTimeRemaining: 0,
    errors: [],
  };

  const startTime = Date.now();

  // バッチサイズに応じて処理
  for (let i = 0; i < config.targetCities.length; i += config.batchSize) {
    const cityBatch = config.targetCities.slice(i, i + config.batchSize);

    if (config.parallelProcessing) {
      // 並列処理
      const batchPromises = cityBatch.map((cityCode) =>
        processCityData(cityCode, config.targetYears, progress)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          allData.push(...result.value);
        } else {
          const cityCode = cityBatch[index];
          const cityInfo = getCityByCode(cityCode);
          progress.errors.push({
            city: cityInfo?.cityName || cityCode,
            year: 0,
            errorType: "CITY_PROCESSING_ERROR",
            errorMessage: result.reason.message,
            timestamp: new Date().toISOString(),
          });
        }
      });
    } else {
      // 順次処理
      for (const cityCode of cityBatch) {
        try {
          const cityData = await processCityData(
            cityCode,
            config.targetYears,
            progress
          );
          allData.push(...cityData);
        } catch (error) {
          const cityInfo = getCityByCode(cityCode);
          progress.errors.push({
            city: cityInfo?.cityName || cityCode,
            year: 0,
            errorType: "CITY_PROCESSING_ERROR",
            errorMessage:
              error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    // 進捗更新
    const elapsedTime = Date.now() - startTime;
    const completionRate = progress.completedTasks / progress.totalTasks;
    progress.estimatedTimeRemaining =
      completionRate > 0 ? elapsedTime / completionRate - elapsedTime : 0;

    console.log(
      `📊 進捗: ${progress.completedTasks}/${progress.totalTasks} (${Math.round(completionRate * 100)}%)`
    );
    console.log(
      `⏱️  推定残り時間: ${Math.round(progress.estimatedTimeRemaining / 1000 / 60)}分`
    );

    if (progress.errors.length > 0) {
      console.log(`⚠️  エラー数: ${progress.errors.length}`);
    }
  }

  console.log(`\n✅ 全国データ収集完了!`);
  console.log(`📊 収集データ数: ${allData.length}レコード`);
  console.log(
    `🏙️  対象都市数: ${new Set(allData.map((d) => d.cityCode)).size}都市`
  );
  console.log(`📅 対象年数: ${new Set(allData.map((d) => d.year)).size}年`);

  if (progress.errors.length > 0) {
    console.log(`⚠️  エラー発生: ${progress.errors.length}件`);
    progress.errors.slice(0, 5).forEach((error) => {
      console.log(`   - ${error.city}: ${error.errorMessage}`);
    });
  }

  return allData;
}

// 都市別データ処理
async function processCityData(
  cityCode: string,
  targetYears: number[],
  progress: ProcessingProgress
): Promise<NationwideRetailData[]> {
  const cityInfo = getCityByCode(cityCode);
  if (!cityInfo) {
    throw new Error(`都市コード ${cityCode} の情報が見つかりません`);
  }

  progress.currentTask = `${cityInfo.cityName} のデータ処理中...`;

  const cityData: NationwideRetailData[] = [];

  // 実データが利用できないため、この機能は無効化
  // 学術研究ではサンプルデータは使用不可
  throw new Error(
    "実データシステムのみ使用可能です。サンプルデータは学術研究に不適切です。"
  );

  return cityData;
}

// サンプルデータ生成機能は学術研究に不適切のため削除
// 実データのみを使用する学術研究システムに変更

// データ保存
async function saveNationwideData(
  data: NationwideRetailData[],
  config: BatchProcessingConfig
): Promise<void> {
  const outputDir = path.join(__dirname, "../../data/nationwide");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (config.outputFormat === "json" || config.outputFormat === "both") {
    const jsonPath = path.join(
      outputDir,
      `nationwide_retail_data_${timestamp}.json`
    );
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`💾 JSONデータを保存: ${jsonPath}`);
  }

  if (config.outputFormat === "csv" || config.outputFormat === "both") {
    const csvPath = path.join(
      outputDir,
      `nationwide_retail_data_${timestamp}.csv`
    );
    const csvHeaders = Object.keys(data[0]).join(",");
    const csvRows = data.map((row) =>
      Object.values(row)
        .map((val) =>
          typeof val === "string" && val.includes(",") ? `"${val}"` : val
        )
        .join(",")
    );
    const csvContent = [csvHeaders, ...csvRows].join("\n");

    fs.writeFileSync(csvPath, csvContent, "utf8");
    console.log(`💾 CSVデータを保存: ${csvPath}`);
  }

  // メタデータ保存
  const metadata = {
    generatedAt: new Date().toISOString(),
    totalRecords: data.length,
    cities: [...new Set(data.map((d) => d.city))].length,
    years: [...new Set(data.map((d) => d.year))].sort(),
    regions: [...new Set(data.map((d) => d.region))],
    dataQuality: {
      completenessRate: data.filter((d) => d.sales > 0).length / data.length,
      missingDataCount: data.filter((d) => d.sales === 0).length,
    },
  };

  const metadataPath = path.join(outputDir, `metadata_${timestamp}.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
  console.log(`📄 メタデータを保存: ${metadataPath}`);
}

// メイン実行関数
async function main() {
  const config: BatchProcessingConfig = {
    targetCities: getTargetCityCodes(),
    targetYears: [2007, 2012, 2017, 2021], // 4時点のデータ
    batchSize: 10, // 10都市ずつ処理
    parallelProcessing: true,
    outputFormat: "both",
    includeVisualization: true,
  };

  try {
    const data = await loadNationwideData(config);
    await saveNationwideData(data, config);

    console.log("\n✅ 全国データ収集・保存完了!");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

// コマンドライン実行時のエントリーポイント
if (require.main === module) {
  main().catch(console.error);
}

export {
  loadNationwideData,
  saveNationwideData,
  BatchProcessingConfig,
  NationwideRetailData,
};
