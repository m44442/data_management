"""
中間発表用図表作成スクリプト
10都市・4時点データに基づく可視化
"""

import json
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # バックエンド設定
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

# 英語版グラフ用設定
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['axes.unicode_minus'] = False
sns.set_style("whitegrid")
sns.set_context("notebook", font_scale=1.1)

print("Creating English version graphs...")

# 出力フォルダ
OUTPUT_DIR = Path('results/presentation_figures')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def load_data():
    """データ読み込み"""
    print("📊 データ読み込み中...")
    with open('data/processed/unified_retail_dataset.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    df['year'] = df['year'].astype(int)
    df['establishments'] = pd.to_numeric(df['establishments'])
    df['employees'] = pd.to_numeric(df['employees'])
    df['sales'] = pd.to_numeric(df['sales'], errors='coerce')
    df['salesArea'] = pd.to_numeric(df['salesArea'], errors='coerce')
    
    # 日本語→英語マッピング
    city_map = {
        '越谷市': 'Koshigaya', '柏市': 'Kashiwa', '佐賀市': 'Saga',
        '鹿児島市': 'Kagoshima', '大分市': 'Oita', '新潟市': 'Niigata',
        '松山市': 'Matsuyama', '大津市': 'Otsu', '岐阜市': 'Gifu',
        '熊本市': 'Kumamoto'
    }
    region_map = {
        '関東': 'Kanto', '中部': 'Chubu', '近畿': 'Kinki',
        '四国': 'Shikoku', '九州': 'Kyushu'
    }
    
    df['cityName'] = df['cityName'].map(city_map)
    df['region'] = df['region'].map(region_map)
    
    print(f"✅ データ読み込み完了: {len(df)}レコード")
    print(f"   都市数: {df['cityName'].nunique()}")
    print(f"   年次: {sorted(df['year'].unique())}")
    
    return df

def create_overview_table(df):
    """図1: データ概要テーブル"""
    print("\n📊 図1: データ概要テーブル作成中...")
    
    # 都市別データ数
    city_counts = df.groupby('cityName').size().reset_index(name='データ数')
    city_years = df.groupby('cityName')['year'].apply(lambda x: ', '.join(map(str, sorted(x)))).reset_index(name='対象年次')
    city_regions = df[['cityName', 'region']].drop_duplicates()
    
    overview = city_regions.merge(city_counts, on='cityName').merge(city_years, on='cityName')
    overview = overview.sort_values('region')
    overview.columns = ['都市名', '地域', 'データ数', '対象年次']
    
    # テキストファイルとして保存
    with open(OUTPUT_DIR / 'table1_data_overview.txt', 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("表1: 収集データ概要（10都市・4時点）\n")
        f.write("=" * 80 + "\n\n")
        f.write(overview.to_string(index=False))
        f.write("\n\n")
        f.write(f"総レコード数: {len(df)}\n")
        f.write(f"総都市数: {df['cityName'].nunique()}\n")
        f.write(f"対象年次: {', '.join(map(str, sorted(df['year'].unique())))}\n")
        f.write(f"データ完全性: {len(df) / (df['cityName'].nunique() * 4) * 100:.1f}%\n")
    
    print(f"   ✅ 保存: table1_data_overview.txt")

def create_time_series_chart(df):
    """図2: 時系列推移グラフ（事業所数・従業者数）"""
    print("\n📊 図2: 時系列推移グラフ作成中...")
    
    # 2014年の異常値（API超詳細データ）を除外して平均を計算
    df_filtered = df[df['year'] != 2014].copy()
    
    yearly_avg = df_filtered.groupby('year').agg({
        'establishments': 'mean',
        'employees': 'mean'
    }).reset_index()
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    
    # 事業所数
    ax1.plot(yearly_avg['year'], yearly_avg['establishments'], 
             marker='o', linewidth=2, markersize=8, color='#2E86AB')
    ax1.set_xlabel('Year', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Avg. Establishments', fontsize=12, fontweight='bold')
    ax1.set_title('Time Series: Average Number of Establishments', 
                  fontsize=14, fontweight='bold', pad=15)
    ax1.grid(True, alpha=0.3)
    ax1.set_xticks(yearly_avg['year'])
    
    # 従業者数
    ax2.plot(yearly_avg['year'], yearly_avg['employees'], 
             marker='s', linewidth=2, markersize=8, color='#A23B72')
    ax2.set_xlabel('Year', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Avg. Employees', fontsize=12, fontweight='bold')
    ax2.set_title('Time Series: Average Number of Employees', 
                  fontsize=14, fontweight='bold', pad=15)
    ax2.grid(True, alpha=0.3)
    ax2.set_xticks(yearly_avg['year'])
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'fig2_time_series.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"   ✅ 保存: fig2_time_series.png")

def create_regional_comparison(df):
    """図3: 地域別比較（箱ひげ図）"""
    print("\n📊 図3: 地域別比較作成中...")
    
    # 2014年の異常値を除外
    df_filtered = df[df['year'] != 2014].copy()
    df_filtered = df_filtered[df_filtered['region'].notna()]
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # 事業所数
    sns.boxplot(data=df_filtered, x='region', y='establishments', ax=ax1, palette='Set2')
    ax1.set_xlabel('Region', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Establishments', fontsize=12, fontweight='bold')
    ax1.set_title('Regional Comparison: Establishments', fontsize=14, fontweight='bold', pad=15)
    ax1.tick_params(axis='x', rotation=0)
    
    # 従業者数
    sns.boxplot(data=df_filtered, x='region', y='employees', ax=ax2, palette='Set2')
    ax2.set_xlabel('Region', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Employees', fontsize=12, fontweight='bold')
    ax2.set_title('Regional Comparison: Employees', fontsize=14, fontweight='bold', pad=15)
    ax2.tick_params(axis='x', rotation=0)
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'fig3_regional_comparison.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"   ✅ 保存: fig3_regional_comparison.png")

def create_city_growth_chart(df):
    """図4: 都市別成長率（2007-2021年）"""
    print("\n📊 図4: 都市別成長率作成中...")
    
    # 2007年と2021年の両方があるデータのみ
    cities_with_both = df.groupby('cityName')['year'].apply(
        lambda x: (2007 in x.values) and (2021 in x.values)
    )
    cities_with_both = cities_with_both[cities_with_both].index.tolist()
    
    growth_data = []
    for city in cities_with_both:
        city_data = df[df['cityName'] == city].sort_values('year')
        data_2007 = city_data[city_data['year'] == 2007].iloc[0]
        data_2021 = city_data[city_data['year'] == 2021].iloc[0]
        
        est_growth = ((data_2021['establishments'] / data_2007['establishments']) - 1) * 100
        emp_growth = ((data_2021['employees'] / data_2007['employees']) - 1) * 100
        
        growth_data.append({
            'city': city,
            'establishments_growth': est_growth,
            'employees_growth': emp_growth
        })
    
    growth_df = pd.DataFrame(growth_data).sort_values('employees_growth', ascending=False)
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    x = np.arange(len(growth_df))
    width = 0.35
    
    bars1 = ax.bar(x - width/2, growth_df['establishments_growth'], width, 
                   label='Establishments', color='#2E86AB', alpha=0.8)
    bars2 = ax.bar(x + width/2, growth_df['employees_growth'], width, 
                   label='Employees', color='#A23B72', alpha=0.8)
    
    ax.set_xlabel('City', fontsize=12, fontweight='bold')
    ax.set_ylabel('Growth Rate (%)', fontsize=12, fontweight='bold')
    ax.set_title('Growth Rate by City (2007-2021)', fontsize=14, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(growth_df['city'], rotation=45, ha='right', fontsize=9)
    ax.axhline(y=0, color='black', linestyle='-', linewidth=0.8)
    ax.legend(fontsize=11)
    ax.grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'fig4_city_growth.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"   ✅ 保存: fig4_city_growth.png")

def create_statistics_summary(df):
    """図5: 基本統計量サマリー"""
    print("\n📊 図5: 基本統計量サマリー作成中...")
    
    # 2014年の異常値を除外
    df_filtered = df[df['year'] != 2014].copy()
    
    stats = df_filtered[['establishments', 'employees']].describe()
    
    with open(OUTPUT_DIR / 'table2_statistics_summary.txt', 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("表2: 基本統計量サマリー（2007/2012/2021年）\n")
        f.write("=" * 80 + "\n\n")
        f.write(stats.to_string())
        f.write("\n\n注: 2014年のAPI超詳細データは統計値の歪みを避けるため除外\n")
    
    print(f"   ✅ 保存: table2_statistics_summary.txt")

def create_efficiency_chart(df):
    """図6: 効率性指標（事業所当たり従業者数）"""
    print("\n📊 図6: 効率性指標作成中...")
    
    # 効率性計算
    df_eff = df.copy()
    df_eff['efficiency'] = df_eff['employees'] / df_eff['establishments']
    
    # 2014年の異常値を除外
    df_eff = df_eff[df_eff['year'] != 2014]
    
    yearly_eff = df_eff.groupby('year')['efficiency'].mean().reset_index()
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    ax.plot(yearly_eff['year'], yearly_eff['efficiency'], 
            marker='D', linewidth=2.5, markersize=10, color='#F18F01')
    ax.set_xlabel('Year', fontsize=12, fontweight='bold')
    ax.set_ylabel('Employees per Establishment', fontsize=12, fontweight='bold')
    ax.set_title('Efficiency Trend: Employees per Establishment', 
                 fontsize=14, fontweight='bold', pad=15)
    ax.grid(True, alpha=0.3)
    ax.set_xticks(yearly_eff['year'])
    
    # 値をプロット上に表示
    for _, row in yearly_eff.iterrows():
        ax.text(row['year'], row['efficiency'], f"{row['efficiency']:.1f}", 
                ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / 'fig6_efficiency_trend.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"   ✅ 保存: fig6_efficiency_trend.png")

def main():
    """メイン実行"""
    print("\n" + "="*80)
    print("中間発表用図表作成スクリプト")
    print("="*80)
    
    # データ読み込み
    df = load_data()
    
    # 各図表作成
    create_overview_table(df)
    create_time_series_chart(df)
    create_regional_comparison(df)
    create_city_growth_chart(df)
    create_statistics_summary(df)
    create_efficiency_chart(df)
    
    print("\n" + "="*80)
    print("✅ 全ての図表作成完了！")
    print(f"📁 保存場所: {OUTPUT_DIR}")
    print("="*80)
    
    # 作成ファイル一覧
    files = list(OUTPUT_DIR.glob('*'))
    print("\n📋 作成されたファイル:")
    for file in sorted(files):
        print(f"   - {file.name}")

if __name__ == '__main__':
    main()
