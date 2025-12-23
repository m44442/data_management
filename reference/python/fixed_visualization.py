"""
日本語フォント対応の可視化スクリプト
文字化け対策用
"""

import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import matplotlib.font_manager as fm
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# 日本語フォント設定
def setup_japanese_font():
    """日本語フォントの設定"""
    # macOSの日本語フォント候補
    japanese_fonts = [
        'Hiragino Sans',
        'Hiragino Kaku Gothic Pro',
        'Yu Gothic',
        'Meiryo',
        'DejaVu Sans'  # フォールバック
    ]

    for font in japanese_fonts:
        try:
            plt.rcParams['font.family'] = font
            print(f"✅ フォント設定完了: {font}")
            break
        except:
            continue

    # その他の設定
    plt.rcParams['font.size'] = 12
    plt.rcParams['axes.unicode_minus'] = False
    sns.set_style("whitegrid")
    plt.style.use('default')

def load_data():
    """データ読み込み"""
    with open('data/processed/unified_retail_dataset.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    df = pd.DataFrame(data)

    # データ型調整
    df['year'] = df['year'].astype(int)
    df['establishments'] = pd.to_numeric(df['establishments'])
    df['employees'] = pd.to_numeric(df['employees'])
    df['sales'] = pd.to_numeric(df['sales'], errors='coerce')
    df['salesArea'] = pd.to_numeric(df['salesArea'], errors='coerce')

    return df

def create_comprehensive_figure():
    """包括的分析図の作成（日本語対応）"""
    setup_japanese_font()
    df = load_data()

    # フィルター: 3時点データのみ使用
    df_3point = df[df['year'].isin([2007, 2012, 2021])].copy()

    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('小売業データ包括分析 (2007-2021年)', fontsize=16, fontweight='bold')

    # 1. 時系列推移
    yearly_stats = df_3point.groupby('year').agg({
        'establishments': 'mean',
        'employees': 'mean'
    }).reset_index()

    ax1.plot(yearly_stats['year'], yearly_stats['establishments'],
             marker='o', linewidth=3, markersize=8, color='#1f77b4')
    ax1.set_title('事業所数の推移', fontsize=14, fontweight='bold')
    ax1.set_xlabel('年次')
    ax1.set_ylabel('平均事業所数')
    ax1.grid(True, alpha=0.3)

    ax2.plot(yearly_stats['year'], yearly_stats['employees'],
             marker='s', linewidth=3, markersize=8, color='#ff7f0e')
    ax2.set_title('従業者数の推移', fontsize=14, fontweight='bold')
    ax2.set_xlabel('年次')
    ax2.set_ylabel('平均従業者数')
    ax2.grid(True, alpha=0.3)

    # 2. 2021年都市別事業所数
    data_2021 = df[df['year'] == 2021].copy()
    data_2021_sorted = data_2021.sort_values('establishments', ascending=True)

    ax3.barh(data_2021_sorted['cityName'], data_2021_sorted['establishments'],
             color='#2ca02c', alpha=0.8)
    ax3.set_title('2021年都市別事業所数', fontsize=14, fontweight='bold')
    ax3.set_xlabel('事業所数')

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
    ax4.set_title('効率性指標の推移', fontsize=14, fontweight='bold')
    ax4.set_xlabel('年次')
    ax4.set_ylabel('事業所当たり従業者数')
    ax4.grid(True, alpha=0.3)

    # レイアウト調整
    plt.tight_layout()

    # 保存
    output_path = 'results/figures/comprehensive_analysis_fixed.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    print(f"📊 包括分析図を保存: {output_path}")

    plt.show()

def create_regional_heatmap():
    """地域別ヒートマップの作成（日本語対応）"""
    setup_japanese_font()
    df = load_data()

    # 3時点データのみ使用
    df_3point = df[df['year'].isin([2007, 2012, 2021])].copy()

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

    # 地域別集計
    regional_est = df_3point.groupby(['region', 'year'])['establishments'].sum().unstack(fill_value=0)
    regional_emp = df_3point.groupby(['region', 'year'])['employees'].sum().unstack(fill_value=0)

    # 事業所数ヒートマップ
    sns.heatmap(regional_est, annot=True, fmt='d', cmap='Blues', ax=ax1, cbar_kws={'label': '事業所数'})
    ax1.set_title('地域別事業所数の推移', fontsize=14, fontweight='bold')
    ax1.set_xlabel('年次')
    ax1.set_ylabel('地域')

    # 従業者数ヒートマップ
    sns.heatmap(regional_emp, annot=True, fmt='d', cmap='Oranges', ax=ax2, cbar_kws={'label': '従業者数'})
    ax2.set_title('地域別従業者数の推移', fontsize=14, fontweight='bold')
    ax2.set_xlabel('年次')
    ax2.set_ylabel('地域')

    plt.tight_layout()

    # 保存
    output_path = 'results/figures/regional_heatmap_fixed.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    print(f"📊 地域ヒートマップを保存: {output_path}")

    plt.show()

def create_growth_comparison():
    """都市別成長率比較図の作成"""
    setup_japanese_font()
    df = load_data()

    # CAGR計算（2007-2021）
    growth_data = []
    cities = df['cityName'].unique()

    for city in cities:
        city_data = df[df['cityName'] == city]

        # 2007年と2021年のデータを取得
        data_2007 = city_data[city_data['year'] == 2007]
        data_2021 = city_data[city_data['year'] == 2021]

        if len(data_2007) > 0 and len(data_2021) > 0:
            est_2007 = data_2007['establishments'].iloc[0]
            est_2021 = data_2021['establishments'].iloc[0]
            emp_2007 = data_2007['employees'].iloc[0]
            emp_2021 = data_2021['employees'].iloc[0]

            # CAGR計算
            years = 14  # 2007-2021
            est_cagr = (est_2021 / est_2007) ** (1/years) - 1
            emp_cagr = (emp_2021 / emp_2007) ** (1/years) - 1

            growth_data.append({
                'city': city,
                'est_cagr': est_cagr * 100,
                'emp_cagr': emp_cagr * 100
            })

    growth_df = pd.DataFrame(growth_data)
    growth_df = growth_df.sort_values('emp_cagr', ascending=True)

    fig, ax = plt.subplots(figsize=(12, 8))

    x = range(len(growth_df))
    width = 0.35

    ax.barh([i - width/2 for i in x], growth_df['est_cagr'], width,
            label='事業所数CAGR', color='#1f77b4', alpha=0.8)
    ax.barh([i + width/2 for i in x], growth_df['emp_cagr'], width,
            label='従業者数CAGR', color='#ff7f0e', alpha=0.8)

    ax.set_yticks(x)
    ax.set_yticklabels(growth_df['city'])
    ax.set_xlabel('年平均成長率 (%)')
    ax.set_title('都市別CAGR比較 (2007-2021年)', fontsize=14, fontweight='bold')
    ax.legend()
    ax.axvline(x=0, color='black', linestyle='--', alpha=0.5)
    ax.grid(True, alpha=0.3)

    plt.tight_layout()

    # 保存
    output_path = 'results/figures/growth_comparison_fixed.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    print(f"📊 成長率比較図を保存: {output_path}")

    plt.show()

def main():
    """メイン実行関数"""
    print("🚀 日本語対応可視化システム開始")
    print("="*50)

    # 出力ディレクトリ作成
    Path('results/figures').mkdir(parents=True, exist_ok=True)

    try:
        # 1. 包括分析図
        print("\n📊 包括分析図を作成中...")
        create_comprehensive_figure()

        # 2. 地域ヒートマップ
        print("\n📊 地域ヒートマップを作成中...")
        create_regional_heatmap()

        # 3. 成長率比較図
        print("\n📊 成長率比較図を作成中...")
        create_growth_comparison()

        print("\n✅ すべての図表生成完了!")
        print("📁 保存先: results/figures/")

    except Exception as e:
        print(f"❌ エラー発生: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()