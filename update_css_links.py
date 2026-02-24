#!/usr/bin/env python3
"""
全HTMLファイルのインラインCSSを共通CSSファイルへのリンクに置き換えるスクリプト
"""
import os
import re
from pathlib import Path

def update_html_file(file_path, css_path_relative):
    """HTMLファイルを読み込んで、スタイルタグをlinkタグに置き換え、構造を修正"""
    
    print(f"処理中: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # <style>タグとその中身を削除して<link>タグに置き換え
    # パターン1: <style>...</style> (複数行)
    pattern1 = r'<style>.*?</style>'
    if re.search(pattern1, content, re.DOTALL):
        content = re.sub(pattern1, f'<link rel="stylesheet" href="{css_path_relative}">', content, flags=re.DOTALL)
    
    # HTMLの構造を修正: <div class="container">の前にナビゲーションを移動
    # パターン: <body>\s*<div class="container">\s*<div class="top-nav">
    if '<body>' in content and '<div class="container">' in content:
        # containerの直後にtop-navとbreadcrumbがある場合を修正
        pattern2 = r'(<body>\s*)<div class="container">(\s*)<div class="top-nav">'
        if re.search(pattern2, content):
            # まだ修正していないファイル
            # top-navとbreadcrumbをcontainerの外に移動
            
            # top-navを抽出
            top_nav_match = re.search(r'(<div class="top-nav">.*?</div>\s*</div>)', content, re.DOTALL)
            # breadcrumbを抽出
            breadcrumb_match = re.search(r'(<div class="breadcrumb">.*?</div>\s*</div>)', content, re.DOTALL)
            
            if top_nav_match and breadcrumb_match:
                top_nav_html = top_nav_match.group(1)
                breadcrumb_html = breadcrumb_match.group(1)
                
                # 元のtop-navとbreadcrumbを削除
                content = content.replace(top_nav_html, '', 1)
                content = content.replace(breadcrumb_html, '', 1)
                
                # bodyタグの直後に挿入
                content = content.replace('<body>', 
                    f'<body>\n    {top_nav_html}\n    {breadcrumb_html}\n', 1)
                
                # container開始タグの前の余分な空白を削除し、正しく配置
                content = re.sub(r'(<body>.*?</div>\s*</div>\s*)\s*<div class="container">',
                                r'\1\n    <div class="container">',
                                content, count=1, flags=re.DOTALL)
    
    # 最初のh1の前にcontainer開始タグがない場合は追加（念のため）
    # これは通常発生しないはずだが、安全のため
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ 完了: {file_path}")

def main():
    """メイン処理"""
    base_dir = Path(__file__).parent
    
    # 全HTMLファイルを検索
    html_files = list(base_dir.glob('**/*.html'))
    
    print(f"見つかったHTMLファイル: {len(html_files)}個\n")
    
    for html_file in html_files:
        # 相対パスを計算
        rel_path = html_file.relative_to(base_dir)
        depth = len(rel_path.parts) - 1  # ファイル自身を除く階層の深さ
        
        if depth == 0:
            # トップレベル (index.html など)
            css_path = 'css/common.css'
        else:
            # サブディレクトリ
            css_path = '../css/common.css'
        
        try:
            update_html_file(html_file, css_path)
        except Exception as e:
            print(f"✗ エラー: {html_file}: {e}")
    
    print(f"\n完了: {len(html_files)}個のファイルを処理しました")

if __name__ == '__main__':
    main()
