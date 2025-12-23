"""
英語ラベル対応の可視化スクリプト
文字化け問題を完全回避した論文用図表生成
"""

import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# 英語フォント設定
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 12
plt.rcParams['axes.unicode_minus'] = False
sns.set_style("whitegrid")

def load_data():
    """データ読み込み"""
    with open('data/processed/unified_retail_dataset.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    df = pd.DataFrame(data)
    df['year'] = df['year'].astype(int)
    df['establishments'] = pd.to_numeric(df['establishments'])
    df['employees'] = pd.to_numeric(df['employees'])
    df['sales'] = pd.to_numeric(df['sales'], errors='coerce')
    df['salesArea'] = pd.to_numeric(df['salesArea'], errors='coerce')

    return df

def create_time_series_figure():
    """時系列分析図の作成（英語ラベル）"""
    df = load_data()
    df_3point = df[df['year'].isin([2007, 2012, 2021])].copy()

    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 10))
    fig.suptitle('Retail Industry Analysis: 10 Cities (2007-2021)', fontsize=16, fontweight='bold')

    # 1. 時系列推移
    yearly_stats = df_3point.groupby('year').agg({
        'establishments': 'mean',
        'employees': 'mean'
    }).reset_index()

    ax1.plot(yearly_stats['year'], yearly_stats['establishments'],
             marker='o', linewidth=3, markersize=8, color='#1f77b4')
    ax1.set_title('Average Number of Establishments', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Year')
    ax1.set_ylabel('Number of Establishments')
    ax1.grid(True, alpha=0.3)

    ax2.plot(yearly_stats['year'], yearly_stats['employees'],
             marker='s', linewidth=3, markersize=8, color='#ff7f0e')
    ax2.set_title('Average Number of Employees', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Year')
    ax2.set_ylabel('Number of Employees')
    ax2.grid(True, alpha=0.3)

    # 2. 2021年都市別事業所数（英語都市名）
    data_2021 = df[df['year'] == 2021].copy()

    # 都市名を英語に変換
    city_mapping = {
        '越谷市': 'Koshigaya',
        '柏市': 'Kashiwa',
        '岐阜市': 'Gifu',
        '新潟市': 'Niigata',
        '大津市': 'Otsu',
        '松山市': 'Matsuyama',
        '佐賀市': 'Saga',
        '大分市': 'Oita',
        '熊本市': 'Kumamoto',
        '鹿児島市': 'Kagoshima'
    }

    data_2021['cityName_en'] = data_2021['cityName'].map(city_mapping)
    data_2021_sorted = data_2021.sort_values('establishments', ascending=True)

    ax3.barh(data_2021_sorted['cityName_en'], data_2021_sorted['establishments'],
             color='#2ca02c', alpha=0.8)
    ax3.set_title('Establishments by City (2021)', fontsize=12, fontweight='bold')
    ax3.set_xlabel('Number of Establishments')

    # 3. 効率性トレンド
    efficiency_data = []
    for year in [2007, 2012, 2021]:
        year_data = df_3point[df_3point['year'] == year]
        if len(year_data) > 0:
            total_establishments = year_data['establishments'].sum()
            total_employees = year_data['employees'].sum()
            efficiency = total_employees / total_establishments
            efficiency_data.append({'year': year, 'efficiency': efficiency})

    efficiency_df = pd.DataFrame(efficiency_data)
    ax4.plot(efficiency_df['year'], efficiency_df['efficiency'],
             marker='D', linewidth=3, markersize=8, color='#d62728')
    ax4.set_title('Efficiency Trend: Employees per Establishment', fontsize=12, fontweight='bold')
    ax4.set_xlabel('Year')
    ax4.set_ylabel('Employees per Establishment')
    ax4.grid(True, alpha=0.3)

    plt.tight_layout()

    # 保存
    output_path = 'results/figures/comprehensive_analysis_english.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    print(f"📊 Comprehensive analysis saved: {output_path}")
    plt.close()

def create_regional_comparison():
    """地域別比較図の作成（英語ラベル）"""
    df = load_data()
    df_3point = df[df['year'].isin([2007, 2012, 2021])].copy()

    # 地域名を英語に変換
    region_mapping = {
        '関東': 'Kanto',
        '中部': 'Chubu',
        '近畿': 'Kinki',
        '四国': 'Shikoku',
        '九州': 'Kyushu'
    }
    df_3point['region_en'] = df_3point['region'].map(region_mapping)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))
    fig.suptitle('Regional Comparison of Retail Industry', fontsize=16, fontweight='bold')

    # 地域別箱ひげ図
    sns.boxplot(data=df_3point, x='region_en', y='establishments', ax=ax1)
    ax1.set_title('Establishments by Region', fontsize=12, fontweight='bold')
    ax1.set_xlabel('Region')
    ax1.set_ylabel('Number of Establishments')

    sns.boxplot(data=df_3point, x='region_en', y='employees', ax=ax2)
    ax2.set_title('Employees by Region', fontsize=12, fontweight='bold')
    ax2.set_xlabel('Region')
    ax2.set_ylabel('Number of Employees')

    plt.tight_layout()

    # 保存
    output_path = 'results/figures/regional_comparison_english.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    print(f"📊 Regional comparison saved: {output_path}")
    plt.close()

