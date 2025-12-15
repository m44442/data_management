#!/usr/import { integrateAllRetailData } from '../analysis/dataIntegration';in/env node

/**
 * データ統合システム実行スクリプト
 * 4時点データ統合の実行とテスト
 */

import { integrateAllRetailData } from "../analysis/dataIntegration.js";

async function main() {
  console.log("🚀 データ統合システム実行開始");
  console.log("=".repeat(50));

  try {
    await integrateAllRetailData();
    console.log("\n✅ 統合処理成功！");
  } catch (error) {
    console.error("\n❌ 統合処理失敗:", error);
    process.exit(1);
  }
}

main();
