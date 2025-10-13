#!/usr/bin/env python3
"""
小売業データの分析・可視化スクリプト
期間別比較とグラフ生成に特化
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json

# 日本語フォント設定（macOS対応）
plt.rcParams['font.family'] = ['Arial Unicode MS', 'Hiragino Sans', 'Yu Gothic', 'Meiryo']
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10

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

def create_period_comparison_table(df):
    """期間別比較表を作成"""
    print("\n=== 期間別比較表作成 ===")
    
    # 年次を期間に分類
    df['period'] = df['year'].apply(lambda x: 
        '2007-2012' if x <= 2012 else '2012-2021'
    )
    
    # 期間別統計
    period_stats = {}
    
    for city in df['city'].unique():
        city_data = df[df['city'] == city]
        city_stats = {}
        
        for period in ['2007-2012', '2012-2021']:
            if period == '2007-2012':
                start_data = city_data[city_data['year'] == 2007]
                end_data = city_data[city_data['year'] == 2012]
            else:
                start_data = city_data[city_data['year'] == 2012]
                end_data = city_data[city_data['year'] == 2021]
            
            if len(start_data) > 0 and len(end_data) > 0:
                period_change = {}
                metrics = ['establishments', 'employees', 'sales', 'salesArea']
                
                for metric in metrics:
                    start_val = float(start_data[metric].iloc[0])
                    end_val = float(end_data[metric].iloc[0])
                    change_pct = ((end_val - start_val) / start_val) * 100
                    
                    period_change[metric] = {
                        'start': start_val,
                        'end': end_val,
                        'change_pct': change_pct,
                        'change_abs': end_val - start_val
                    }
                
                city_stats[period] = period_change
        
        period_stats[city] = city_stats
    
    # 結果をJSON形式で保存
    results_dir = Path(__file__).parent.parent / 'results' / 'tables'
    results_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = results_dir / 'period_comparison.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(period_stats, f, ensure_ascii=False, indent=2)
    
    print(f"💾 期間別比較データを保存: {output_path}")
    
    # Markdown形式でも出力
    md_output = generate_markdown_report(period_stats, df)
    md_path = results_dir / 'period_comparison.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_output)
    
    print(f"📄 期間別比較レポート(Markdown)を保存: {md_path}")
    
    return period_stats

def generate_markdown_report(period_stats, df):
    """Markdownレポートを生成"""
    md = "# 小売業データ期間別比較分析レポート\n\n"
    md += f"**分析日時**: {pd.Timestamp.now().strftime('%Y年%m月%d日')}\n\n"
    
    # サマリー
    md += "## 📊 分析サマリー\n\n"
    cities = list(period_stats.keys())
    years = sorted(df['year'].unique())
    md += f"- **対象都市**: {', '.join(cities)}\n"
    md += f"- **対象期間**: {min(years)}年 - {max(years)}年\n"
    md += f"- **比較期間**: 2007-2012年、2012-2021年\n\n"
    
    # 都市別詳細分析
    for city in cities:
        md += f"## 🏙️ {city}\n\n"
        
        for period in ['2007-2012', '2012-2021']:
            if period in period_stats[city]:
                md += f"### {period}年\n\n"
                period_data = period_stats[city][period]
                
                md += "| 指標 | 開始値 | 終了値 | 変化量 | 変化率 |\n"
                md += "|------|--------|--------|--------|--------|\n"
                
                metric_names = {
                    'establishments': '事業所数',
                    'employees': '従業者数',
                    'sales': '販売額(百万円)',
                    'salesArea': '売場面積(㎡)'
                }
                
                for metric, data in period_data.items():
                    name = metric_names.get(metric, metric)
                    start = f"{data['start']:,}"
                    end = f"{data['end']:,}"
                    change_abs = f"{data['change_abs']:+,}"
                    change_pct = f"{data['change_pct']:+.1f}%"
                    
                    md += f"| {name} | {start} | {end} | {change_abs} | {change_pct} |\n"
                
                md += "\n"
        
        md += "\n"
    
    # 都市間比較
    md += "## 🔄 都市間比較\n\n"
    
    # 最新年（2021年）での比較
    latest_data = df[df['year'] == 2021]
    if len(latest_data) == 2:
        city1 = latest_data.iloc[0]
        city2 = latest_data.iloc[1]
        
        md += f"### {max(df['year'])}年時点での比較\n\n"
        md += "| 指標 | " + city1['city'] + " | " + city2['city'] + " | 差（倍率） |\n"
        md += "|------|" + "-" * len(city1['city']) + "|" + "-" * len(city2['city']) + "|----------|\n"
        
        metrics = ['establishments', 'employees', 'sales', 'salesArea', 'salesPerEmployee']
        metric_names = {
            'establishments': '事業所数',
            'employees': '従業者数',
            'sales': '販売額(百万円)',
            'salesArea': '売場面積(㎡)',
            'salesPerEmployee': '従業者1人当たり販売額'
        }
        
        for metric in metrics:
            if metric in city1 and metric in city2:
                val1 = city1[metric]
                val2 = city2[metric]
                ratio = val2 / val1
                
                name = metric_names.get(metric, metric)
                md += f"| {name} | {val1:,.0f} | {val2:,.0f} | {ratio:.2f}倍 |\n"
    
    return md

def create_comprehensive_graphs(df):
    """包括的なグラフセットを作成"""
    print("\n=== 包括的グラフ作成 ===")
    
    # 保存先ディレクトリ
    figures_dir = Path(__file__).parent.parent / 'results' / 'figures'
    figures_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. 時系列比較（4指標）
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('小売業主要指標の時系列変化', fontsize=16, fontweight='bold')
    
    metrics = ['establishments', 'employees', 'sales', 'salesArea']
    titles = ['事業所数', '従業者数', '年間商品販売額（百万円）', '売場面積（㎡）']
    colors = ['#1f77b4', '#ff7f0e']
    
    for i, (metric, title) in enumerate(zip(metrics, titles)):
        ax = axes[i//2, i%2]
        
        for j, city in enumerate(df['city'].unique()):
            city_data = df[df['city'] == city].sort_values('year')
            ax.plot(city_data['year'], city_data[metric], 
                   marker='o', linewidth=3, markersize=8, 
                   label=city, color=colors[j])
        
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel('年', fontsize=12)
        ax.set_ylabel(title, fontsize=12)
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3)
        ax.tick_params(labelsize=10)
        
        # Y軸の数値フォーマット
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:,.0f}'))
    
    plt.tight_layout()
    plt.savefig(figures_dir / 'time_series_comprehensive.png', dpi=300, bbox_inches='tight')
    print(f"📊 時系列グラフを保存: {figures_dir / 'time_series_comprehensive.png'}")
    plt.close()
    
    # 2. 効率性指標の比較
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('効率性指標の時系列変化', fontsize=16, fontweight='bold')
    
    efficiency_metrics = ['salesPerEmployee', 'salesPerEstablishment', 
                         'employeesPerEstablishment', 'salesAreaPerEmployee']
    efficiency_titles = ['従業者1人当たり販売額（百万円）', '1事業所当たり販売額（百万円）', 
                        '1事業所当たり従業者数（人）', '従業者1人当たり売場面積（㎡）']
    
    for i, (metric, title) in enumerate(zip(efficiency_metrics, efficiency_titles)):
        ax = axes[i//2, i%2]
        
        for j, city in enumerate(df['city'].unique()):
            city_data = df[df['city'] == city].sort_values('year')
            ax.plot(city_data['year'], city_data[metric], 
                   marker='s', linewidth=3, markersize=8, 
                   label=city, color=colors[j])
        
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_xlabel('年', fontsize=12)
        ax.set_ylabel(title, fontsize=12)
        ax.legend(fontsize=11)
        ax.grid(True, alpha=0.3)
        ax.tick_params(labelsize=10)
        
        # Y軸の数値フォーマット
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.1f}'))
    
    plt.tight_layout()
    plt.savefig(figures_dir / 'efficiency_comprehensive.png', dpi=300, bbox_inches='tight')
    print(f"📊 効率性指標グラフを保存: {figures_dir / 'efficiency_comprehensive.png'}")
    plt.close()
    
    # 3. 期間別変化率の比較
    create_period_change_graph(df, figures_dir)
    
    # 4. 都市間比較バーチャート
    create_city_comparison_graph(df, figures_dir)

def create_period_change_graph(df, figures_dir):
    """期間別変化率のグラフを作成"""
    print("📊 期間別変化率グラフを作成中...")
    
    # 期間別変化率を計算
    change_data = []
    
    for city in df['city'].unique():
        city_data = df[df['city'] == city].sort_values('year')
        
        # 2007-2012年の変化率
        if len(city_data) >= 2:
            data_2007 = city_data[city_data['year'] == 2007]
            data_2012 = city_data[city_data['year'] == 2012]
            data_2021 = city_data[city_data['year'] == 2021]
            
            if len(data_2007) > 0 and len(data_2012) > 0:
                for metric in ['establishments', 'employees', 'sales']:
                    val_2007 = data_2007[metric].iloc[0]
                    val_2012 = data_2012[metric].iloc[0]
                    change_pct = ((val_2012 - val_2007) / val_2007) * 100
                    
                    change_data.append({
                        'city': city,
                        'period': '2007-2012',
                        'metric': metric,
                        'change_pct': change_pct
                    })
            
            if len(data_2012) > 0 and len(data_2021) > 0:
                for metric in ['establishments', 'employees', 'sales']:
                    val_2012 = data_2012[metric].iloc[0]
                    val_2021 = data_2021[metric].iloc[0]
                    change_pct = ((val_2021 - val_2012) / val_2012) * 100
                    
                    change_data.append({
                        'city': city,
                        'period': '2012-2021',
                        'metric': metric,
                        'change_pct': change_pct
                    })
    
    change_df = pd.DataFrame(change_data)
    
    # グラフ作成
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle('期間別変化率比較', fontsize=16, fontweight='bold')
    
    metrics = ['establishments', 'employees', 'sales']
    titles = ['事業所数', '従業者数', '販売額']
    
    for i, (metric, title) in enumerate(zip(metrics, titles)):
        ax = axes[i]
        
        # データをピボット
        pivot_data = change_df[change_df['metric'] == metric].pivot(
            index='city', columns='period', values='change_pct'
        )
        
        pivot_data.plot(kind='bar', ax=ax, color=['#ff7f0e', '#1f77b4'], width=0.7)
        ax.set_title(f'{title}の変化率', fontsize=14, fontweight='bold')
        ax.set_xlabel('都市', fontsize=12)
        ax.set_ylabel('変化率（%）', fontsize=12)
        ax.legend(title='期間', fontsize=10)
        ax.grid(True, alpha=0.3, axis='y')
        ax.axhline(y=0, color='black', linestyle='-', alpha=0.5)
        
        # ラベルの回転
        ax.tick_params(axis='x', rotation=0)
        
        # パーセント表示
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.1f}%'))
    
    plt.tight_layout()
    plt.savefig(figures_dir / 'period_change_comparison.png', dpi=300, bbox_inches='tight')
    print(f"📊 期間別変化率グラフを保存: {figures_dir / 'period_change_comparison.png'}")
    plt.close()

def create_city_comparison_graph(df, figures_dir):
    """都市間比較バーチャートを作成"""
    print("📊 都市間比較グラフを作成中...")
    
    # 最新年のデータで比較
    latest_year = df['year'].max()
    latest_data = df[df['year'] == latest_year]
    
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle(f'{latest_year}年 都市間比較', fontsize=16, fontweight='bold')
    
    metrics = ['establishments', 'employees', 'sales', 'salesPerEmployee']
    titles = ['事業所数', '従業者数', '販売額（百万円）', '従業者1人当たり販売額（百万円）']
    colors = ['#1f77b4', '#ff7f0e']
    
    for i, (metric, title) in enumerate(zip(metrics, titles)):
        ax = axes[i//2, i%2]
        
        cities = latest_data['city'].tolist()
        values = latest_data[metric].tolist()
        
        bars = ax.bar(cities, values, color=colors, alpha=0.8, width=0.6)
        
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_ylabel(title, fontsize=12)
        ax.grid(True, alpha=0.3, axis='y')
        
        # 値をバーの上に表示
        for bar, value in zip(bars, values):
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{value:,.0f}',
                   ha='center', va='bottom', fontsize=11, fontweight='bold')
        
        # Y軸フォーマット
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:,.0f}'))
    
    plt.tight_layout()
    plt.savefig(figures_dir / 'city_comparison_latest.png', dpi=300, bbox_inches='tight')
    print(f"📊 都市間比較グラフを保存: {figures_dir / 'city_comparison_latest.png'}")
    plt.close()

def main():
    """メイン処理"""
    print("=== 小売業データ分析・可視化 ===\n")
    
    # データ読み込み
    df = load_data()
    if df is None:
        return
    
    # 期間別比較表作成
    period_stats = create_period_comparison_table(df)
    
    # 包括的グラフ作成
    create_comprehensive_graphs(df)
    
    print("\n✅ 分析・可視化完了!")
    print("\n📊 生成されたファイル:")
    
    figures_dir = Path(__file__).parent.parent / 'results' / 'figures'
    tables_dir = Path(__file__).parent.parent / 'results' / 'tables'
    
    print("   グラフ:")
    for graph_file in ['time_series_comprehensive.png', 'efficiency_comprehensive.png', 
                       'period_change_comparison.png', 'city_comparison_latest.png']:
        print(f"   - {figures_dir / graph_file}")
    
    print("   データ・レポート:")
    for data_file in ['period_comparison.json', 'period_comparison.md']:
        print(f"   - {tables_dir / data_file}")

if __name__ == "__main__":
    main()