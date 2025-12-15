"""
利用可能な日本語フォントを確認
"""
import matplotlib.font_manager as fm

# 全フォントを取得
fonts = fm.findSystemFonts()

# 日本語フォントっぽいものを抽出
japanese_fonts = []
for font_path in fonts:
    try:
        font_name = fm.get_font(font_path).family_name
        # 日本語フォントっぽいものをフィルタ
        if any(keyword in font_name for keyword in ['Hiragino', 'ヒラギノ', 'Yu Gothic', 'Meiryo', 'メイリオ', 'Osaka', 'MS Gothic', 'AppleGothic']):
            japanese_fonts.append(font_name)
    except:
        pass

# 重複を削除してソート
japanese_fonts = sorted(set(japanese_fonts))

print("利用可能な日本語フォント:")
for i, font in enumerate(japanese_fonts, 1):
    print(f"{i}. {font}")
