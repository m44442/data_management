/**
 * e-Stat API を使用したデータ取得システム
 * 2014年経済センサス基礎調査データを自動取得
 */

interface EstatAPIConfig {
  appId: string;
  baseUrl: string;
  statsDataId: string; // 統計表ID
}

interface EstatAPIParams {
  cdArea?: string; // 地域コード
  cdCat01?: string; // 産業分類
  cdTime?: string; // 時間軸
  cdTab?: string; // 表章事項
  startPosition?: number;
  limit?: number;
  metaGetFlg?: string; // メタ情報取得フラグ
  cntGetFlg?: string; // 件数取得フラグ
  [key: string]: any; // その他のパラメータに対応
}

interface EstatAPIResponse {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: number;
      ERROR_MSG?: string;
    };
    STATISTICAL_DATA: {
      DATA_INF: any;
      CLASS_INF: any;
      DATA: {
        VALUE: Array<{
          "@area": string;
          "@cat01": string;
          "@time": string;
          "@unit": string;
          $: string;
        }>;
      };
    };
  };
}

export class EstatAPIClient {
  private config: EstatAPIConfig;

  constructor(appId: string, statsDataId?: string) {
    this.config = {
      appId: appId,
      baseUrl: "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData",
      statsDataId: statsDataId || "", // 実在するIDのみ使用
    };
  }

