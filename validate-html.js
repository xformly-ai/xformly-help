#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && file !== 'css' && file !== 'node_modules') {
            findHtmlFiles(filePath, fileList);
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

function validateHtml(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const issues = [];
    
    // CSSリンクの数をチェック
    const cssLinks = (content.match(/<link rel="stylesheet" href=".*?common\.css">/g) || []).length;
    if (cssLinks === 0) issues.push('CSSリンクなし');
    if (cssLinks > 1) issues.push(`CSSリンク重複(${cssLinks}個)`);
    
    // 固定ヘッダーの確認
    if (!content.includes('<div class="top-nav">')) {
        if (!filePath.includes('index.html') && !filePath.includes('00_トップページ')) {
            issues.push('top-navなし');
        }
    }
    
    // containerの確認
    if (!content.includes('<div class="container">')) issues.push('containerなし');
    
    return issues;
}

function main() {
    console.log('HTML構造検証\n');
    const htmlFiles = findHtmlFiles(process.cwd());
    let errorCount = 0;
    
    htmlFiles.forEach(file => {
        const issues = validateHtml(file);
        if (issues.length > 0) {
            console.log(`⚠️  ${path.relative(process.cwd(), file)}`);
            issues.forEach(issue => console.log(`   - ${issue}`));
            errorCount++;
        }
    });
    
    if (errorCount === 0) {
        console.log('✓ 全てのファイルが正常です！');
    } else {
        console.log(`\n${errorCount}個のファイルに問題があります`);
    }
}

main();
