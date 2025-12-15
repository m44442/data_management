/**
 * 公式ドキュメントに基づくe-Stat API正式版
 * 2017年経済センサス活動調査の正確なデータ取得
 */

export class OfficialEstatAPI {
  private appId: string;
  private baseUrl = "https://api.e-stat.go.jp/rest/3.0/app/json";

  constructor(appId: string) {
    this.appId = appId;
  }

  /**
   * 統計表一覧検索（公式仕様準拠）
   */
  async searchStatsList(searchWord: string, searchKind = 2): Promise<any> {
    const params = new URLSearchParams({
      appId: this.appId,
      searchWord: searchWord,
      searchKind: searchKind.toString(),
    });

    const url = `${this.baseUrl}/getStatsList?${params}`;
    console.log(`🔍 統計表検索: ${url}`);

    try {
      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data.GET_STATS_LIST.RESULT.STATUS !== 0) {
        throw new Error(data.GET_STATS_LIST.RESULT.ERROR_MSG || "API Error");
      }

      return data.GET_STATS_LIST.DATALIST_INF.TABLE_INF;
    } catch (error) {
      console.error("統計表検索エラー:", error);
      throw error;
    }
  }

  /**
   * 統計表メタ情報取得（公式仕様準拠）
   */
  async getMetaInfo(statsDataId: string): Promise<any> {
    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId: statsDataId,
    });

    const url = `${this.baseUrl}/getMetaInfo?${params}`;
    console.log(`📋 メタ情報取得: ${url}`);

    try {
      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data.GET_META_INFO.RESULT.STATUS !== 0) {
        throw new Error(data.GET_META_INFO.RESULT.ERROR_MSG || "API Error");
      }

      return data.GET_META_INFO.METADATA_INF;
    } catch (error) {
      console.error("メタ情報取得エラー:", error);
      throw error;
    }
  }

  /**
   * 統計データ取得（公式仕様準拠）
   */
  async getStatsData(
    statsDataId: string,
    filters: Record<string, string> = {}
  ): Promise<any> {
    const params = new URLSearchParams({
      appId: this.appId,
      statsDataId: statsDataId,
      ...filters,
    });

    const url = `${this.baseUrl}/getStatsData?${params}`;
    console.log(`📊 データ取得: ${url}`);

    try {
      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data.GET_STATS_DATA.RESULT.STATUS !== 0) {
        throw new Error(data.GET_STATS_DATA.RESULT.ERROR_MSG || "API Error");
      }

      return data.GET_STATS_DATA.STATISTICAL_DATA;
    } catch (error) {
      console.error("データ取得エラー:", error);
      throw error;
    }
  }

  /**
   * 2017年経済センサスを検索
   */
  async find2017CensuvTables(): Promise<void> {
    console.log("🔍 2017年経済センサス活動調査を検索中...\n");

    try {
      // 検索キーワードを試行
      const searchTerms = [
        "平成29年経済センサス",
        "2017年経済センサス",
        "経済センサス活動調査",
        "小売業 経済センサス",
      ];

      for (const term of searchTerms) {
        console.log(`\n📝 検索語: "${term}"`);
        try {
          const tables = await this.searchStatsList(term);

          if (tables && tables.length > 0) {
            console.log(`✅ ${tables.length}件の統計表が見つかりました`);

            // 2017年関連を抽出
            const census2017 = tables.filter((table: any) => {
              const title = table.TITLE?.$ || table.STATISTICS_NAME || "";
              const statName = table.STAT_NAME?.$ || "";

              return (
                (title.includes("2017") ||
                  title.includes("平成29") ||
                  title.includes("平成２９") ||
                  statName.includes("2017") ||
                  statName.includes("平成29") ||
                  statName.includes("平成２９")) &&
                (title.includes("経済センサス") ||
                  statName.includes("経済センサス")) &&
                (title.includes("活動調査") ||
                  statName.includes("活動調査") ||
                  title.includes("市区町村") ||
                  title.includes("産業別"))
              );
            });

            if (census2017.length > 0) {
              console.log(
                `\n🎯 2017年経済センサス関連: ${census2017.length}件`
              );
              census2017.forEach((table: any, index: number) => {
                console.log(`\n${index + 1}. 統計表ID: ${table["@id"]}`);
                console.log(
                  `   タイトル: ${table.TITLE?.$ || table.STATISTICS_NAME}`
                );
                console.log(`   統計名: ${table.STAT_NAME?.$ || ""}`);
                console.log(`   調査日: ${table.SURVEY_DATE}`);
              });

              // 最初の候補でメタ情報を取得
              if (census2017.length > 0) {
                await this.investigateTable(census2017[0]["@id"]);
              }
              return;
            }
          }
        } catch (searchError) {
          console.log(`❌ "${term}" での検索に失敗: ${searchError}`);
        }
      }

      console.log("\n⚠️  2017年経済センサス活動調査が見つかりませんでした");
    } catch (error) {
      console.error("検索処理でエラー:", error);
    }
  }

  /**
   * 統計表の詳細調査
   */
  async investigateTable(statsDataId: string): Promise<void> {
    console.log(`\n🔍 統計表 ${statsDataId} の詳細調査`);

    try {
      const metaInfo = await this.getMetaInfo(statsDataId);

      console.log("\n📊 利用可能な分類軸:");
      if (metaInfo.CLASS_INF) {
        metaInfo.CLASS_INF.forEach((classInfo: any) => {
          console.log(`\n🏷️  ${classInfo["@name"]} (${classInfo["@code"]})`);

          if (classInfo.CLASS_OBJ) {
            const classes = Array.isArray(classInfo.CLASS_OBJ)
              ? classInfo.CLASS_OBJ
              : [classInfo.CLASS_OBJ];
            console.log(`   項目数: ${classes.length}`);

            // 小売業関連を探す
            const retailClasses = classes.filter((cls: any) => {
              const name = cls["@name"] || "";
              return (
                name.includes("小売") ||
                name.includes("卸売") ||
                name.includes("商業")
              );
            });

            if (retailClasses.length > 0) {
              console.log(`   🏪 小売・商業関連: ${retailClasses.length}件`);
              retailClasses.slice(0, 3).forEach((cls: any) => {
                console.log(`      - ${cls["@code"]}: ${cls["@name"]}`);
              });
            }
          }
        });
      }
    } catch (error) {
      console.error(`統計表 ${statsDataId} の調査に失敗:`, error);
    }
  }
}

/**
 * 公式API仕様で2017年データを検索
 */
export async function searchWithOfficialAPI(): Promise<void> {
  const appId = process.env.ESTAT_APP_ID;

  if (!appId) {
    console.error("❌ e-Stat App ID が設定されていません");
    return;
  }

  const api = new OfficialEstatAPI(appId);
  await api.find2017CensuvTables();
}

if (require.main === module) {
  searchWithOfficialAPI();
}
