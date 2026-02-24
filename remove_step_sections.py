import re
from pathlib import Path

files_to_fix = [
    '02_基本操作/02_CSV出力設定.html',
    '02_基本操作/04_CSVのダウンロード.html',
    '02_基本操作/05_やり直しと再実行.html',
    '01_はじめに/02_ログイン・ログアウト.html',
    '01_はじめに/03_初期設定.html',
    '01_はじめに/06_メールアドレス変更.html'
]

for file_path in files_to_fix:
    path = Path(file_path)
    if not path.exists():
        print(f'Skip: {file_path} (not found)')
        continue
    
    content = path.read_text(encoding='utf-8')
    original_content = content
    
    # <div class="step-section">を削除
    content = re.sub(r'<div class="step-section">\s*\n', '', content)
    content = re.sub(r'<div class="step-section">', '', content)
    
    # step-sectionの終了タグを削除
    # 構造を解析して対応する</div>を削除
    lines = content.split('\n')
    result_lines = []
    in_h3_block = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # </div>のみの行で、直前がh3配下のコンテンツ終了と思われる場合は削除
        if stripped == '</div>':
            # 前の数行を確認
            context_lines = []
            for j in range(max(0, i-5), i):
                if lines[j].strip():
                    context_lines.append(lines[j].strip())
            
            # step-sectionの終了と思われるパターン
            # - h3の後
            # - ulやolの後
            # - pの後
            # - noteやwarningの</div>の後
            skip = False
            if context_lines:
                last_content = context_lines[-1] if context_lines else ''
                if (last_content.startswith('<h3>') or 
                    last_content == '</ul>' or 
                    last_content == '</ol>' or
                    last_content == '</p>' or
                    (last_content == '</div>' and i > 0 and any('<div class="note">' in lines[j] or '<div class="warning">' in lines[j] for j in range(max(0, i-10), i)))):
                    skip = True
            
            if skip:
                continue
        
        result_lines.append(line)
    
    content = '\n'.join(result_lines)
    
    if content != original_content:
        path.write_text(content, encoding='utf-8')
        print(f'✓ Fixed: {file_path}')
    else:
        print(f'○ No change: {file_path}')

print('\n完了しました')
