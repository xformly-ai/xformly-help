#!/usr/bin/env node

/**
 * HTMLファイルから重複したCSSリンクを削除するスクリプト
 */

const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            if (file !== 'css' && file !== 'node_modules' && file !== '.git') {
                findHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

function removeDuplicateCssLinks(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // 重複したlinkタグを検出して削除
    const linkPattern = /\s*<link rel="stylesheet" href="(\.\.\/)?css\/common\.css">\s*/g;
    const matches = [...content.matchAll(linkPattern)];
    
    if (matches.length > 1) {
        console.log(`${path.relative(process.cwd(), filePath)}: ${matches.length}個の重複を検出`);
        
        // 最初の1つを除いて削除
        let firstMatch = true;
        content = content.replace(linkPattern, (match) => {
            if (firstMatch) {
                firstMatch = false;
                return match;
            }
            return '';
        });
        
        // 余分な空行を整理
        content = content.replace(/\n\n\n+/g, '\n\n');
        
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✓ 修正完了`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('重複CSSリンク削除スクリプト\n');
    
    const htmlFiles = findHtmlFiles(process.cwd());
    let fixedCount = 0;
    
    htmlFiles.forEach(file => {
        if (removeDuplicateCssLinks(file)) {
            fixedCount++;
        }
    });
    
    console.log(`\n完了: ${htmlFiles.length}個中 ${fixedCount}個を修正`);
}

main();
