export interface RetailData {
  city: string;
  year: number;
  establishments: number;  // 事業所数
  employees: number;       // 従業者数
  sales: number;           // 年間販売額（百万円）
  salesArea?: number;      // 売場面積（㎡）
}

export interface DescriptiveStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  count: number;
}

export interface ComparisonResult {
  city: string;
  beforeMean: number;
  afterMean: number;
  changeRate: number;  // 変化率（%）
}