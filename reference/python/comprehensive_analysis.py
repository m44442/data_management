"""
4時点対応高度統計分析システム
統合データセット（2007/2012/2014/2021年）を用いた包括的分析
"""

import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

# 日本語フォント設定
plt.rcParams['font.family'] = 'DejaVu Sans'
sns.set_style("whitegrid")
plt.style.use('default')

class ComprehensiveRetailAnalysis:
    def __init__(self, data_path='data/processed/unified_retail_dataset.json'):
        """初期化"""
        self.data_path = data_path
        self.df = None
        self.results = {}
        
    def load_data(self):
        """統合データセット読み込み"""
        print("📊 統合データセット読み込み中...")
        
        with open(self.data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self.df = pd.DataFrame(data)
        
        # データ型調整
        self.df['year'] = self.df['year'].astype(int)
        self.df['establishments'] = pd.to_numeric(self.df['establishments'])
        self.df['employees'] = pd.to_numeric(self.df['employees'])
        self.df['sales'] = pd.to_numeric(self.df['sales'], errors='coerce')
        self.df['salesArea'] = pd.to_numeric(self.df['salesArea'], errors='coerce')
        
        print(f"✅ データ読み込み完了: {len(self.df)}レコード")
        print(f"📅 対象年代: {sorted(self.df['year'].unique())}")
        print(f"🏙️ 対象都市: {len(self.df['cityName'].unique())}都市")
        
        return self.df
    
    def descriptive_statistics(self):
        """基本統計分析"""
        print("\n🔍 基本統計分析実行中...")
        
        results = {}
        
        # 全体統計
        numeric_cols = ['establishments', 'employees', 'sales', 'salesArea']
        overall_stats = self.df[numeric_cols].describe()
        results['overall_statistics'] = overall_stats.to_dict()
        
        # 年別統計
        yearly_stats = self.df.groupby('year')[numeric_cols].agg(['mean', 'median', 'std', 'count'])
        results['yearly_statistics'] = {}
        for year in sorted(self.df['year'].unique()):
            year_data = {}
            for col in numeric_cols:
                if col in yearly_stats.columns.get_level_values(0):
                    year_data[col] = {}
                    for stat in ['mean', 'median', 'std', 'count']:
                        if stat in yearly_stats.columns.get_level_values(1):
                            try:
                                value = yearly_stats.loc[year, (col, stat)]
                                if pd.notna(value):
                                    year_data[col][stat] = float(value)
                            except (KeyError, IndexError):
                                pass
            results['yearly_statistics'][str(year)] = year_data
        
        # 地域別統計
        regional_stats = self.df.groupby('region')[numeric_cols].agg(['mean', 'median', 'count'])
        results['regional_statistics'] = {}
        for region in self.df['region'].unique():
            if pd.notna(region):
                region_data = {}
                for col in numeric_cols:
                    if col in regional_stats.columns.get_level_values(0):
                        region_data[col] = {}
                        for stat in ['mean', 'median', 'count']:
                            if stat in regional_stats.columns.get_level_values(1):
                                try:
                                    value = regional_stats.loc[region, (col, stat)]
                                    if pd.notna(value):
                                        region_data[col][stat] = float(value)
                                except (KeyError, IndexError):
                                    pass
                results['regional_statistics'][region] = region_data
        
        # 都市別統計
        city_stats = self.df.groupby('cityName')[numeric_cols].agg(['mean', 'median', 'count'])
        results['city_statistics'] = {}
        for city in self.df['cityName'].unique():
            city_data = {}
            for col in numeric_cols:
                if col in city_stats.columns.get_level_values(0):
                    city_data[col] = {}
                    for stat in ['mean', 'median', 'count']:
                        if stat in city_stats.columns.get_level_values(1):
                            try:
                                value = city_stats.loc[city, (col, stat)]
                                if pd.notna(value):
                                    city_data[col][stat] = float(value)
                            except (KeyError, IndexError):
                                pass
            results['city_statistics'][city] = city_data
        
        self.results['descriptive'] = results
        print("✅ 基本統計分析完了")
        return results
    
    def time_series_analysis(self):
        """時系列分析"""
        print("\n📈 時系列分析実行中...")
        
        results = {}
        
        # 年別トレンド
        yearly_trends = self.df.groupby('year').agg({
            'establishments': ['mean', 'sum'],
            'employees': ['mean', 'sum'],
            'sales': ['mean', 'sum'],
            'salesArea': ['mean', 'sum']
        }).round(2)
        
        # MultiIndexを適切に処理
        trends_dict = {}
        for year in yearly_trends.index:
            trends_dict[str(year)] = {}
            for col in ['establishments', 'employees', 'sales', 'salesArea']:
                if col in yearly_trends.columns.get_level_values(0):
                    trends_dict[str(year)][col] = {}
                    for stat in ['mean', 'sum']:
                        if stat in yearly_trends.columns.get_level_values(1):
                            try:
                                value = yearly_trends.loc[year, (col, stat)]
                                if pd.notna(value):
                                    trends_dict[str(year)][col][stat] = float(value)
                            except (KeyError, IndexError):
                                pass
        
        results['yearly_trends'] = trends_dict
        
        # 都市別時系列
        city_timeseries = {}
        for city in self.df['cityName'].unique():
            city_data = self.df[self.df['cityName'] == city].sort_values('year')
            if len(city_data) >= 3:  # 3年以上のデータがある都市のみ
                # 成長率計算
                city_trends = {}
                for col in ['establishments', 'employees']:
                    values = city_data[col].values
                    if len(values) > 1:
                        # 年平均成長率
                        years = len(values) - 1
                        if values[0] > 0 and values[-1] > 0:
                            cagr = ((values[-1] / values[0]) ** (1/years) - 1) * 100
                            city_trends[f'{col}_cagr'] = round(cagr, 2)
                        
                        # トレンド勾配
                        x = np.arange(len(values))
                        slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
                        city_trends[f'{col}_trend_slope'] = round(slope, 2)
                        city_trends[f'{col}_trend_r2'] = round(r_value**2, 3)
                
                city_timeseries[city] = city_trends
        
        results['city_timeseries'] = city_timeseries
        
        self.results['timeseries'] = results
        print("✅ 時系列分析完了")
        return results
    
    def regional_comparison(self):
        """地域比較分析"""
        print("\n🗾 地域比較分析実行中...")
        
        results = {}
        
        # 地域別平均値比較
        regional_avg = self.df.groupby('region').agg({
            'establishments': 'mean',
            'employees': 'mean',
            'sales': 'mean',
            'salesArea': 'mean'
        }).round(2)
        
        results['regional_averages'] = regional_avg.to_dict()
        
        # 地域間の有意差検定（ANOVA）
        regions = self.df['region'].unique()
        if len(regions) > 2:
            anova_results = {}
            for col in ['establishments', 'employees']:
                region_groups = [self.df[self.df['region'] == region][col].dropna().values 
                               for region in regions if len(self.df[self.df['region'] == region]) > 0]
                
                if len(region_groups) > 1 and all(len(group) > 0 for group in region_groups):
                    f_stat, p_value = stats.f_oneway(*region_groups)
                    anova_results[col] = {
                        'f_statistic': round(f_stat, 4),
                        'p_value': round(p_value, 4),
                        'significant': p_value < 0.05
                    }
            
            results['anova_results'] = anova_results
        
        self.results['regional'] = results
        print("✅ 地域比較分析完了")
        return results
    
    def cluster_analysis(self):
        """クラスター分析"""
        print("\n🎯 クラスター分析実行中...")
        
        # 都市別平均値でクラスタリング
        city_features = self.df.groupby('cityName').agg({
            'establishments': 'mean',
            'employees': 'mean'
        }).dropna()
        
        if len(city_features) < 3:
            print("⚠️ クラスター分析に十分なデータがありません")
            return {}
        
        # 標準化
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(city_features)
        
        # K-means クラスタリング（2-4クラスター）
        cluster_results = {}
        for n_clusters in range(2, min(5, len(city_features))):
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            labels = kmeans.fit_predict(features_scaled)
            
            # シルエット係数
            from sklearn.metrics import silhouette_score
            if len(set(labels)) > 1:
                silhouette_avg = silhouette_score(features_scaled, labels)
                
                cluster_info = {
                    'n_clusters': n_clusters,
                    'silhouette_score': round(silhouette_avg, 3),
                    'cluster_centers': kmeans.cluster_centers_.tolist(),
                    'city_clusters': {}
                }
                
                for i, city in enumerate(city_features.index):
                    cluster_info['city_clusters'][city] = int(labels[i])
                
                cluster_results[f'k_{n_clusters}'] = cluster_info
        
        self.results['clustering'] = cluster_results
        print("✅ クラスター分析完了")
        return cluster_results
    
    def correlation_analysis(self):
        """相関分析"""
        print("\n🔗 相関分析実行中...")
        
        # 数値変数の相関
        numeric_cols = ['establishments', 'employees', 'sales', 'salesArea']
        available_cols = [col for col in numeric_cols if col in self.df.columns]
        
        if len(available_cols) < 2:
            print("⚠️ 相関分析に十分な数値変数がありません")
            return {}
        
        corr_matrix = self.df[available_cols].corr()
        
        results = {
            'correlation_matrix': corr_matrix.to_dict(),
            'strong_correlations': {}
        }
        
        # 強い相関（|r| > 0.7）を抽出
        for i in range(len(available_cols)):
            for j in range(i+1, len(available_cols)):
                corr_val = corr_matrix.iloc[i, j]
                if abs(corr_val) > 0.7:
                    pair = f"{available_cols[i]}_vs_{available_cols[j]}"
                    results['strong_correlations'][pair] = round(corr_val, 3)
        
        self.results['correlation'] = results
        print("✅ 相関分析完了")
        return results
    
    def efficiency_analysis(self):
        """効率性分析"""
        print("\n⚡ 効率性分析実行中...")
        
        results = {}
        
        # 従業者数/事業所数 比率（事業所当たり従業者数）
        self.df['employees_per_establishment'] = self.df['employees'] / self.df['establishments']
        
        # 都市別効率性
        efficiency_stats = self.df.groupby('cityName')['employees_per_establishment'].agg(['mean', 'median', 'std']).round(2)
        
        results['city_efficiency'] = {}
        for city in efficiency_stats.index:
            results['city_efficiency'][city] = {
                'mean': float(efficiency_stats.loc[city, 'mean']) if pd.notna(efficiency_stats.loc[city, 'mean']) else None,
                'median': float(efficiency_stats.loc[city, 'median']) if pd.notna(efficiency_stats.loc[city, 'median']) else None,
                'std': float(efficiency_stats.loc[city, 'std']) if pd.notna(efficiency_stats.loc[city, 'std']) else None
            }
        
        # 年別効率性トレンド
        yearly_efficiency = self.df.groupby('year')['employees_per_establishment'].agg(['mean', 'median', 'std']).round(2)
        results['yearly_efficiency_trends'] = {}
        for year in yearly_efficiency.index:
            results['yearly_efficiency_trends'][str(year)] = {
                'mean': float(yearly_efficiency.loc[year, 'mean']) if pd.notna(yearly_efficiency.loc[year, 'mean']) else None,
                'median': float(yearly_efficiency.loc[year, 'median']) if pd.notna(yearly_efficiency.loc[year, 'median']) else None,
                'std': float(yearly_efficiency.loc[year, 'std']) if pd.notna(yearly_efficiency.loc[year, 'std']) else None
            }
        
        # 地域別効率性
        regional_efficiency = self.df.groupby('region')['employees_per_establishment'].agg(['mean', 'median', 'std']).round(2)
        results['regional_efficiency'] = {}
        for region in regional_efficiency.index:
            results['regional_efficiency'][region] = {
                'mean': float(regional_efficiency.loc[region, 'mean']) if pd.notna(regional_efficiency.loc[region, 'mean']) else None,
                'median': float(regional_efficiency.loc[region, 'median']) if pd.notna(regional_efficiency.loc[region, 'median']) else None,
                'std': float(regional_efficiency.loc[region, 'std']) if pd.notna(regional_efficiency.loc[region, 'std']) else None
            }
        
        self.results['efficiency'] = results
        print("✅ 効率性分析完了")
        return results
    
    def generate_visualizations(self):
        """可視化生成"""
        print("\n📊 可視化生成中...")
        
        import os
        os.makedirs('results/figures', exist_ok=True)
        
        # 1. 時系列トレンド
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Time Series Analysis - 4-Point Data (2007-2021)', fontsize=16, fontweight='bold')
        
        # 年別平均事業所数
        yearly_est = self.df.groupby('year')['establishments'].mean()
        axes[0,0].plot(yearly_est.index, yearly_est.values, marker='o', linewidth=2, markersize=8)
        axes[0,0].set_title('Average Establishments by Year')
        axes[0,0].set_xlabel('Year')
        axes[0,0].set_ylabel('Number of Establishments')
        axes[0,0].grid(True, alpha=0.3)
        
        # 年別平均従業者数
        yearly_emp = self.df.groupby('year')['employees'].mean()
        axes[0,1].plot(yearly_emp.index, yearly_emp.values, marker='s', linewidth=2, markersize=8, color='orange')
        axes[0,1].set_title('Average Employees by Year')
        axes[0,1].set_xlabel('Year')
        axes[0,1].set_ylabel('Number of Employees')
        axes[0,1].grid(True, alpha=0.3)
        
        # 都市別比較（2021年）
        latest_data = self.df[self.df['year'] == 2021].sort_values('establishments', ascending=True)
        if len(latest_data) > 0:
            axes[1,0].barh(latest_data['cityName'], latest_data['establishments'])
            axes[1,0].set_title('Establishments by City (2021)')
            axes[1,0].set_xlabel('Number of Establishments')
        
        # 効率性分析
        if 'employees_per_establishment' in self.df.columns:
            efficiency_by_year = self.df.groupby('year')['employees_per_establishment'].mean()
            axes[1,1].plot(efficiency_by_year.index, efficiency_by_year.values, marker='^', linewidth=2, markersize=8, color='green')
            axes[1,1].set_title('Efficiency Trend (Employees per Establishment)')
            axes[1,1].set_xlabel('Year')
            axes[1,1].set_ylabel('Employees/Establishment')
            axes[1,1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('results/figures/comprehensive_analysis.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 2. 地域比較ヒートマップ
        if len(self.df['region'].unique()) > 1:
            pivot_data = self.df.pivot_table(
                values=['establishments', 'employees'], 
                index='region', 
                columns='year', 
                aggfunc='mean'
            )
            
            if not pivot_data.empty:
                fig, axes = plt.subplots(1, 2, figsize=(16, 6))
                
                # 事業所数ヒートマップ
                if 'establishments' in pivot_data.columns.get_level_values(0):
                    est_data = pivot_data['establishments']
                    sns.heatmap(est_data, annot=True, fmt='.0f', cmap='Blues', ax=axes[0])
                    axes[0].set_title('Establishments by Region and Year')
                
                # 従業者数ヒートマップ
                if 'employees' in pivot_data.columns.get_level_values(0):
                    emp_data = pivot_data['employees']
                    sns.heatmap(emp_data, annot=True, fmt='.0f', cmap='Oranges', ax=axes[1])
                    axes[1].set_title('Employees by Region and Year')
                
                plt.tight_layout()
                plt.savefig('results/figures/regional_heatmap.png', dpi=300, bbox_inches='tight')
                plt.close()
        
        print("✅ 可視化完了")
        print("📁 保存先: results/figures/")
    
    def save_results(self):
        """分析結果保存"""
        print("\n💾 分析結果保存中...")
        
        import os
        os.makedirs('results/tables', exist_ok=True)
        
        # JSON安全な形式に変換
        def make_json_safe(obj):
            if isinstance(obj, dict):
                return {k: make_json_safe(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_json_safe(v) for v in obj]
            elif isinstance(obj, (np.bool_, bool)):
                return bool(obj)
            elif isinstance(obj, (np.integer, int)):
                return int(obj)
            elif isinstance(obj, (np.floating, float)):
                return float(obj) if not np.isnan(obj) else None
            elif pd.isna(obj):
                return None
            else:
                return obj
        
        safe_results = make_json_safe(self.results)
        
        # JSON形式で保存
        with open('results/tables/comprehensive_analysis_results.json', 'w', encoding='utf-8') as f:
            json.dump(safe_results, f, ensure_ascii=False, indent=2)
        
        # サマリーレポート生成
        summary = {
            'analysis_overview': {
                'total_records': int(len(self.df)),
                'cities_analyzed': int(len(self.df['cityName'].unique())),
                'years_covered': [int(year) for year in sorted(self.df['year'].unique())],
                'regions_included': [str(region) for region in self.df['region'].unique() if pd.notna(region)],
                'data_completeness': f"{(len(self.df) / (len(self.df['cityName'].unique()) * len(self.df['year'].unique()))) * 100:.1f}%"
            }
        }
        
        if 'descriptive' in self.results:
            summary['key_findings'] = {
                'avg_establishments': float(round(self.df['establishments'].mean(), 1)),
                'avg_employees': float(round(self.df['employees'].mean(), 1)),
                'efficiency_ratio': float(round(self.df['employees'].sum() / self.df['establishments'].sum(), 2))
            }
        
        with open('results/tables/analysis_summary.json', 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print("✅ 分析結果保存完了")
        print("📁 保存先:")
        print("  - results/tables/comprehensive_analysis_results.json")
        print("  - results/tables/analysis_summary.json")
    
    def run_full_analysis(self):
        """フル分析実行"""
        print("🚀 4時点対応包括的分析システム開始")
        print("="*60)
        
        try:
            # データ読み込み
            self.load_data()
            
            # 各種分析実行
            self.descriptive_statistics()
            self.time_series_analysis()
            self.regional_comparison()
            self.cluster_analysis()
            self.correlation_analysis()
            self.efficiency_analysis()
            
            # 可視化生成
            self.generate_visualizations()
            
            # 結果保存
            self.save_results()
            
            print("\n" + "="*60)
            print("🎉 包括的分析完了！")
            print(f"📊 分析対象: {len(self.df)}レコード")
            print(f"🏙️ 都市数: {len(self.df['cityName'].unique())}")
            print(f"📅 年数: {len(self.df['year'].unique())}")
            print("📁 結果ファイル:")
            print("  - results/figures/comprehensive_analysis.png")
            print("  - results/figures/regional_heatmap.png") 
            print("  - results/tables/comprehensive_analysis_results.json")
            print("  - results/tables/analysis_summary.json")
            
        except Exception as e:
            print(f"❌ 分析エラー: {e}")
            raise

if __name__ == "__main__":
    analyzer = ComprehensiveRetailAnalysis()
    analyzer.run_full_analysis()