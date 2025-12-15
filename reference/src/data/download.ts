import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import iconv from "iconv-lite";
import { RetailData } from "./types";
import { PHASE1_CITIES, getCityInfoByCode } from "./phase1Cities";

interface EstatRow {
  area_code?: string;
  value?: string;

  // 形式1: 2012年・2021年（経済センサス）
  表章項目?: string;
  cat01_code?: string;
  産業小分類?: string;
  地域区分?: string;
  時間軸?: string;

  // 形式2: 2002年・2007年（地域統計）
  "Ｃ　経済基盤"?: string;
  地域?: string;
  調査年?: string;

  // 形式3: 2007年単独
  確報・集計項目?: string;
  産業分類?: string;
  区市郡?: string;

  [key: string]: any;
}

/**
 * ファイル名から年次を推測
 */
function extractYearFromFilename(filepath: string): number | null {
  const filename = path.basename(filepath);
  const match = filename.match(/\d{4}/);
  if (match) {
    const year = parseInt(match[0]);
    if (year >= 2000 && year <= 2025) {
      return year;
    }
  }
  return null;
}

/**
 * 経済センサス/商業統計のCSVを読み込む（全形式対応）
 */
export function loadEstatCSV(filepath: string): Partial<RetailData>[] {
  console.log(`📂 Loading ${filepath}...`);

  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  // Shift-JISで読み込み
  const buffer = fs.readFileSync(filepath);
  const csvContent = iconv.decode(buffer, "shift_jis");

  // パース
  const parseResult = Papa.parse<EstatRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parseResult.errors.length > 0) {
    console.warn("⚠️  Parse warnings (first 3):");
    parseResult.errors
      .slice(0, 3)
      .forEach((err) => console.warn(`  Row ${err.row}: ${err.message}`));
  }

  console.log(`📊 Parsed ${parseResult.data.length} rows`);

  // ファイル名から年次を推測
  const filenameYear = extractYearFromFilename(filepath);
  console.log(`📅 Year from filename: ${filenameYear || "not found"}`);

  // 都市+年次ごとにデータを集約
  const cityYearMap = new Map<string, Partial<RetailData>>();

  parseResult.data.forEach((row) => {
    const areaCode = row.area_code || "";

    // Phase 1対象都市のみ（10都市 + 既存の高松市・宮崎市）
    const targetCityCodes = [
      ...PHASE1_CITIES.map((c) => c.cityCode),
      "37201",
      "45201",
    ];
    if (!targetCityCodes.includes(areaCode)) {
      return;
    }

    // 年次を取得（複数ソース対応）
    let year: number | null = null;

    // ソース1: 時間軸・調査年列
    const timeStr = row.時間軸 || row.調査年 || "";
    if (timeStr) {
      const yearStr = timeStr.replace(/[^0-9]/g, "");
      year = parseInt(yearStr.substring(0, 4));
    }

    // ソース2: ファイル名
    if (!year || isNaN(year) || year < 2000) {
      year = filenameYear;
    }

    if (!year || year < 2000 || year > 2025) return;

    // 項目名を取得（複数形式対応）
    let itemName = "";
    if (row.表章項目) {
      itemName = row.表章項目.trim();
    } else if (row["Ｃ　経済基盤"]) {
      itemName = row["Ｃ　経済基盤"].split("_").pop() || "";
    } else if (row["確報・集計項目"]) {
      itemName = row["確報・集計項目"].trim();
    }

    // 産業分類フィルタ（小売業のみ）
    const industryCode = (row.cat01_code || "").trim();
    const industryName = (
      row.産業小分類 ||
      row.産業分類 ||
      row.H24_産業分類 ||
      ""
    ).trim();

    const isRetailByName =
      itemName.includes("小売業") ||
      itemName.includes("ｺｳﾘ") ||
      industryName.includes("小売");

    const isRetailByCode =
      industryCode.match(/^5[6-9]/) || industryCode.startsWith("60");

    if (!isRetailByName && !isRetailByCode) {
      return;
    }

    // 値
    const value = parseNumber(row.value);
    if (value === 0) return;

    // キー: 都市+年次
    const key = `${areaCode}_${year}`;
    if (!cityYearMap.has(key)) {
      // 都市名を取得
      let cityName = "";
      if (areaCode === "37201") {
        cityName = "高松市";
      } else if (areaCode === "45201") {
        cityName = "宮崎市";
      } else {
        const cityInfo = getCityInfoByCode(areaCode);
        cityName = cityInfo ? cityInfo.cityName : `Unknown_${areaCode}`;
      }

      cityYearMap.set(key, {
        city: cityName,
        year: year,
        establishments: 0,
        employees: 0,
        sales: 0,
        salesArea: 0,
      });
    }

    const data = cityYearMap.get(key)!;

    // 項目に応じて集約
    if (itemName.includes("事業所数")) {
      data.establishments = (data.establishments || 0) + value;
    } else if (itemName.includes("従業者数") || itemName.includes("従業員数")) {
      data.employees = (data.employees || 0) + value;
    } else if (
      itemName.includes("年間商品販売額") ||
      itemName.includes("販売額")
    ) {
      data.sales = (data.sales || 0) + value;
    } else if (itemName.includes("売場面積")) {
      data.salesArea = (data.salesArea || 0) + value;
    }
  });

  const result = Array.from(cityYearMap.values());

  console.log(`✅ Extracted ${result.length} records from this file`);
  result.forEach((d) => {
    const details = [];
    if (d.establishments)
      details.push(`事業所=${d.establishments.toLocaleString()}`);
    if (d.employees) details.push(`従業者=${d.employees.toLocaleString()}`);
    if (d.sales) details.push(`販売額=${d.sales.toLocaleString()}百万円`);
    console.log(`  ${d.city} (${d.year}年): ${details.join(", ")}`);
  });

  return result;
}