def create_growth_rate_comparison():
    """成長率比較図の作成（英語ラベル）"""
    df = load_data()

    # CAGR計算（2007-2021）
    growth_data = []
    cities = df['cityName'].unique()

    city_mapping = {
        '越谷市': 'Koshigaya',
        '柏市': 'Kashiwa',
        '岐阜市': 'Gifu',
        '新潟市': 'Niigata',
        '大津市': 'Otsu',
        '松山市': 'Matsuyama',
        '佐賀市': 'Saga',
        '大分市': 'Oita',
        '鹿児島市': 'Kagoshima'
    }

    for city in cities:
        if city in city_mapping:  # 熊本市は除外（2007年データなし）
            city_data = df[df['cityName'] == city]

            data_2007 = city_data[city_data['year'] == 2007]
            data_2021 = city_data[city_data['year'] == 2021]

            if len(data_2007) > 0 and len(data_2021) > 0:
                est_2007 = data_2007['establishments'].iloc[0]
                est_2021 = data_2021['establishments'].iloc[0]
                emp_2007 = data_2007['employees'].iloc[0]
                emp_2021 = data_2021['employees'].iloc[0]

                years = 14
                est_cagr = (est_2021 / est_2007) ** (1/years) - 1
                emp_cagr = (emp_2021 / emp_2007) ** (1/years) - 1

                growth_data.append({
                    'city': city_mapping[city],
                    'est_cagr': est_cagr * 100,
                    'emp_cagr': emp_cagr * 100
                })

    growth_df = pd.DataFrame(growth_data)
    growth_df = growth_df.sort_values('emp_cagr', ascending=True)

    fig, ax = plt.subplots(figsize=(12, 8))

    x = range(len(growth_df))
    width = 0.35

    ax.barh([i - width/2 for i in x], growth_df['est_cagr'], width,
            label='Establishments CAGR', color='#1f77b4', alpha=0.8)
    ax.barh([i + width/2 for i in x], growth_df['emp_cagr'], width,
            label='Employees CAGR', color='#ff7f0e', alpha=0.8)

    ax.set_yticks(x)
    ax.set_yticklabels(growth_df['city'])
    ax.set_xlabel('Annual Growth Rate (%)')
    ax.set_title('CAGR Comparison by City (2007-2021)', fontsize=14, fontweight='bold')
    ax.legend()
    ax.axvline(x=0, color='black', linestyle='--', alpha=0.5)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()

    # 保存
    output_path = 'results/figures/growth_comparison_english.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    print(f"📊 Growth comparison saved: {output_path}")
    plt.close()

def main():
    """メイン実行関数"""
    print("🚀 English Label Visualization System")
    print("="*50)

    # 出力ディレクトリ作成
    Path('results/figures').mkdir(parents=True, exist_ok=True)

    try:
        # 1. 包括分析図
        print("\n📊 Creating comprehensive analysis...")
        create_time_series_figure()

        # 2. 地域比較図
        print("\n📊 Creating regional comparison...")
        create_regional_comparison()

        # 3. 成長率比較図
        print("\n📊 Creating growth rate comparison...")
        create_growth_rate_comparison()

        print("\n✅ All visualizations completed!")
        print("📁 Output directory: results/figures/")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()