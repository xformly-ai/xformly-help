#!/usr/bin/env node

/**
 * 全HTMLファイルのインラインCSSを共通CSSファイルへのリンクに置き換えるスクリプト
 */

const fs = require('fs');
const path = require('path');

// HTMLファイルを再帰的に検索
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // cssディレクトリとnode_modulesは除外
            if (file !== 'css' && file !== 'node_modules' && file !== '.git') {
                findHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// HTMLファイルを処理
function processHtmlFile(filePath) {
    console.log(`処理中: ${path.relative(process.cwd(), filePath)}`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // 階層の深さを計算（CSSファイルへの相対パスを決定）
    const relativePath = path.relative(process.cwd(), filePath);
    const depth = relativePath.split(path.sep).length - 1;
    const cssPath = depth === 0 ? 'css/common.css' : '../css/common.css';
    
    // <style>タグとその内容を削除
    // ただし、ページ固有の特殊スタイルは保持する必要がある場合を考慮
    const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/g;
    const styleMatches = content.match(styleRegex);
    
    let pageSpecificStyles = '';
    
    if (styleMatches) {
        styleMatches.forEach(styleBlock => {
            // 特殊なスタイルを検出（example-box, hierarchy-box, flow-diagram等）
            const specialClasses = [
                'example-box',
                'hierarchy-box',
                'hierarchy-level',
                'flow-diagram',
                'flow-step',
                'flow-number',
                'flow-content'
            ];
            
            let hasSpecialStyles = false;
            specialClasses.forEach(className => {
                if (styleBlock.includes(`.${className}`)) {
                    hasSpecialStyles = true;
                }
            });
            
            if (hasSpecialStyles) {
                // 特殊スタイルのみ抽出
                const styleContent = styleBlock.replace(/<style[^>]*>|<\/style>/g, '');
                const lines = styleContent.split('\n');
                const specialLines = [];
                let inSpecialBlock = false;
                let braceCount = 0;
                
                lines.forEach(line => {
                    const trimmed = line.trim();
                    
                    // 特殊クラスの定義開始を検出
                    specialClasses.forEach(className => {
                        if (trimmed.includes(`.${className}`)) {
                            inSpecialBlock = true;
                        }
                    });
                    
                    if (inSpecialBlock) {
                        specialLines.push(line);
                        
                        // 中括弧のカウント
                        braceCount += (line.match(/{/g) || []).length;
                        braceCount -= (line.match(/}/g) || []).length;
                        
                        // ブロック終了
                        if (braceCount === 0 && trimmed.endsWith('}')) {
                            inSpecialBlock = false;
                        }
                    }
                });
                
                if (specialLines.length > 0) {
                    pageSpecificStyles = '<style>\n' + specialLines.join('\n') + '\n</style>\n';
                }
            }
        });
        
        // 全てのstyleタグを削除
        content = content.replace(styleRegex, '');
    }
    
    // <link>タグを挿入
    const linkTag = `<link rel="stylesheet" href="${cssPath}">`;
    
    // pageSpecificStylesがある場合は、linkの後に追加
    const headCloseRegex = /<\/head>/;
    if (pageSpecificStyles) {
        content = content.replace(headCloseRegex, `    ${linkTag}\n    ${pageSpecificStyles}</head>`);
    } else {
        content = content.replace(headCloseRegex, `    ${linkTag}\n</head>`);
    }
    
    // HTML構造を修正: <div class="container">の前にナビゲーションを移動
    // パターン1: <body>\s*<div class="container">\s*<div class="top-nav">
    const bodyContainerNavPattern = /(<body[^>]*>\s*)<div class="container">(\s*)<div class="top-nav">/;
    
    if (bodyContainerNavPattern.test(content)) {
        // top-navとbreadcrumbを抽出
        const topNavMatch = content.match(/<div class="top-nav">[\s\S]*?<\/div>\s*<\/div>/);
        const breadcrumbMatch = content.match(/<div class="breadcrumb">[\s\S]*?<\/div>\s*<\/div>/);
        
        if (topNavMatch && breadcrumbMatch) {
            const topNavHtml = topNavMatch[0];
            const breadcrumbHtml = breadcrumbMatch[0];
            
            // 元のtop-navとbreadcrumbを削除（最初の出現のみ）
            content = content.replace(topNavHtml, '%%%TOPNAV%%%');
            content = content.replace(breadcrumbHtml, '%%%BREADCRUMB%%%');
            
            // <body>タグの直後に配置
            content = content.replace(
                /(<body[^>]*>)/,
                `$1\n    ${topNavHtml}\n    ${breadcrumbHtml}\n`
            );
            
            // プレースホルダーを削除
            content = content.replace('%%%TOPNAV%%%', '');
            content = content.replace('%%%BREADCRUMB%%%', '');
            
            // <div class="container">が残っているか確認し、なければ追加
            if (!content.includes('<div class="container">')) {
                // 最初のh1の前にcontainerを追加
                content = content.replace(
                    /(<\/div>\s*<\/div>\s*\n\s*)(<h1)/,
                    '$1\n    <div class="container">\n\n$2'
                );
            } else {
                // containerを正しい位置に移動
                content = content.replace(
                    /(<\/div>\s*<\/div>\s*\n\s*)<div class="container">/,
                    '$1\n    <div class="container">'
                );
            }
        }
    }
    
    // 余分な空行を整理
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    // 変更があった場合のみ書き込み
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✓ 更新完了: ${path.relative(process.cwd(), filePath)}`);
        return true;
    } else {
        console.log(`→ 変更なし: ${path.relative(process.cwd(), filePath)}`);
        return false;
    }
}

// メイン処理
function main() {
    console.log('='.repeat(60));
    console.log('HTMLファイルのCSS統合スクリプト');
    console.log('='.repeat(60));
    console.log('');
    
    const htmlFiles = findHtmlFiles(process.cwd());
    console.log(`見つかったHTMLファイル: ${htmlFiles.length}個\n`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    htmlFiles.forEach(file => {
        try {
            if (processHtmlFile(file)) {
                updatedCount++;
            }
        } catch (error) {
            console.error(`✗ エラー: ${path.relative(process.cwd(), file)}`);
            console.error(`  ${error.message}`);
            errorCount++;
        }
        console.log('');
    });
    
    console.log('='.repeat(60));
    console.log(`処理完了: ${htmlFiles.length}個中 ${updatedCount}個を更新`);
    if (errorCount > 0) {
        console.log(`エラー: ${errorCount}個`);
    }
    console.log('='.repeat(60));
}

// 実行
main();
