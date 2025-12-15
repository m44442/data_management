/**
 * 全国47都道府県庁所在地の都市コードマッピング
 * e-Statデータでの地域コードと対応
 */

export interface CityInfo {
  prefectureCode: string;
  prefectureName: string;
  cityCode: string;
  cityName: string;
  region: string;
  population: number; // 概算人口（2020年）
  hasLargeRetailFacility: boolean; // 大型商業施設の有無
}

export const NATIONWIDE_CITIES: CityInfo[] = [
  // 北海道・東北
  {
    prefectureCode: "01",
    prefectureName: "北海道",
    cityCode: "01100",
    cityName: "札幌市",
    region: "北海道",
    population: 1973000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "02",
    prefectureName: "青森県",
    cityCode: "02201",
    cityName: "青森市",
    region: "東北",
    population: 278000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "03",
    prefectureName: "岩手県",
    cityCode: "03201",
    cityName: "盛岡市",
    region: "東北",
    population: 290000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "04",
    prefectureName: "宮城県",
    cityCode: "04100",
    cityName: "仙台市",
    region: "東北",
    population: 1096000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "05",
    prefectureName: "秋田県",
    cityCode: "05201",
    cityName: "秋田市",
    region: "東北",
    population: 305000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "06",
    prefectureName: "山形県",
    cityCode: "06201",
    cityName: "山形市",
    region: "東北",
    population: 248000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "07",
    prefectureName: "福島県",
    cityCode: "07201",
    cityName: "福島市",
    region: "東北",
    population: 283000,
    hasLargeRetailFacility: true,
  },

  // 関東
  {
    prefectureCode: "08",
    prefectureName: "茨城県",
    cityCode: "08201",
    cityName: "水戸市",
    region: "関東",
    population: 270000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "09",
    prefectureName: "栃木県",
    cityCode: "09201",
    cityName: "宇都宮市",
    region: "関東",
    population: 519000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "10",
    prefectureName: "群馬県",
    cityCode: "10201",
    cityName: "前橋市",
    region: "関東",
    population: 335000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "11",
    prefectureName: "埼玉県",
    cityCode: "11100",
    cityName: "さいたま市",
    region: "関東",
    population: 1324000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "12",
    prefectureName: "千葉県",
    cityCode: "12100",
    cityName: "千葉市",
    region: "関東",
    population: 980000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "13",
    prefectureName: "東京都",
    cityCode: "13101",
    cityName: "千代田区",
    region: "関東",
    population: 66000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "14",
    prefectureName: "神奈川県",
    cityCode: "14100",
    cityName: "横浜市",
    region: "関東",
    population: 3749000,
    hasLargeRetailFacility: true,
  },

  // 中部
  {
    prefectureCode: "15",
    prefectureName: "新潟県",
    cityCode: "15100",
    cityName: "新潟市",
    region: "中部",
    population: 801000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "16",
    prefectureName: "富山県",
    cityCode: "16201",
    cityName: "富山市",
    region: "中部",
    population: 417000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "17",
    prefectureName: "石川県",
    cityCode: "17201",
    cityName: "金沢市",
    region: "中部",
    population: 466000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "18",
    prefectureName: "福井県",
    cityCode: "18201",
    cityName: "福井市",
    region: "中部",
    population: 264000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "19",
    prefectureName: "山梨県",
    cityCode: "19201",
    cityName: "甲府市",
    region: "中部",
    population: 187000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "20",
    prefectureName: "長野県",
    cityCode: "20201",
    cityName: "長野市",
    region: "中部",
    population: 377000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "21",
    prefectureName: "岐阜県",
    cityCode: "21201",
    cityName: "岐阜市",
    region: "中部",
    population: 408000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "22",
    prefectureName: "静岡県",
    cityCode: "22100",
    cityName: "静岡市",
    region: "中部",
    population: 695000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "23",
    prefectureName: "愛知県",
    cityCode: "23100",
    cityName: "名古屋市",
    region: "中部",
    population: 2326000,
    hasLargeRetailFacility: true,
  },

  // 近畿
  {
    prefectureCode: "24",
    prefectureName: "三重県",
    cityCode: "24201",
    cityName: "津市",
    region: "近畿",
    population: 276000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "25",
    prefectureName: "滋賀県",
    cityCode: "25201",
    cityName: "大津市",
    region: "近畿",
    population: 343000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "26",
    prefectureName: "京都府",
    cityCode: "26100",
    cityName: "京都市",
    region: "近畿",
    population: 1464000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "27",
    prefectureName: "大阪府",
    cityCode: "27100",
    cityName: "大阪市",
    region: "近畿",
    population: 2750000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "28",
    prefectureName: "兵庫県",
    cityCode: "28100",
    cityName: "神戸市",
    region: "近畿",
    population: 1520000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "29",
    prefectureName: "奈良県",
    cityCode: "29201",
    cityName: "奈良市",
    region: "近畿",
    population: 357000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "30",
    prefectureName: "和歌山県",
    cityCode: "30201",
    cityName: "和歌山市",
    region: "近畿",
    population: 364000,
    hasLargeRetailFacility: true,
  },

  // 中国
  {
    prefectureCode: "31",
    prefectureName: "鳥取県",
    cityCode: "31201",
    cityName: "鳥取市",
    region: "中国",
    population: 192000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "32",
    prefectureName: "島根県",
    cityCode: "32201",
    cityName: "松江市",
    region: "中国",
    population: 206000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "33",
    prefectureName: "岡山県",
    cityCode: "33100",
    cityName: "岡山市",
    region: "中国",
    population: 721000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "34",
    prefectureName: "広島県",
    cityCode: "34100",
    cityName: "広島市",
    region: "中国",
    population: 1200000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "35",
    prefectureName: "山口県",
    cityCode: "35201",
    cityName: "山口市",
    region: "中国",
    population: 198000,
    hasLargeRetailFacility: true,
  },

  // 四国
  {
    prefectureCode: "36",
    prefectureName: "徳島県",
    cityCode: "36201",
    cityName: "徳島市",
    region: "四国",
    population: 254000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "37",
    prefectureName: "香川県",
    cityCode: "37201",
    cityName: "高松市",
    region: "四国",
    population: 420000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "38",
    prefectureName: "愛媛県",
    cityCode: "38201",
    cityName: "松山市",
    region: "四国",
    population: 509000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "39",
    prefectureName: "高知県",
    cityCode: "39201",
    cityName: "高知市",
    region: "四国",
    population: 324000,
    hasLargeRetailFacility: true,
  },

  // 九州・沖縄
  {
    prefectureCode: "40",
    prefectureName: "福岡県",
    cityCode: "40130",
    cityName: "福岡市",
    region: "九州",
    population: 1613000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "41",
    prefectureName: "佐賀県",
    cityCode: "41201",
    cityName: "佐賀市",
    region: "九州",
    population: 232000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "42",
    prefectureName: "長崎県",
    cityCode: "42201",
    cityName: "長崎市",
    region: "九州",
    population: 416000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "43",
    prefectureName: "熊本県",
    cityCode: "43100",
    cityName: "熊本市",
    region: "九州",
    population: 740000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "44",
    prefectureName: "大分県",
    cityCode: "44201",
    cityName: "大分市",
    region: "九州",
    population: 478000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "45",
    prefectureName: "宮崎県",
    cityCode: "45201",
    cityName: "宮崎市",
    region: "九州",
    population: 401000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "46",
    prefectureName: "鹿児島県",
    cityCode: "46201",
    cityName: "鹿児島市",
    region: "九州",
    population: 595000,
    hasLargeRetailFacility: true,
  },
  {
    prefectureCode: "47",
    prefectureName: "沖縄県",
    cityCode: "47201",
    cityName: "那覇市",
    region: "沖縄",
    population: 321000,
    hasLargeRetailFacility: true,
  },
];

// 地域分類
export const REGIONS = [
  "北海道",
  "東北",
  "関東",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州",
  "沖縄",
];

// 人口規模分類
export const POPULATION_CATEGORIES = [
  { name: "大都市", min: 1000000, max: Infinity },
  { name: "中都市", min: 500000, max: 999999 },
  { name: "小都市", min: 200000, max: 499999 },
  { name: "町", min: 0, max: 199999 },
];

export function getCityByCode(cityCode: string): CityInfo | undefined {
  return NATIONWIDE_CITIES.find((city) => city.cityCode === cityCode);
}

export function getCitiesByRegion(region: string): CityInfo[] {
  return NATIONWIDE_CITIES.filter((city) => city.region === region);
}

export function getCitiesByPopulationCategory(
  categoryName: string
): CityInfo[] {
  const category = POPULATION_CATEGORIES.find(
    (cat) => cat.name === categoryName
  );
  if (!category) return [];

  return NATIONWIDE_CITIES.filter(
    (city) => city.population >= category.min && city.population <= category.max
  );
}

export function getTargetCityCodes(): string[] {
  return NATIONWIDE_CITIES.map((city) => city.cityCode);
}