  /**
   * 統計表のメタ情報を取得
   */
  async getTableMetaInfo(): Promise<any> {
    if (!this.config.statsDataId) {
      throw new Error("統計表ID (statsDataId) が設定されていません。");
    }

    const metaUrl = "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo";
    const params = new URLSearchParams({
      appId: this.config.appId,
      statsDataId: this.config.statsDataId,
    });

    const url = `${metaUrl}?${params}`;

    try {
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.GET_META_INFO?.RESULT?.STATUS === 0) {
        return data.GET_META_INFO?.METADATA_INF;
      } else {
        console.error("メタ情報エラー:", data.GET_META_INFO?.RESULT?.ERROR_MSG);
        return null;
      }
    } catch (error) {
      console.error("メタ情報取得エラー:", error);
      return null;
    }
  }

  /**
   * 2014年小売業データを取得
   */
  async fetch2014RetailData(cityCodes: string[]): Promise<any[]> {
    if (!this.config.statsDataId) {
      throw new Error("統計表ID (statsDataId) が設定されていません。");
    }

    try {
      const response = await this.makeRequest({});
      return this.parseRetailData(response);
    } catch (error) {
      console.error("API request failed:", error);
      throw new Error(`e-Stat API エラー: ${error}`);
    }
  }

  /**
   * API リクエスト実行
   */
  public async makeRequest(params: EstatAPIParams): Promise<EstatAPIResponse> {
    const queryParams = new URLSearchParams({
      appId: this.config.appId,
      statsDataId: this.config.statsDataId,
      ...params,
    } as any);

    const url = `${this.config.baseUrl}?${queryParams}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as EstatAPIResponse;

    if (data.GET_STATS_DATA.RESULT.STATUS !== 0) {
      throw new Error(
        data.GET_STATS_DATA.RESULT.ERROR_MSG || "Unknown API error"
      );
    }

    return data;
  }

  /**
   * APIレスポンスの構造をデバッグ表示
   */
  public debugAPIResponse(response: any): void {
    console.log("🔍 APIレスポンス構造分析:");
    console.log("  - GET_STATS_DATA:", !!response.GET_STATS_DATA);

    if (response.GET_STATS_DATA) {
      console.log("  - RESULT.STATUS:", response.GET_STATS_DATA.RESULT?.STATUS);
      console.log(
        "  - STATISTICAL_DATA:",
        !!response.GET_STATS_DATA.STATISTICAL_DATA
      );

      if (response.GET_STATS_DATA.STATISTICAL_DATA) {
        const statData = response.GET_STATS_DATA.STATISTICAL_DATA;

        // 仕様書に基づく正しい構造チェック
        console.log("  - TABLE_INF:", !!statData.TABLE_INF);
        console.log("  - CLASS_INF:", !!statData.CLASS_INF);
        console.log("  - DATA_INF:", !!statData.DATA_INF);
        console.log("  - RESULT_INF:", !!statData.RESULT_INF);

        // DATA_INF内のVALUE要素チェック
        if (statData.DATA_INF && statData.DATA_INF.VALUE) {
          const values = Array.isArray(statData.DATA_INF.VALUE)
            ? statData.DATA_INF.VALUE
            : [statData.DATA_INF.VALUE];
          console.log(`  - VALUE配列: ${values.length}件のデータ`);
        } else if (statData.DATA_INF) {
          console.log("  - DATA_INF存在するがVALUE要素なし");
        }

        // 総件数情報
        if (statData.RESULT_INF?.TOTAL_NUMBER) {
          console.log(
            `  - TOTAL_NUMBER: ${statData.RESULT_INF.TOTAL_NUMBER}件`
          );
        }

        if (response.GET_STATS_DATA.STATISTICAL_DATA.DATA) {
          console.log(
            "  - VALUE:",
            !!response.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE
          );
          console.log(
            "  - VALUE配列長:",
            response.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE?.length ||
              "undefined"
          );
        }
      }
    }
  }

  /**
   * APIレスポンスを小売業データ形式にパース（安全版）
   */
  private parseRetailData(response: EstatAPIResponse): any[] {
    // デバッグ用：レスポンス構造を表示
    this.debugAPIResponse(response);

    // 安全なデータアクセス
    const statisticalData = response.GET_STATS_DATA?.STATISTICAL_DATA;
    if (!statisticalData) {
      console.log("⚠️  STATISTICAL_DATAが存在しません");
      return [];
    }

    const dataSection = statisticalData.DATA;
    if (!dataSection) {
      console.log("⚠️  DATAセクションが存在しません");
      return [];
    }

    const values = dataSection.VALUE;
    if (!values || !Array.isArray(values)) {
      console.log("⚠️  VALUE配列が存在しないか、配列ではありません");
      return [];
    }

    console.log(`📊 ${values.length}件のデータ項目を処理中...`);

    const cityData = new Map<string, any>();

    values.forEach((item, index) => {
      if (index < 5) {
        // 最初の5件をデバッグ表示
        console.log(
          `  [${index}] @area: ${item["@area"]}, @cat01: ${item["@cat01"]}, value: ${item.$}`
        );
      }

      const areaCode = item["@area"];
      const category = item["@cat01"];
      const value = parseFloat(item.$) || 0;

      if (!cityData.has(areaCode)) {
        cityData.set(areaCode, {
          areaCode: areaCode,
          year: 2014,
          establishments: 0,
          employees: 0,
          sales: 0,
          salesArea: 0,
        });
      }

      const data = cityData.get(areaCode);

      // カテゴリに応じてデータを集約
      if (category.includes("事業所数")) {
        data.establishments += value;
      } else if (category.includes("従業者数")) {
        data.employees += value;
      } else if (category.includes("売上") || category.includes("販売額")) {
        data.sales += value;
      } else if (category.includes("売場面積")) {
        data.salesArea += value;
      }
    });

    console.log(`🎯 処理結果: ${cityData.size}の地域データを生成`);
    return Array.from(cityData.values());
  }

  /**
   * 統計表一覧を検索して経済センサス関連データを探す
   */
  async searchRetailStatsTables(): Promise<any[]> {
    const searchUrl = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList";

    const params = new URLSearchParams({
      appId: this.config.appId,
      lang: "J",
      searchWord: "経済センサス", // より広範囲に検索
      searchKind: "2", // データセット検索
    });

    const url = `${searchUrl}?${params}`;
    console.log(`🔍 統計表検索: ${url}`);

    try {
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.GET_STATS_LIST?.RESULT?.STATUS === 0) {
        const allTables = data.GET_STATS_LIST?.DATALIST_INF?.TABLE_INF || [];
        console.log(`✅ ${allTables.length}件の統計表が見つかりました`);

        // デバッグ用：最初の5件の調査日を表示
        console.log("\n🔍 調査日の詳細分析（最初の5件）:");
        allTables.slice(0, 5).forEach((table: any, index: number) => {
          const title =
            table.TITLE?.$ || table.STATISTICS_NAME || "タイトル不明";
          const surveyDate = table.SURVEY_DATE;
          const updatedDate = table.UPDATED_DATE;

          console.log(`${index + 1}. ID: ${table["@id"]}`);
          console.log(`   タイトル: ${title}`);
          console.log(`   調査日: ${surveyDate} (型: ${typeof surveyDate})`);
          console.log(`   更新日: ${updatedDate}\n`);
        });

        return allTables;
      } else {
        console.error(
          "統計表検索エラー:",
          data.GET_STATS_LIST?.RESULT?.ERROR_MSG
        );
        return [];
      }
    } catch (error) {
      console.error("API検索エラー:", error);
      return [];
    }
  }
}

/**
 * 2014年データ用の都道府県別統計表IDマッピングを生成
 */
export async function generate2014StatsMapping(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";

  // Phase 1都市の都道府県コードと名前
  const prefectures = [
    { code: "11", name: "埼玉県" },
    { code: "12", name: "千葉県" },
    { code: "15", name: "新潟県" },
    { code: "21", name: "岐阜県" },
    { code: "25", name: "滋賀県" },
    { code: "38", name: "愛媛県" },
    { code: "41", name: "佐賀県" },
    { code: "43", name: "熊本県" },
    { code: "44", name: "大分県" },
    { code: "46", name: "鹿児島県" },
  ];

  console.log(
    "🎯 2014年経済センサス基礎調査データ - 都道府県別統計表IDマッピング\n"
  );

  try {
    const client = new EstatAPIClient(appId);
    const allTables = await client.searchRetailStatsTables();

    const mapping: any = {};

    // 調査日が2014年のデータをフィルタリング（数値型対応）
    const census2014Tables = allTables.filter((table: any) => {
      const surveyDate = table.SURVEY_DATE;
      if (typeof surveyDate === "number") {
        return surveyDate === 201407; // 2014年7月
      } else if (typeof surveyDate === "string") {
        return surveyDate.includes("2014") || surveyDate.includes("201407");
      }
      return false;
    });

    console.log(`📋 2014年データ: ${census2014Tables.length}件発見\n`);

    // 各都道府県の統計表を検索
    for (const pref of prefectures) {
      const prefTables = census2014Tables.filter((table: any) => {
        const title = table.TITLE?.$ || table.STATISTICS_NAME || "";
        const statName = table.STAT_NAME?.$ || "";

        return title.includes(pref.name) || statName.includes(pref.name);
      });

      if (prefTables.length > 0) {
        const bestTable =
          prefTables.find((table: any) => {
            const title = table.TITLE?.$ || table.STATISTICS_NAME || "";
            return (
              title.includes("産業") &&
              title.includes("事業所") &&
              title.includes("従業者")
            );
          }) || prefTables[0];

        const tableTitle =
          bestTable.TITLE?.$ || bestTable.STATISTICS_NAME || "[タイトル不明]";

        mapping[pref.code] = {
          prefectureName: pref.name,
          statsDataId: bestTable["@id"],
          title: tableTitle,
          surveyDate: bestTable.SURVEY_DATE,
        };

        console.log(`✅ ${pref.name} (${pref.code}): ${bestTable["@id"]}`);
        console.log(`   📊 ${tableTitle}`);
        console.log(`   📅 調査日: ${bestTable.SURVEY_DATE}\n`);
      } else {
        console.log(
          `❌ ${pref.name} (${pref.code}): 統計表が見つかりませんでした\n`
        );
      }
    }

    // マッピング結果をJSONファイルとして保存
    const fs = require("fs");
    const mappingJson = JSON.stringify(mapping, null, 2);
    fs.writeFileSync(
      "data/processed/2014_stats_mapping.json",
      mappingJson,
      "utf8"
    );

    console.log(
      `\n💾 統計表IDマッピングを保存: data/processed/2014_stats_mapping.json`
    );
    console.log(
      `📊 合計 ${Object.keys(mapping).length} 都道府県のデータが利用可能`
    );
  } catch (error) {
    console.error("❌ 2014年統計表マッピング生成エラー:", error);
  }
}

/**
 * 2014年データ取得の実行関数
 */
export async function fetch2014DataViaAPI(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";

  console.log("🎯 2014年経済センサス基礎調査データ取得開始\n");

  try {
    // マッピングファイルを読み込み
    const fs = require("fs");
    const mappingData = JSON.parse(
      fs.readFileSync("data/processed/2014_stats_mapping.json", "utf8")
    );

    const allData: any[] = [];

    // 各都道府県のデータを取得
    for (const [prefCode, prefInfo] of Object.entries(mappingData as any)) {
      const info: any = prefInfo; // 型安全性のため
      console.log(`🔄 ${info.prefectureName} (${prefCode}) のデータ取得中...`);
      console.log(`   統計表ID: ${info.statsDataId}`);

      try {
        const client = new EstatAPIClient(appId, info.statsDataId);

        // メタ情報を取得して構造を確認
        const metaInfo = await client.getTableMetaInfo();

        if (metaInfo) {
          console.log(`   ✅ メタ情報取得成功`);

          // 実際のデータ取得（簡易版）
          const data = await client.fetch2014RetailData([]);

          if (data && data.length > 0) {
            allData.push(...data);
            console.log(`   📊 ${data.length}件のデータを取得`);
          } else {
            console.log(`   ⚠️  データが空でした`);
          }
        }
      } catch (error) {
        console.error(`   ❌ ${info.prefectureName}のデータ取得エラー:`, error);
      }

      console.log(""); // 空行
    }

    console.log(
      `\n🎉 取得完了: 合計 ${allData.length} 件のデータを取得しました`
    );

    if (allData.length > 0) {
      // CSVファイルとして保存
      const csvContent = convert2014ToCSV(allData);
      fs.writeFileSync("data/raw/estat-2014-api.csv", csvContent, "utf8");
      console.log("💾 data/raw/estat-2014-api.csv として保存しました");
    }
  } catch (error) {
    console.error("❌ 2014年データ取得エラー:", error);
  }
}

/**
 * 2014年データをCSV形式に変換
 */
function convert2014ToCSV(data: any[]): string {
  const headers = [
    "area_code",
    "year",
    "establishments",
    "employees",
    "sales",
    "salesArea",
  ];
  const rows = data.map((item) => [
    item.areaCode,
    item.year || 2014,
    item.establishments || 0,
    item.employees || 0,
    item.sales || 0,
    item.salesArea || 0,
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

/**
 * メタ情報から正しいパラメータコードを解析
 */
export async function analyzeStatsTableStructure(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";

  // 埼玉県の統計表を例として詳細分析
  const testStatsId = "8003005201";
  console.log(`🔬 統計表構造分析: ${testStatsId} (埼玉県)`);

  try {
    const client = new EstatAPIClient(appId, testStatsId);
    const metaInfo = await client.getTableMetaInfo();

    if (metaInfo && metaInfo.CLASS_INF) {
      console.log("\n📋 利用可能な分類軸:");

      metaInfo.CLASS_INF.CLASS_OBJ.forEach((classObj: any, index: number) => {
        console.log(
          `\n${index + 1}. ${classObj["@name"]} (ID: ${classObj["@id"]})`
        );

        if (classObj.CLASS) {
          const classes = Array.isArray(classObj.CLASS)
            ? classObj.CLASS
            : [classObj.CLASS];

          // 小売業関連のコードを探す
          const retailRelated = classes.filter((cls: any) => {
            const name = cls["@name"] || "";
            return (
              name.includes("小売") ||
              name.includes("卸売") ||
              name.includes("I") ||
              name.includes("商業") ||
              name.includes("Ｉ") ||
              name.includes("59")
            );
          });

          console.log(`   📊 全項目数: ${classes.length}件`);
          console.log(`   🏪 小売業関連: ${retailRelated.length}件`);

          if (retailRelated.length > 0) {
            console.log("   💡 小売業関連コード:");
            retailRelated.forEach((cls: any) => {
              console.log(`     - ${cls["@code"]}: ${cls["@name"]}`);
            });
          }

          // 最初の10件を表示
          console.log("   📝 項目例（最初の10件）:");
          classes.slice(0, 10).forEach((cls: any) => {
            console.log(`     - ${cls["@code"]}: ${cls["@name"]}`);
          });
        }
      });

      // APIパラメータ構築例を表示
      console.log("\n🎯 推奨APIパラメータ構築:");
      if (metaInfo.CLASS_INF.CLASS_OBJ.length > 0) {
        metaInfo.CLASS_INF.CLASS_OBJ.forEach((classObj: any, index: number) => {
          console.log(
            `   cd${classObj["@id"]}: [選択したコード] // ${classObj["@name"]}`
          );
        });
      }
    }
  } catch (error) {
    console.error("❌ メタ情報分析エラー:", error);
  }
}

