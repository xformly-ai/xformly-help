# 画像フォルダ構造

このフォルダにはヘルプサイトで使用する画像を配置します。

## フォルダ構成

- **common/** - 共通画像（ロゴ、アイコンなど）
- **01_hajimeni/** - 「はじめに」カテゴリの画像
- **02_kihon/** - 「基本操作」カテゴリの画像
- **03_shousai/** - 「詳細設定」カテゴリの画像
- **04_kanri/** - 「管理者向けガイド」の画像
- **05_faq/** - 「FAQ」カテゴリの画像
- **screenshots/** - 全体的なスクリーンショット

## 画像の命名規則

- 英数字、ハイフン、アンダースコアを使用
- 小文字推奨
- 例: `login-screen.png`, `upload_step1.png`, `csv-settings-01.png`

## 推奨画像仕様

- **形式**: PNG (スクリーンショット), JPG (写真), SVG (アイコン)
- **最大幅**: 1200px
- **ファイルサイズ**: 500KB以下推奨
- **解像度**: 72-96 DPI (Web用)

## HTMLでの参照方法

### 例1: 01_はじめに/01_xFormlyとは.html から画像を参照
```html
<img src="../images/01_hajimeni/login-screen.png" alt="ログイン画面">
```

### 例2: 02_基本操作/01_Excelファイルのアップロード.html から画像を参照
```html
<img src="../images/02_kihon/upload-step1.png" alt="アップロード手順1">
```

### 例3: index.html から画像を参照
```html
<img src="images/common/logo.png" alt="xFormlyロゴ">
```

## 相対パスの理解

```
現在のファイル位置              → 画像までのパス
──────────────────────────────────────────────
index.html                      → images/common/logo.png
01_はじめに/01_xxx.html         → ../images/01_hajimeni/xxx.png
02_基本操作/01_xxx.html         → ../images/02_kihon/xxx.png
```
