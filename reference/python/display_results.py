"""
分析結果の詳細表示スクリプト
"""

import json
import pandas as pd
from pathlib import Path

def display_analysis_results():
    """分析結果の詳細表示"""

    print("📊 詳細分析結果表示")
    print("="*60)

    # 結果ファイル読み込み
    results_path = 'results/tables/comprehensive_analysis_results.json'

    if not Path(results_path).exists():
        print("❌ 分析結果ファイルが見つかりません")
        return

    with open(results_path, 'r', encoding='utf-8') as f:
        results = json.load(f)

    # 1. 基本統計表示
    print("\n📈 基本統計量")
    print("-" * 40)

    desc_stats = results['descriptive']['overall_statistics']

    print(f"事業所数:")
    print(f"  平均: {desc_stats['establishments']['mean']:.1f}")
    print(f"  中央値: {desc_stats['establishments']['50%']:.0f}")
    print(f"  標準偏差: {desc_stats['establishments']['std']:.1f}")
    print(f"  範囲: {desc_stats['establishments']['min']:.0f} - {desc_stats['establishments']['max']:.0f}")

    print(f"\n従業者数:")
    print(f"  平均: {desc_stats['employees']['mean']:.1f}人")
    print(f"  中央値: {desc_stats['employees']['50%']:.0f}人")
    print(f"  標準偏差: {desc_stats['employees']['std']:.1f}人")
    print(f"  範囲: {desc_stats['employees']['min']:.0f} - {desc_stats['employees']['max']:.0f}人")

    # 2. 年別統計表示
    print("\n📅 年別統計")
    print("-" * 40)

    yearly_stats = results['descriptive']['yearly_statistics']

    for year in ['2007', '2012', '2021']:
        if year in yearly_stats:
            year_data = yearly_stats[year]
            print(f"\n{year}年:")
            if 'establishments' in year_data:
                print(f"  事業所数平均: {year_data['establishments']['mean']:.1f}")
            if 'employees' in year_data:
                print(f"  従業者数平均: {year_data['employees']['mean']:.1f}人")

    # 3. 都市別CAGR表示
    print("\n📊 都市別CAGR (2007-2021)")
    print("-" * 40)

    if 'timeseries' in results and 'city_timeseries' in results['timeseries']:
        city_data = results['timeseries']['city_timeseries']

        # データフレームに変換してソート
        cagr_data = []
        for city, data in city_data.items():
            cagr_data.append({
                'city': city,
                'est_cagr': data.get('establishments_cagr', 0),
                'emp_cagr': data.get('employees_cagr', 0)
            })

        cagr_df = pd.DataFrame(cagr_data)
        cagr_df = cagr_df.sort_values('emp_cagr', ascending=False)

        print(f"{'都市名':<10} {'事業所CAGR':<12} {'従業者CAGR':<12}")
        print("-" * 40)
        for _, row in cagr_df.iterrows():
            print(f"{row['city']:<10} {row['est_cagr']:>8.2f}% {row['emp_cagr']:>8.2f}%")

    # 4. 地域別比較表示
    print("\n🗾 地域別平均値")
    print("-" * 40)

    if 'regional' in results and 'regional_averages' in results['regional']:
        regional_data = results['regional']['regional_averages']

        print(f"{'地域':<8} {'事業所数':<10} {'従業者数':<12}")
        print("-" * 35)

        for region in ['九州', '関東', '中部', '四国', '近畿']:
            if region in regional_data['establishments']:
                est_avg = regional_data['establishments'][region]
                emp_avg = regional_data['employees'][region]
                print(f"{region:<8} {est_avg:>8.1f} {emp_avg:>10.1f}人")

    # 5. ANOVA結果表示
    print("\n🔬 統計検定結果")
    print("-" * 40)

    if 'regional' in results and 'anova_results' in results['regional']:
        anova_data = results['regional']['anova_results']

        print("地域間差異の分散分析（ANOVA）:")
        print(f"事業所数: F={anova_data['establishments']['f_statistic']:.3f}, p={anova_data['establishments']['p_value']:.3f}")
        print(f"従業者数: F={anova_data['employees']['f_statistic']:.3f}, p={anova_data['employees']['p_value']:.3f}")

        if anova_data['establishments']['p_value'] > 0.05:
            print("→ 地域間有意差なし（p>0.05）")
        else:
            print("→ 地域間有意差あり（p<0.05）")

    # 6. 相関分析結果表示
    print("\n🔗 相関分析結果")
    print("-" * 40)

    if 'correlation' in results and 'strong_correlations' in results['correlation']:
        corr_data = results['correlation']['strong_correlations']

        print("主要変数間の相関係数:")
        print(f"事業所数 vs 従業者数: r = {corr_data['establishments_vs_employees']:.3f}")
        print(f"事業所数 vs 販売額: r = {corr_data['establishments_vs_sales']:.3f}")
        print(f"従業者数 vs 販売額: r = {corr_data['employees_vs_sales']:.3f}")

    print("\n✅ 詳細結果表示完了")

if __name__ == "__main__":
    display_analysis_results()