/**
 * 正しいパラメータでAPIデータ取得テスト
 */
export async function testAPIWithParameters(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";
  const testStatsId = "8003005201"; // 埼玉県

  console.log("🧪 階層レベル指定APIテスト開始");

  try {
    const client = new EstatAPIClient(appId, testStatsId);

    // 階層レベル指定を使用（仕様書3.4統計データ取得より）
    const levelParams = {
      cdCat01: "0010", // 全産業の事業所数（最も基本的なデータ）
      lvArea: "1", // 地域事項の階層レベル1（最上位階層）
    };

    console.log("📡 階層レベル指定APIリクエスト実行中...");
    console.log("🎯 パラメータ:", levelParams);

    const response = await client.makeRequest(levelParams);

    console.log("✅ APIレスポンス受信成功");
    client.debugAPIResponse(response);

    if (response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA?.VALUE) {
      console.log(
        `🎉 データ取得成功: ${response.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE.length}件`
      );

      // データの詳細を表示
      const values = response.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE;
      console.log("\n📊 取得データ詳細:");
      values.forEach((item: any, index: number) => {
        console.log(
          `${index + 1}. 地域:${item["@area"]}, 分類:${item["@cat01"]}, 値:${item.$}`
        );
      });

      // 小売業データでも試す
      console.log("\n🏪 小売業データテスト...");
      const retailParams = {
        cdCat01: "0120", // 小売業事業所数
        lvArea: "1", // 地域事項の階層レベル1
      };

      const retailResponse = await client.makeRequest(retailParams);
      client.debugAPIResponse(retailResponse);

      if (retailResponse.GET_STATS_DATA?.STATISTICAL_DATA?.DATA?.VALUE) {
        console.log(
          `🛍️ 小売業データ取得成功: ${retailResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE.length}件`
        );
      }
    } else {
      console.log("⚠️ 階層レベル1でもデータなし。最小限パラメータでテスト...");

      // 最も基本的なパラメータ
      const minParams = {
        cdCat01: "0010", // 全産業事業所数
      };

      const minResponse = await client.makeRequest(minParams);
      client.debugAPIResponse(minResponse);

      if (minResponse.GET_STATS_DATA?.STATISTICAL_DATA?.DATA?.VALUE) {
        console.log(
          `🎊 最小限パラメータ成功: ${minResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE.length}件`
        );

        // 最初の10件を表示
        const values = minResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE;
        console.log("\n📊 全データ（最初の10件）:");
        values.slice(0, 10).forEach((item: any, index: number) => {
          console.log(
            `${index + 1}. 地域:${item["@area"]}, 分類:${item["@cat01"]}, 値:${item.$}`
          );
        });
      }
    }
  } catch (error) {
    console.error("❌ APIテストエラー:", error);
  }
}