/**
 * 数値変換
 */
function parseNumber(value: any): number {
  if (!value || value === "-" || value === "***" || value === "X") return 0;
  const str = String(value).replace(/,/g, "").replace(/\s/g, "").trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * 複数ファイルを読み込んでマージ
 */
export function loadAndMergeFiles(filepaths: string[]): RetailData[] {
  console.log(`\n=== Loading and merging ${filepaths.length} files ===\n`);

  const allRecords: Partial<RetailData>[] = [];

  for (const filepath of filepaths) {
    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️  Skipping: ${filepath}`);
      continue;
    }

    try {
      const records = loadEstatCSV(filepath);
      allRecords.push(...records);
      console.log("");
    } catch (error) {
      console.error(`❌ Error loading ${filepath}:`, error);
      console.error(error);
    }
  }

  console.log(`📦 Total records collected: ${allRecords.length}\n`);

  // 都市+年次でマージ
  const mergedMap = new Map<string, RetailData>();

  allRecords.forEach((record) => {
    if (!record.city || !record.year) return;

    const key = `${record.city}_${record.year}`;

    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        city: record.city,
        year: record.year,
        establishments: 0,
        employees: 0,
        sales: 0,
        salesArea: 0,
      });
    }

    const merged = mergedMap.get(key)!;
    merged.establishments += record.establishments || 0;
    merged.employees += record.employees || 0;
    merged.sales += record.sales || 0;
    merged.salesArea! += record.salesArea || 0;
  });

  const result = Array.from(mergedMap.values()).sort(
    (a, b) => a.city.localeCompare(b.city) || a.year - b.year
  );

  console.log("=== Merge Complete ===\n");
  console.log(`Final merged records: ${result.length}\n`);

  return result;
}

/**
 * JSON保存
 */
export function saveJSON(data: any, filepath: string): void {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf8");
  console.log(`💾 Saved to ${filepath}`);
}

// メイン処理
if (require.main === module) {
  console.log("=== e-Stat Data Loading (All Formats) ===\n");

  const rawDir = "data/raw";
  const files = fs
    .readdirSync(rawDir)
    .filter((f) => f.endsWith(".csv"))
    .map((f) => path.join(rawDir, f))
    .sort();

  if (files.length === 0) {
    console.error("❌ No CSV files found in data/raw/\n");
    process.exit(1);
  }

  console.log(`Found ${files.length} CSV files:\n`);
  files.forEach((f) => console.log(`  - ${path.basename(f)}`));
  console.log("");

  const allData = loadAndMergeFiles(files);

  if (allData.length === 0) {
    console.error("❌ No data extracted.\n");
    process.exit(1);
  }

  saveJSON(allData, "data/processed/retail_data.json");

  // サマリー
  console.log("\n📊 Final Summary:");
  console.log(`  Total records: ${allData.length}`);

  const cities = [...new Set(allData.map((d) => d.city))];
  const years = [...new Set(allData.map((d) => d.year))].sort();

  console.log(`  Cities: ${cities.join(", ")}`);
  console.log(`  Years: ${years.join(", ")}\n`);

  cities.forEach((city) => {
    console.log(`  ${city}:`);
    const cityData = allData.filter((d) => d.city === city);
    cityData.forEach((d) => {
      const parts = [];
      if (d.establishments > 0)
        parts.push(`事業所${d.establishments.toLocaleString()}`);
      if (d.employees > 0) parts.push(`従業者${d.employees.toLocaleString()}`);
      if (d.sales > 0) parts.push(`販売額${d.sales.toLocaleString()}百万円`);
      console.log(`    ${d.year}年: ${parts.join("、")}`);
    });
    console.log("");
  });

  console.log("✅ All done!\n");
}
