/**
 * 全国小売業データ分析用の型定義
 */

export interface NationwideRetailData {
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

  // 計算済み指標
  salesPerEmployee: number;
  salesPerEstablishment: number;
  employeesPerEstablishment: number;
  salesAreaPerEmployee: number;
  salesPerCapita: number; // 人口1人当たり販売額
  establishmentsPerCapita: number; // 人口1万人当たり事業所数
}

export interface RegionalSummary {
  region: string;
  cityCount: number;
  totalEstablishments: number;
  totalEmployees: number;
  totalSales: number;
  totalSalesArea: number;
  totalPopulation: number;
  avgSalesPerEmployee: number;
  avgSalesPerCapita: number;
}

export interface PopulationCategorySummary {
  category: string;
  cityCount: number;
  populationRange: string;
  avgEstablishments: number;
  avgEmployees: number;
  avgSales: number;
  avgSalesArea: number;
  avgSalesPerCapita: number;
}

export interface TimeSeriesAnalysis {
  city: string;
  cityCode: string;
  region: string;
  populationCategory: string;
  timePoints: number[];
  establishments: number[];
  employees: number[];
  sales: number[];
  salesArea: number[];

  // トレンド分析結果
  establishmentsTrend: TrendAnalysis;
  employeesTrend: TrendAnalysis;
  salesTrend: TrendAnalysis;
  salesAreaTrend: TrendAnalysis;
}

export interface TrendAnalysis {
  slope: number; // 回帰直線の傾き
  intercept: number; // 回帰直線の切片
  rSquared: number; // 決定係数
  pValue: number; // p値
  annualChangeRate: number; // 年平均変化率（%）
  trendDirection: "increasing" | "decreasing" | "stable";
  significance: "significant" | "not-significant";
}

export interface ClusterAnalysisResult {
  city: string;
  cityCode: string;
  region: string;
  populationCategory: string;
  clusterNumber: number;
  clusterName: string;
  distanceToClusterCenter: number;

  // クラスター特性
  clusterCharacteristics: {
    avgEstablishments: number;
    avgEmployees: number;
    avgSales: number;
    avgSalesPerCapita: number;
    dominantRegions: string[];
    dominantPopulationCategories: string[];
  };
}

export interface SpatialAnalysisResult {
  city: string;
  cityCode: string;
  neighboringCities: string[];
  spatialLag: number; // 空間ラグ
  localMoranI: number; // ローカルモラン統計量
  spatialClusterType: "HH" | "HL" | "LH" | "LL" | "NS"; // High-High, High-Low, Low-High, Low-Low, Not Significant

  // 近隣都市との比較
  neighboringCitiesStats: {
    avgSales: number;
    avgSalesPerCapita: number;
    similarity: number; // コサイン類似度
  };
}

export interface ComprehensiveAnalysisResult {
  datasetInfo: {
    totalCities: number;
    timeRange: string;
    analysisDate: string;
    dataQuality: {
      completenessRate: number;
      missingDataCities: string[];
    };
  };

  // 記述統計
  descriptiveStats: {
    national: RegionalSummary;
    byRegion: RegionalSummary[];
    byPopulationCategory: PopulationCategorySummary[];
  };

  // 時系列分析
  timeSeriesAnalysis: TimeSeriesAnalysis[];

  // クラスター分析
  clusterAnalysis: {
    optimalClusterCount: number;
    clusters: ClusterAnalysisResult[];
    clusterValidation: {
      silhouetteScore: number;
      daviesBouldinIndex: number;
    };
  };

  // 空間分析
  spatialAnalysis: {
    globalMoranI: number;
    spatialAutocorrelation: "positive" | "negative" | "none";
    spatialClusters: SpatialAnalysisResult[];
  };

  // 統計的検定
  statisticalTests: {
    regionalDifferences: {
      fStatistic: number;
      pValue: number;
      significance: boolean;
      postHocTests: PostHocTest[];
    };
    populationCategoryDifferences: {
      fStatistic: number;
      pValue: number;
      significance: boolean;
      postHocTests: PostHocTest[];
    };
    timeSeriesStationarity: {
      adfTestStatistic: number;
      adfPValue: number;
      isStationary: boolean;
    };
  };

  // 政策的示唆
  policyImplications: {
    successFactors: string[];
    riskFactors: string[];
    recommendedPolicies: string[];
    citiesRequiringAttention: string[];
  };
}

export interface PostHocTest {
  group1: string;
  group2: string;
  meanDifference: number;
  pValue: number;
  significance: boolean;
  effectSize: number;
}

// バッチ処理用の設定
export interface BatchProcessingConfig {
  targetCities: string[];
  targetYears: number[];
  batchSize: number;
  parallelProcessing: boolean;
  outputFormat: "json" | "csv" | "both";
  includeVisualization: boolean;
}

export interface ProcessingProgress {
  totalTasks: number;
  completedTasks: number;
  currentTask: string;
  estimatedTimeRemaining: number;
  errors: ProcessingError[];
}

export interface ProcessingError {
  city: string;
  year: number;
  errorType: string;
  errorMessage: string;
  timestamp: string;
}