/**
 * 地域コードを詳細分析する関数
 */
export async function analyzeAreaCodes(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";
  const testStatsId = "8003005201"; // 埼玉県

  console.log("🗾 地域コード詳細分析開始");

  try {
    const client = new EstatAPIClient(appId, testStatsId);
    const metaInfo = await client.getTableMetaInfo();

    if (metaInfo && metaInfo.CLASS_INF) {
      const areaClass = metaInfo.CLASS_INF.CLASS_OBJ.find(
        (cls: any) => cls["@id"] === "area"
      );

      if (areaClass && areaClass.CLASS) {
        const areas = Array.isArray(areaClass.CLASS)
          ? areaClass.CLASS
          : [areaClass.CLASS];

        console.log(`📍 利用可能地域コード: ${areas.length}件`);

        // 県レベルのコードを探す
        const prefectureLevelCodes = areas.filter((area: any) => {
          const name = area["@name"] || "";
          return (
            name.includes("埼玉県") &&
            !name.includes("市") &&
            !name.includes("区") &&
            !name.includes("町")
          );
        });

        console.log("\n🏛️ 県レベルコード:");
        prefectureLevelCodes.forEach((area: any) => {
          console.log(`  - ${area["@code"]}: ${area["@name"]}`);
        });

        // 市レベルのコードを探す（越谷市関連）
        const cityLevelCodes = areas.filter((area: any) => {
          const name = area["@name"] || "";
          return name.includes("越谷") || name.includes("さいたま");
        });

        console.log("\n🏙️ 主要都市コード:");
        cityLevelCodes.slice(0, 10).forEach((area: any) => {
          console.log(`  - ${area["@code"]}: ${area["@name"]}`);
        });

        // 最も汎用的と思われるコードでテスト
        if (prefectureLevelCodes.length > 0) {
          const testAreaCode = prefectureLevelCodes[0]["@code"];
          console.log(`\n🧪 テスト用地域コード: ${testAreaCode}`);

          const testParams = {
            cdCat01: "0010", // 全産業事業所数
            cdArea: testAreaCode,
          };

          console.log("📡 地域コード検証中...");
          try {
            const response = await client.makeRequest(testParams);
            client.debugAPIResponse(response);

            if (response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA?.VALUE) {
              console.log(
                `✅ 検証成功: ${response.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE.length}件取得`
              );
            }
          } catch (testError: any) {
            console.log("⚠️ このコードでは該当データなし:", testError.message);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ 地域コード分析エラー:", error);
  }
}

/**
 * パラメータなしでデータ取得テスト（統計表の実際の構造確認）
 */
export async function testRawDataRetrieval(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";
  const testStatsId = "8003005201"; // 埼玉県

  console.log("🔍 パラメータなし全データ取得テスト");

  try {
    const client = new EstatAPIClient(appId, testStatsId);

    // パラメータを一切指定せずに全データ取得
    const response = await client.makeRequest({});

    console.log("✅ APIレスポンス受信成功");
    client.debugAPIResponse(response);

    if (response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA?.VALUE) {
      const values = response.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE;
      console.log(`🎉 全データ取得成功: ${values.length}件`);

      // 最初の20件を詳細表示
      console.log("\n📊 実際のデータ構造（最初の20件）:");
      values.slice(0, 20).forEach((item: any, index: number) => {
        console.log(
          `${index + 1}. 表章:${item["@tab"]}, 分類:${item["@cat01"]}, 地域:${item["@area"]}, 時間:${item["@time"]}, 値:${item.$}`
        );
      });

      // データの統計情報
      const uniqueAreas = [...new Set(values.map((v: any) => v["@area"]))];
      const uniqueCat01 = [...new Set(values.map((v: any) => v["@cat01"]))];
      const uniqueTabs = [...new Set(values.map((v: any) => v["@tab"]))];

      console.log("\n📈 データ統計:");
      console.log(`  地域種類: ${uniqueAreas.length}種類`);
      console.log(`  分類種類: ${uniqueCat01.length}種類`);
      console.log(`  表章種類: ${uniqueTabs.length}種類`);

      console.log("\n🗾 地域コード例:");
      uniqueAreas.slice(0, 10).forEach((area) => {
        console.log(`  - ${area}`);
      });

      console.log("\n🏢 分類コード例:");
      uniqueCat01.slice(0, 10).forEach((cat) => {
        console.log(`  - ${cat}`);
      });
    } else {
      console.log("⚠️ パラメータなしでもデータ取得できませんでした");

      // レスポンス詳細を確認
      console.log("\n🔬 レスポンス詳細分析:");
      if (response.GET_STATS_DATA?.STATISTICAL_DATA) {
        const statData = response.GET_STATS_DATA.STATISTICAL_DATA as any;
        console.log("  TABLE_INF存在:", !!statData.TABLE_INF);
        console.log("  CLASS_INF存在:", !!statData.CLASS_INF);
        console.log("  DATA_INF存在:", !!statData.DATA_INF);
        console.log("  RESULT_INF存在:", !!statData.RESULT_INF);

        if (statData.RESULT_INF) {
          console.log("  TOTAL_NUMBER:", statData.RESULT_INF.TOTAL_NUMBER);
        }
      }
    }
  } catch (error) {
    console.error("❌ パラメータなしテストエラー:", error);
  }
}

/**
 * 制限付きデータ取得テスト（TOTAL_NUMBER=309,396判明のため）
 */
export async function testLimitedDataRetrieval(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";
  const testStatsId = "8003005201"; // 埼玉県

  console.log("📊 制限付きデータ取得テスト（TOTAL_NUMBER=309,396対応）");

  try {
    const client = new EstatAPIClient(appId, testStatsId);

    // 最初の100件を取得
    const limitParams = {
      limit: 100, // 最初の100件に制限
    };

    console.log("📡 制限付きAPIリクエスト実行中...");
    console.log("🎯 パラメータ:", limitParams);

    const response = await client.makeRequest(limitParams);

    console.log("✅ APIレスポンス受信成功");
    client.debugAPIResponse(response);

    if (response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA?.VALUE) {
      const values = response.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE;
      console.log(`🎉 制限付きデータ取得成功: ${values.length}件`);

      // 実際のデータ構造を詳細表示
      console.log("\n📊 実際のデータ構造（最初の10件）:");
      values.slice(0, 10).forEach((item: any, index: number) => {
        console.log(
          `${index + 1}. 表章:${item["@tab"]}, 分類:${item["@cat01"]}, 地域:${item["@area"]}, 時間:${item["@time"]}, 値:${item.$}`
        );
      });

      // データの統計情報
      const uniqueAreas = [...new Set(values.map((v: any) => v["@area"]))];
      const uniqueCat01 = [...new Set(values.map((v: any) => v["@cat01"]))];
      const uniqueTabs = [...new Set(values.map((v: any) => v["@tab"]))];

      console.log("\n📈 データ統計（100件サンプル）:");
      console.log(`  地域種類: ${uniqueAreas.length}種類`);
      console.log(`  分類種類: ${uniqueCat01.length}種類`);
      console.log(`  表章種類: ${uniqueTabs.length}種類`);

      console.log("\n🗾 実際の地域コード:");
      uniqueAreas.slice(0, 10).forEach((area) => {
        console.log(`  - ${area}`);
      });

      console.log("\n🏢 実際の分類コード:");
      uniqueCat01.slice(0, 10).forEach((cat) => {
        console.log(`  - ${cat}`);
      });

      // 小売業関連データを探す
      const retailData = values.filter(
        (v: any) => v["@cat01"] === "0120" || v["@cat01"] === "0440"
      );

      console.log(`\n🛍️ 小売業関連データ: ${retailData.length}件`);
      if (retailData.length > 0) {
        console.log("小売業データ例:");
        retailData.slice(0, 5).forEach((item: any, index: number) => {
          console.log(
            `  ${index + 1}. 分類:${item["@cat01"]}, 地域:${item["@area"]}, 値:${item.$}`
          );
        });
      }
    } else {
      console.log("⚠️ 制限付きでもデータ取得できませんでした");
    }
  } catch (error) {
    console.error("❌ 制限付きテストエラー:", error);
  }
}

/**
 * 複数統計表IDでのテスト
 */
export async function testMultipleStatsIds(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";

  const testIds = [
    { id: "8003005201", name: "埼玉県" },
    { id: "8003005191", name: "千葉県" },
    { id: "8003005181", name: "新潟県" },
  ];

  console.log("🧪 複数統計表IDテスト");

  for (const testData of testIds) {
    console.log(`\n📋 ${testData.name}（ID: ${testData.id}）をテスト中...`);

    try {
      const client = new EstatAPIClient(appId, testData.id);

      // 最小限のパラメータでテスト
      const response = await client.makeRequest({ limit: 10 });

      console.log(`✅ ${testData.name} APIレスポンス受信`);

      if (response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA?.VALUE) {
        const values = response.GET_STATS_DATA.STATISTICAL_DATA.DATA.VALUE;
        console.log(`🎉 ${testData.name} データ取得成功: ${values.length}件`);

        // 最初の3件を表示
        values.slice(0, 3).forEach((item: any, index: number) => {
          console.log(
            `  ${index + 1}. 表章:${item["@tab"]}, 分類:${item["@cat01"]}, 地域:${item["@area"]}, 値:${item.$}`
          );
        });

        // この統計表IDが成功したら詳細テストに進む
        console.log(
          `✨ ${testData.name}でデータ取得成功！この統計表IDを使用します`
        );
        break;
      } else {
        console.log(`⚠️ ${testData.name} DATAセクション不在`);

        // レスポンス詳細確認
        if (response.GET_STATS_DATA?.STATISTICAL_DATA) {
          const statData = response.GET_STATS_DATA.STATISTICAL_DATA as any;
          if (statData.RESULT_INF?.TOTAL_NUMBER) {
            console.log(`  総件数: ${statData.RESULT_INF.TOTAL_NUMBER}件`);
          }
        }
      }
    } catch (error: any) {
      console.error(`❌ ${testData.name} エラー:`, error.message);
    }
  }
}

/**
 * 仕様書に基づく正しい絞り込み条件でのデータ取得テスト
 */
export async function testProperNarrowingConditions(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";
  const testStatsId = "8003005201"; // 埼玉県

  console.log("🎯 仕様書準拠の絞り込み条件テスト");
  console.log('📖 仕様書サンプル: CODE_TAB_SELECT="006" で表章事項を絞り込み');

  try {
    const client = new EstatAPIClient(appId, testStatsId);

    // 仕様書のサンプルと同じ形式でパラメータ指定
    const narrowingParams = {
      cdTab: "0010", // 表章事項: 全産業事業所数（メタ情報で確認済み）
      limit: 100,
      metaGetFlg: "Y",
      cntGetFlg: "N",
    } as any;

    console.log("📡 絞り込み条件指定APIリクエスト実行中...");
    console.log("🎯 パラメータ:", narrowingParams);

    const response = await client.makeRequest(narrowingParams);

    console.log("✅ APIレスポンス受信成功");
    client.debugAPIResponse(response);

    // 仕様書に基づく正しい構造でチェック
    if (response.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
      const values = Array.isArray(
        response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
      )
        ? response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
        : [response.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE];
      console.log(`🎉 絞り込み条件指定でデータ取得成功: ${values.length}件`);

      // 実際に取得されたデータの詳細表示
      console.log("\n📊 取得データ詳細（最初の10件）:");
      values.slice(0, 10).forEach((item: any, index: number) => {
        console.log(
          `${index + 1}. tab:${item["@tab"]}, cat01:${item["@cat01"]}, area:${item["@area"]}, time:${item["@time"]}, 値:${item.$}`
        );
      });

      // 小売業関連データを探す（メタ情報で確認した0120, 0440）
      console.log("\n🛍️ 小売業関連パラメータでリトライ...");
      const retailParams = {
        cdCat01: "0120", // 小売業事業所数
        limit: 50,
      } as any;

      const retailResponse = await client.makeRequest(retailParams);

      if (retailResponse.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE) {
        const retailValues = Array.isArray(
          retailResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
        )
          ? retailResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
          : [retailResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE];
        console.log(`🏪 小売業データ取得成功: ${retailValues.length}件`);

        retailValues.slice(0, 5).forEach((item: any, index: number) => {
          console.log(
            `${index + 1}. 小売業 - area:${item["@area"]}, 値:${item.$}`
          );
        });
      } else {
        console.log("⚠️ 小売業データ取得できませんでした");
      }
    } else {
      console.log("⚠️ 絞り込み条件指定でもDATA_INF取得できませんでした");

      // さらにシンプルなパラメータでテスト
      console.log("\n🔄 最もシンプルなパラメータでリトライ...");
      const simpleParams = {
        limit: 10,
        startPosition: 1,
      } as any;

      const simpleResponse = await client.makeRequest(simpleParams);
      client.debugAPIResponse(simpleResponse);

      if (simpleResponse.GET_STATS_DATA?.STATISTICAL_DATA) {
        const statData = simpleResponse.GET_STATS_DATA.STATISTICAL_DATA as any;
        console.log("📊 統計データ詳細:");
        console.log("  - TABLE_INF存在:", !!statData.TABLE_INF);
        console.log("  - CLASS_INF存在:", !!statData.CLASS_INF);
        console.log("  - DATA_INF存在:", !!statData.DATA_INF);

        if (statData.RESULT_INF) {
          console.log("  - TOTAL_NUMBER:", statData.RESULT_INF.TOTAL_NUMBER);
          console.log("  - FROM_NUMBER:", statData.RESULT_INF.FROM_NUMBER);
          console.log("  - TO_NUMBER:", statData.RESULT_INF.TO_NUMBER);
          console.log("  - NEXT_KEY:", statData.RESULT_INF.NEXT_KEY);
        }
      }
    }
  } catch (error: any) {
    console.error("❌ 絞り込み条件テストエラー:", error.message);
  }
}

/**
 * 全10都道府県からの2014年小売業データ本格収集
 */
export async function collect2014RetailDataFromAllPrefectures(): Promise<void> {
  const appId =
    process.env.ESTAT_APP_ID || "facfeda71497babcd5e8e6a16de386efb8254d28";

  console.log("🏪 全10都道府県2014年小売業データ本格収集開始");

  try {
    // 2014_stats_mapping.jsonを読み込み
    const fs = require("fs");
    const path = require("path");
    const mappingPath = path.join(
      __dirname,
      "../../data/processed/2014_stats_mapping.json"
    );
    const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));

    const collectedData: any[] = [];

    console.log(`📊 対象都道府県: ${Object.keys(mapping).length}件`);

    for (const [prefCode, prefData] of Object.entries(mapping as any)) {
      const pref = prefData as any;
      console.log(
        `\n🏛️ ${pref.prefectureName}（統計表ID: ${pref.statsDataId}）処理中...`
      );

      try {
        const client = new EstatAPIClient(appId, pref.statsDataId);

        // 小売業事業所数データを取得
        const retailEstablishmentParams = {
          cdCat01: "0120", // 小売業事業所数
          limit: 1000, // 十分な数を取得
        };

        console.log("  📡 小売業事業所数データ取得中...");
        const establishmentResponse = await client.makeRequest(
          retailEstablishmentParams
        );

        if (
          establishmentResponse.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF
            ?.VALUE
        ) {
          const values = Array.isArray(
            establishmentResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
          )
            ? establishmentResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF
                .VALUE
            : [
                establishmentResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF
                  .VALUE,
              ];

          console.log(`  ✅ 事業所数データ: ${values.length}件取得`);

          // データを加工して保存
          for (const value of values) {
            collectedData.push({
              prefectureCode: prefCode,
              prefectureName: pref.prefectureName,
              statsDataId: pref.statsDataId,
              areaCode: value["@area"],
              categoryCode: value["@cat01"], // 0120 = 小売業事業所数
              dataType: "establishments", // 事業所数
              value: parseInt(value.$) || 0,
              unit: value["@unit"] || "事業所",
              year: 2014,
              surveyDate: pref.surveyDate,
            });
          }
        } else {
          console.log("  ⚠️ 事業所数データ取得できませんでした");
        }

        // 小売業従業者数データも取得
        const retailEmployeeParams = {
          cdCat01: "0440", // 小売業従業者数
          limit: 1000,
        };

        console.log("  📡 小売業従業者数データ取得中...");
        const employeeResponse = await client.makeRequest(retailEmployeeParams);

        if (
          employeeResponse.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE
        ) {
          const values = Array.isArray(
            employeeResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
          )
            ? employeeResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE
            : [employeeResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE];

          console.log(`  ✅ 従業者数データ: ${values.length}件取得`);

          // データを加工して保存
          for (const value of values) {
            collectedData.push({
              prefectureCode: prefCode,
              prefectureName: pref.prefectureName,
              statsDataId: pref.statsDataId,
              areaCode: value["@area"],
              categoryCode: value["@cat01"], // 0440 = 小売業従業者数
              dataType: "employees", // 従業者数
              value: parseInt(value.$) || 0,
              unit: value["@unit"] || "人",
              year: 2014,
              surveyDate: pref.surveyDate,
            });
          }
        } else {
          console.log("  ⚠️ 従業者数データ取得できませんでした");
        }

        // APIレート制限対策で少し待機
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`  ❌ ${pref.prefectureName} エラー:`, error.message);
      }
    }

    console.log(`\n🎉 データ収集完了: 総計${collectedData.length}レコード`);

    // 収集データの統計
    const byPrefecture = collectedData.reduce((acc: any, item) => {
      acc[item.prefectureName] = (acc[item.prefectureName] || 0) + 1;
      return acc;
    }, {});

    const byDataType = collectedData.reduce((acc: any, item) => {
      acc[item.dataType] = (acc[item.dataType] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📈 収集データ統計:");
    console.log("都道府県別:");
    Object.entries(byPrefecture).forEach(([pref, count]) => {
      console.log(`  - ${pref}: ${count}件`);
    });

    console.log("\nデータタイプ別:");
    Object.entries(byDataType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}件`);
    });

    // データをJSONファイルに保存
    const outputPath = path.join(
      __dirname,
      "../../data/processed/2014_retail_data_api.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(collectedData, null, 2));
    console.log(`\n💾 データ保存完了: ${outputPath}`);

    // サンプルデータ表示
    console.log("\n📊 収集データサンプル（最初の10件）:");
    collectedData.slice(0, 10).forEach((item, index) => {
      console.log(
        `${index + 1}. ${item.prefectureName} - ${item.dataType}: ${item.value}${item.unit}`
      );
    });
  } catch (error: any) {
    console.error("❌ 全都道府県データ収集エラー:", error.message);
  }
}

// 実行例
if (require.main === module) {
  // 全10都道府県から2014年小売業データを本格収集
  collect2014RetailDataFromAllPrefectures();
}
