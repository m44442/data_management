#!/usr/bin/env python3
"""
小売業データの統計分析スクリプト
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import json
import os
from pathlib import Path

# 日本語フォント設定
plt.rcParams['font.family'] = ['Hiragino Sans', 'Yu Gothic', 'Meiryo', 'Takao', 'IPAexGothic', 'IPAPGothic', 'VL PGothic', 'Noto Sans CJK JP']

def load_data():
    """データを読み込む"""
    data_path = Path(__file__).parent.parent / 'data' / 'for_python' / 'retail_data_with_ratios.csv'
    
    if not data_path.exists():
        print(f"❌ データファイルが見つかりません: {data_path}")
        return None
    
    df = pd.read_csv(data_path)
    print(f"📊 データ読み込み完了: {len(df)}行, {len(df.columns)}列")
    print(f"🏙️  都市: {', '.join(df['city'].unique())}")
    print(f"📅 年次: {', '.join(map(str, sorted(df['year'].unique())))}")
    
    return df

def descriptive_statistics(df):
    """記述統計"""
    print("\n=== 記述統計 ===")
    
    numeric_cols = ['establishments', 'employees', 'sales', 'salesArea', 
                   'salesAreaPerEmployee', 'employeesPerEstablishment', 
                   'salesPerEstablishment', 'salesPerEmployee']
    
    print("\n📊 全体統計:")
    print(df[numeric_cols].describe().round(2))
    
    print("\n🏙️  都市別統計:")
    for city in df['city'].unique():
        city_data = df[df['city'] == city]
        print(f"\n{city}:")
        print(city_data[numeric_cols].describe().round(2))

def time_series_analysis(df):
    """時系列分析"""
    print("\n=== 時系列分析 ===")
    
    # 都市別トレンド分析
    for city in df['city'].unique():
        city_data = df[df['city'] == city].sort_values('year')
        print(f"\n🏙️  {city}のトレンド:")
        
        # 各指標の年平均成長率計算
        metrics = ['establishments', 'employees', 'sales', 'salesArea']
        
        for metric in metrics:
            values = city_data[metric].values
            years = city_data['year'].values
            
            if len(values) > 1:
                # 線形回帰で傾向を計算
                slope, intercept, r_value, p_value, std_err = stats.linregress(years, values)
                mean_value = np.mean(values)
                annual_change_rate = (slope / mean_value) * 100
                
                print(f"   {metric}: {annual_change_rate:+.2f}%/年 (R²={r_value**2:.3f}, p={p_value:.3f})")

def statistical_tests(df):
    """統計的検定"""
    print("\n=== 統計的検定 ===")
    
    # 都市間比較（最新年のデータを使用）
    latest_year = df['year'].max()
    latest_data = df[df['year'] == latest_year]
    
    if len(latest_data) == 2:  # 2都市の比較
        city1_data = latest_data[latest_data['city'] == latest_data['city'].iloc[0]]
        city2_data = latest_data[latest_data['city'] == latest_data['city'].iloc[1]]
        
        city1_name = city1_data['city'].iloc[0]
        city2_name = city2_data['city'].iloc[0]
        
        print(f"\n🏙️  {city1_name} vs {city2_name} ({latest_year}年)")
        
        # 主要指標の比較
        metrics = ['establishments', 'employees', 'sales', 'salesPerEmployee']
        
        for metric in metrics:
            val1 = city1_data[metric].iloc[0]
            val2 = city2_data[metric].iloc[0]
            
            diff_pct = ((val2 - val1) / val1) * 100
            
            print(f"   {metric}: {city1_name}={val1:,.0f}, {city2_name}={val2:,.0f} ({diff_pct:+.1f}%)")
    
    # 年次間の変化の有意性検定（全データ）
    print(f"\n📈 時系列変化の分析:")
    
    years = sorted(df['year'].unique())
    if len(years) >= 3:
        for metric in ['establishments', 'employees', 'sales']:
            # 各年のデータを取得
            year_groups = [df[df['year'] == year][metric].values for year in years]
            
            # 一元配置分散分析
            f_stat, p_value = stats.f_oneway(*year_groups)
            
            print(f"   {metric}: F={f_stat:.3f}, p={p_value:.3f}")
            
            if p_value < 0.05:
                print(f"     → 年次間で有意差あり (p < 0.05)")
            else:
                print(f"     → 年次間で有意差なし (p ≥ 0.05)")

def correlation_analysis(df):
    """相関分析"""
    print("\n=== 相関分析 ===")
    
    numeric_cols = ['establishments', 'employees', 'sales', 'salesArea']
    
    # 相関行列計算
    corr_matrix = df[numeric_cols].corr()
    
    print("\n📊 相関行列:")
    print(corr_matrix.round(3))
    
    # 高い相関を持つペアを特定
    print("\n🔍 高い相関を持つ指標ペア (|r| > 0.7):")
    
    for i in range(len(numeric_cols)):
        for j in range(i+1, len(numeric_cols)):
            corr_val = corr_matrix.iloc[i, j]
            if abs(corr_val) > 0.7:
                print(f"   {numeric_cols[i]} - {numeric_cols[j]}: r = {corr_val:.3f}")

def create_visualizations(df):
    """可視化作成"""
    print("\n=== 可視化作成 ===")
    
    # 結果保存用ディレクトリ
    figures_dir = Path(__file__).parent.parent / 'results' / 'figures'
    figures_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. 時系列プロット
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('小売業指標の時系列変化', fontsize=16)
    
    metrics = ['establishments', 'employees', 'sales', 'salesArea']
    titles = ['事業所数', '従業者数', '販売額（百万円）', '売場面積（㎡）']
    
    for i, (metric, title) in enumerate(zip(metrics, titles)):
        ax = axes[i//2, i%2]
        
        for city in df['city'].unique():
            city_data = df[df['city'] == city].sort_values('year')
            ax.plot(city_data['year'], city_data[metric], marker='o', linewidth=2, label=city)
        
        ax.set_title(title)
        ax.set_xlabel('年')
        ax.set_ylabel(title)
        ax.legend()
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(figures_dir / 'time_series.png', dpi=300, bbox_inches='tight')
    print(f"📊 時系列グラフを保存: {figures_dir / 'time_series.png'}")
    
    # 2. 効率性指標の比較
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('効率性指標の比較', fontsize=16)
    
    efficiency_metrics = ['salesPerEmployee', 'salesPerEstablishment', 
                         'employeesPerEstablishment', 'salesAreaPerEmployee']
    efficiency_titles = ['従業者1人当たり販売額', '1事業所当たり販売額', 
                        '1事業所当たり従業者数', '従業者1人当たり売場面積']
    
    for i, (metric, title) in enumerate(zip(efficiency_metrics, efficiency_titles)):
        ax = axes[i//2, i%2]
        
        for city in df['city'].unique():
            city_data = df[df['city'] == city].sort_values('year')
            ax.plot(city_data['year'], city_data[metric], marker='s', linewidth=2, label=city)
        
        ax.set_title(title)
        ax.set_xlabel('年')
        ax.set_ylabel(title)
        ax.legend()
        ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(figures_dir / 'efficiency_metrics.png', dpi=300, bbox_inches='tight')
    print(f"📊 効率性指標グラフを保存: {figures_dir / 'efficiency_metrics.png'}")
    
    # 3. 相関ヒートマップ
    plt.figure(figsize=(10, 8))
    
    numeric_cols = ['establishments', 'employees', 'sales', 'salesArea']
    corr_matrix = df[numeric_cols].corr()
    
    sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0, 
                square=True, fmt='.3f', cbar_kws={'label': '相関係数'})
    plt.title('小売業指標間の相関関係')
    
    plt.tight_layout()
    plt.savefig(figures_dir / 'correlation_heatmap.png', dpi=300, bbox_inches='tight')
    print(f"📊 相関ヒートマップを保存: {figures_dir / 'correlation_heatmap.png'}")

def save_results(df):
    """分析結果を保存"""
    print("\n=== 分析結果保存 ===")
    
    results_dir = Path(__file__).parent.parent / 'results' / 'tables'
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # 詳細統計をCSVで保存
    detailed_stats = df.groupby(['city', 'year']).agg({
        'establishments': 'first',
        'employees': 'first', 
        'sales': 'first',
        'salesArea': 'first',
        'salesPerEmployee': 'first',
        'salesPerEstablishment': 'first',
        'employeesPerEstablishment': 'first',
        'salesAreaPerEmployee': 'first'
    }).reset_index()
    
    detailed_stats.to_csv(results_dir / 'detailed_statistics.csv', 
                         index=False, encoding='utf-8-sig')
    print(f"📄 詳細統計を保存: {results_dir / 'detailed_statistics.csv'}")

def main():
    """メイン処理"""
    print("=== 小売業データ統計分析 (Python) ===\n")
    
    # データ読み込み
    df = load_data()
    if df is None:
        return
    
    # 各種分析実行
    descriptive_statistics(df)
    time_series_analysis(df)
    statistical_tests(df)
    correlation_analysis(df)
    create_visualizations(df)
    save_results(df)
    
    print("\n✅ Python統計分析完了!")

if __name__ == "__main__":
    main()