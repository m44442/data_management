"""
CAGR数値を修正したグラフ生成
"""

import json
import pandas as pd
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings('ignore')

# 英語フォント設定
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 12
sns.set_style("whitegrid") if 'sns' in globals() else None

def create_corrected_cagr_graph():
    """正確なCAGRデータでグラフ作成"""

    # 実際のJSONデータから直接取得
    with open('results/tables/comprehensive_analysis_results.json', 'r', encoding='utf-8') as f:
        results = json.load(f)

    # CAGRデータを抽出
    city_timeseries = results['timeseries']['city_timeseries']

    growth_data = []
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

    for city_jp, city_en in city_mapping.items():
        if city_jp in city_timeseries:
            data = city_timeseries[city_jp]
            growth_data.append({
                'city': city_en,
                'est_cagr': data['establishments_cagr'],
                'emp_cagr': data['employees_cagr']
            })

    growth_df = pd.DataFrame(growth_data)
    growth_df = growth_df.sort_values('emp_cagr', ascending=True)

    # データの確認出力
    print("📊 CAGR数値確認:")
    print("-" * 40)
    for _, row in growth_df.iterrows():
        print(f"{row['city']:<12}: {row['emp_cagr']:>6.2f}%")
    print("-" * 40)

    fig, ax = plt.subplots(figsize=(12, 8))

    x = range(len(growth_df))
    width = 0.35

    bars1 = ax.barh([i - width/2 for i in x], growth_df['est_cagr'], width,
                   label='Establishments CAGR', color='#1f77b4', alpha=0.8)
    bars2 = ax.barh([i + width/2 for i in x], growth_df['emp_cagr'], width,
                   label='Employees CAGR', color='#ff7f0e', alpha=0.8)

    ax.set_yticks(x)
    ax.set_yticklabels(growth_df['city'])
    ax.set_xlabel('Annual Growth Rate (%)')
    ax.set_title('CAGR Comparison by City (2007-2021)', fontsize=14, fontweight='bold')
    ax.legend()
    ax.axvline(x=0, color='black', linestyle='--', alpha=0.5)
    ax.grid(True, alpha=0.3, axis='x')

    # 数値ラベル追加（事業所CAGR + 従業者CAGR）
    for i, (_, row) in enumerate(growth_df.iterrows()):
        # 事業所CAGRラベル
        ax.text(row['est_cagr'] - 0.7, i - width/2, f"{row['est_cagr']:.2f}%",
               va='center', fontsize=9, color='#1f77b4', fontweight='bold')

        # 従業者CAGRラベル
        if row['emp_cagr'] >= 0:
            ax.text(row['emp_cagr'] + 0.15, i + width/2, f"{row['emp_cagr']:.2f}%",
                   va='center', fontsize=9, color='#ff7f0e', fontweight='bold')
        else:
            ax.text(row['emp_cagr'] - 0.6, i + width/2, f"{row['emp_cagr']:.2f}%",
                   va='center', fontsize=9, color='#ff7f0e', fontweight='bold')

    plt.tight_layout()

    # 保存
    output_path = 'results/figures/cagr_comparison_corrected.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    print(f"\n✅ 修正版CAGRグラフを保存: {output_path}")
    plt.close()

    return growth_df

if __name__ == "__main__":
    print("🔧 CAGR数値修正版グラフ生成")
    print("="*50)
    df = create_corrected_cagr_graph()