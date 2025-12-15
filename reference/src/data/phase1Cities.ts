/**
 * Phase 1: 確実データ取得対象都市（10都市）
 * 大型商業施設の影響が明確で、e-Statでデータ取得が確実な都市
 */

export interface Phase1CityInfo {
  prefectureCode: string;
  prefectureName: string;
  cityCode: string;
  cityName: string;
  region: string;
  population: number; // 概算人口（2020年）
  largeRetailFacility: {
    name: string;
    openYear: number;
    type: string;
  };
  researchPriority: number; // 1-5 (5が最高)
}

export const PHASE1_CITIES: Phase1CityInfo[] = [
  // 関東圏（最優先）
  {
    prefectureCode: "11",
    prefectureName: "埼玉県",
    cityCode: "11222",
    cityName: "越谷市",
    region: "関東",
    population: 344000,
    largeRetailFacility: {
      name: "イオンレイクタウン",
      openYear: 2008,
      type: "イオンモール（日本最大級）",
    },
    researchPriority: 5,
  },
  {
    prefectureCode: "12",
    prefectureName: "千葉県",
    cityCode: "12217",
    cityName: "柏市",
    region: "関東",
    population: 433000,
    largeRetailFacility: {
      name: "イオンモール柏",
      openYear: 2006,
      type: "イオンモール",
    },
    researchPriority: 5,
  },

  // 関西圏
  {
    prefectureCode: "25",
    prefectureName: "滋賀県",
    cityCode: "25201",
    cityName: "大津市",
    region: "近畿",
    population: 342000,
    largeRetailFacility: {
      name: "イオンモール草津",
      openYear: 2008,
      type: "イオンモール",
    },
    researchPriority: 4,
  },

  // 中部圏
  {
    prefectureCode: "21",
    prefectureName: "岐阜県",
    cityCode: "21201",
    cityName: "岐阜市",
    region: "中部",
    population: 408000,
    largeRetailFacility: {
      name: "イオンモール各務原",
      openYear: 2007,
      type: "イオンモール",
    },
    researchPriority: 4,
  },
  {
    prefectureCode: "15",
    prefectureName: "新潟県",
    cityCode: "15100",
    cityName: "新潟市",
    region: "中部",
    population: 810000,
    largeRetailFacility: {
      name: "イオンモール新潟南",
      openYear: 2007,
      type: "イオンモール",
    },
    researchPriority: 4,
  },

  // 四国・中国圏
  {
    prefectureCode: "38",
    prefectureName: "愛媛県",
    cityCode: "38201",
    cityName: "松山市",
    region: "四国",
    population: 515000,
    largeRetailFacility: {
      name: "イオンモール今治新都市",
      openYear: 2006,
      type: "イオンモール",
    },
    researchPriority: 4,
  },

  // 九州圏（高研究価値）
  {
    prefectureCode: "44",
    prefectureName: "大分県",
    cityCode: "44201",
    cityName: "大分市",
    region: "九州",
    population: 478000,
    largeRetailFacility: {
      name: "イオンモール挾間",
      openYear: 2004,
      type: "イオンモール",
    },
    researchPriority: 4,
  },
  {
    prefectureCode: "41",
    prefectureName: "佐賀県",
    cityCode: "41201",
    cityName: "佐賀市",
    region: "九州",
    population: 232000,
    largeRetailFacility: {
      name: "イオンモール佐賀大和",
      openYear: 2007,
      type: "イオンモール",
    },
    researchPriority: 4,
  },
  {
    prefectureCode: "43",
    prefectureName: "熊本県",
    cityCode: "43100",
    cityName: "熊本市",
    region: "九州",
    population: 738000,
    largeRetailFacility: {
      name: "イオンモール熊本",
      openYear: 2007,
      type: "イオンモール",
    },
    researchPriority: 4,
  },
  {
    prefectureCode: "46",
    prefectureName: "鹿児島県",
    cityCode: "46201",
    cityName: "鹿児島市",
    region: "九州",
    population: 599000,
    largeRetailFacility: {
      name: "イオンモール鹿児島",
      openYear: 2007,
      type: "イオンモール",
    },
    researchPriority: 4,
  },
];

/**
 * Phase 1都市の地域コード一覧を取得
 */
export function getPhase1CityCodes(): string[] {
  return PHASE1_CITIES.map((city) => city.cityCode);
}

/**
 * 地域コードから都市情報を取得
 */
export function getCityInfoByCode(
  cityCode: string
): Phase1CityInfo | undefined {
  return PHASE1_CITIES.find((city) => city.cityCode === cityCode);
}

/**
 * 地域別の都市数を取得
 */
export function getCitiesByRegion(): { [region: string]: Phase1CityInfo[] } {
  return PHASE1_CITIES.reduce(
    (acc, city) => {
      if (!acc[city.region]) {
        acc[city.region] = [];
      }
      acc[city.region].push(city);
      return acc;
    },
    {} as { [region: string]: Phase1CityInfo[] }
  );
}

/**
 * 研究優先度順の都市リストを取得
 */
export function getCitiesByPriority(): Phase1CityInfo[] {
  return PHASE1_CITIES.sort((a, b) => b.researchPriority - a.researchPriority);
}
