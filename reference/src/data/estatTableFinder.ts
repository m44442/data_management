/**
 * e-Stat API 統計表検索ツール
 * 2017年経済センサスの正確な統計表IDを探すためのツール
 */

export class EstatTableFinder {
  private appId: string;

  constructor(appId: string) {
    this.appId = appId;
  }

  /**
   * 統計表一覧を検索
   */
  async searchStatsTables(searchWord: string = "経済センサス"): Promise<void> {
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=${this.appId}&searchWord=${encodeURIComponent(searchWord)}&searchKind=2`;

    console.log(`🔍 統計表検索中: ${searchWord}`);
    console.log(`URL: ${url}`);

    try {
      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data.GET_STATS_LIST.RESULT.STATUS !== 0) {
        console.error("❌ API Error:", data.GET_STATS_LIST.RESULT.ERROR_MSG);
        return;
      }

      const tables = data.GET_STATS_LIST.DATALIST_INF.TABLE_INF;
      console.log(`\n📊 見つかった統計表: ${tables.length}件\n`);

      // 2017年の経済センサス関連を抽出
      const census2017 = tables.filter((table: any) => {
        const title = table.TITLE?.$ || table.STATISTICS_NAME || "";
        const statName = table.STAT_NAME?.$ || "";
        return (
          title.includes("2017") ||
          statName.includes("2017") ||
          title.includes("平成２９年") ||
          statName.includes("平成２９年")
        );
      });

      console.log("🎯 2017年経済センサス関連統計表:");
      console.log("─".repeat(100));

      census2017.forEach((table: any) => {
        console.log(`📋 ID: ${table["@id"]}`);
        console.log(`📄 タイトル: ${table.TITLE?.$ || table.STATISTICS_NAME}`);
        console.log(`📊 統計名: ${table.STAT_NAME?.$ || ""}`);
        console.log(`🏢 統計局: ${table.GOV_ORG?.$ || ""}`);
        console.log(`📅 調査日: ${table.SURVEY_DATE}`);
        console.log("─".repeat(50));
      });

      if (census2017.length === 0) {
        console.log("⚠️  2017年経済センサス活動調査が見つかりませんでした");
        console.log("💡 全体結果から関連するものを探してみます...\n");

        tables.slice(0, 10).forEach((table: any) => {
          const title = table.TITLE?.$ || table.STATISTICS_NAME || "No Title";
          console.log(`📋 ID: ${table["@id"]} | ${title}`);
        });
      }
    } catch (error) {
      console.error("❌ 検索エラー:", error);
    }
  }

  /**
   * 特定の統計表の詳細情報を取得
   */
  async getTableMetaInfo(statsDataId: string): Promise<void> {
    const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${this.appId}&statsDataId=${statsDataId}`;

    console.log(`\n🔍 統計表詳細取得: ${statsDataId}`);

    try {
      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data.GET_META_INFO.RESULT.STATUS !== 0) {
        console.error("❌ API Error:", data.GET_META_INFO.RESULT.ERROR_MSG);
        return;
      }

      const classInfos = data.GET_META_INFO.METADATA_INF.CLASS_INF;

      console.log("\n📊 利用可能な分類軸:");
      classInfos.forEach((classInfo: any) => {
        console.log(`\n🏷️  ${classInfo["@name"]} (${classInfo["@code"]})`);

        if (classInfo.CLASS_OBJ) {
          const classes = Array.isArray(classInfo.CLASS_OBJ)
            ? classInfo.CLASS_OBJ
            : [classInfo.CLASS_OBJ];
          classes.slice(0, 5).forEach((cls: any) => {
            console.log(`   - ${cls["@code"]}: ${cls["@name"]}`);
          });
          if (classes.length > 5) {
            console.log(`   ... 他${classes.length - 5}件`);
          }
        }
      });
    } catch (error) {
      console.error("❌ メタ情報取得エラー:", error);
    }
  }
}

/**
 * 2017年経済センサス統計表を検索する実行関数
 */
export async function searchCensus2017Tables(): Promise<void> {
  const appId = process.env.ESTAT_APP_ID;

  if (!appId) {
    console.error("❌ e-Stat App ID が設定されていません");
    return;
  }

  const finder = new EstatTableFinder(appId);

  // 検索キーワードを段階的に試す
  const searchTerms = [
    "2017年経済センサス活動調査",
    "経済センサス 2017",
    "活動調査 2017",
    "経済センサス",
  ];

  for (const term of searchTerms) {
    console.log(`\n${"=".repeat(60)}`);
    await finder.searchStatsTables(term);
  }
}

// 特定の統計表IDの詳細を調査する関数
export async function investigateTableId(statsDataId: string): Promise<void> {
  const appId = process.env.ESTAT_APP_ID;

  if (!appId) {
    console.error("❌ e-Stat App ID が設定されていません");
    return;
  }

  const finder = new EstatTableFinder(appId);
  await finder.getTableMetaInfo(statsDataId);
}

// 実行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // 統計表ID指定の場合
    investigateTableId(args[0]);
  } else {
    // 統計表検索の場合
    searchCensus2017Tables();
  }
}
