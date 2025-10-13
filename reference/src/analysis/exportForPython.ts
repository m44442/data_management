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

function main() {
  console.log("=== Python分析用データエクスポート ===\n");

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
  console.log(`📊 データ読み込み完了: ${rawData.length}レコード`);

  // Python用フォルダ作成
  const pythonDir = path.join(__dirname, "../../python");
  const dataForPythonDir = path.join(__dirname, "../../data/for_python");

  if (!fs.existsSync(pythonDir)) {
    fs.mkdirSync(pythonDir, { recursive: true });
    console.log(`📁 Pythonディレクトリを作成: ${pythonDir}`);
  }

  if (!fs.existsSync(dataForPythonDir)) {
    fs.mkdirSync(dataForPythonDir, { recursive: true });
    console.log(`📁 Python用データディレクトリを作成: ${dataForPythonDir}`);
  }

  // CSV形式でエクスポート（pandas用）
  const csvPath = path.join(dataForPythonDir, "retail_data.csv");
  const csvHeaders = "city,year,establishments,employees,sales,salesArea";
  const csvRows = rawData.map(
    (row) =>
      `"${row.city}",${row.year},${row.establishments},${row.employees},${row.sales},${row.salesArea}`
  );
  const csvContent = [csvHeaders, ...csvRows].join("\n");

  fs.writeFileSync(csvPath, csvContent, "utf8");
  console.log(`📄 CSVファイルを作成: ${csvPath}`);

  // JSON形式でもエクスポート
  const jsonPath = path.join(dataForPythonDir, "retail_data_python.json");
  fs.writeFileSync(jsonPath, JSON.stringify(rawData, null, 2), "utf8");
  console.log(`📄 JSONファイルを作成: ${jsonPath}`);

  // メタデータファイル作成
  const metadata = {
    description: "小売業データセット",
    source: "e-Stat統計データ",
    created: new Date().toISOString(),
    records: rawData.length,
    cities: [...new Set(rawData.map((d) => d.city))],
    years: [...new Set(rawData.map((d) => d.year))].sort(),
    fields: {
      city: "都市名",
      year: "年次",
      establishments: "事業所数",
      employees: "従業者数",
      sales: "年間商品販売額（百万円）",
      salesArea: "売場面積（㎡）",
    },
  };

  const metadataPath = path.join(dataForPythonDir, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
  console.log(`📄 メタデータファイルを作成: ${metadataPath}`);

  // 統計分析用の追加データも準備
  const analysisData = rawData.map((row) => ({
    ...row,
    // 従業者1人当たり売場面積
    salesAreaPerEmployee:
      Math.round((row.salesArea / row.employees) * 100) / 100,
    // 1事業所当たり従業者数
    employeesPerEstablishment:
      Math.round((row.employees / row.establishments) * 100) / 100,
    // 1事業所当たり販売額
    salesPerEstablishment:
      Math.round((row.sales / row.establishments) * 100) / 100,
    // 従業者1人当たり販売額
    salesPerEmployee: Math.round((row.sales / row.employees) * 100) / 100,
  }));

  const analysisPath = path.join(
    dataForPythonDir,
    "retail_data_with_ratios.csv"
  );
  const analysisHeaders =
    "city,year,establishments,employees,sales,salesArea,salesAreaPerEmployee,employeesPerEstablishment,salesPerEstablishment,salesPerEmployee";
  const analysisRows = analysisData.map(
    (row) =>
      `"${row.city}",${row.year},${row.establishments},${row.employees},${row.sales},${row.salesArea},${row.salesAreaPerEmployee},${row.employeesPerEstablishment},${row.salesPerEstablishment},${row.salesPerEmployee}`
  );
  const analysisContent = [analysisHeaders, ...analysisRows].join("\n");

  fs.writeFileSync(analysisPath, analysisContent, "utf8");
  console.log(`📄 分析用データ（比率含む）を作成: ${analysisPath}`);

  console.log("\n✅ Python用データエクスポート完了!");
  console.log("\n📊 エクスポートされたファイル:");
  console.log(`   - ${csvPath}`);
  console.log(`   - ${jsonPath}`);
  console.log(`   - ${metadataPath}`);
  console.log(`   - ${analysisPath}`);
}

if (require.main === module) {
  main();
}

export { RetailData };
