# xformly-help
xFormlyのヘルプサイト

## 共通JavaScript構成

現在の画面共通ロジックは以下の3ファイルに分離しています。

- `js/common-interactions.js`
	- パネル遷移共通処理（`window.setupPanelNavigation`）
	- `data-category-url` を使ったクリック/Enter/Space遷移
	- リンクや入力要素クリック時は遷移を抑制

- `js/page-search.js`
	- 下層カテゴリページ向けのページ内検索共通処理（`window.setupPageSearch`）
	- 部分一致フィルタ、件数表示、未ヒット表示、デバウンス、Escリセット

- `js/index-search.js`
	- トップページ向け検索共通処理（`window.setupIndexSearch`）
	- トップ内フィルタ + 全ガイド横断検索 + スニペット表示

- `js/guide-metadata.js`
	- トップページ横断検索で使うページメタデータ（`window.guideMetadata`）

## 読み込み順（トップページ）

`index.html` では次の順で読み込みます。

1. `js/common-interactions.js`
2. `js/guide-metadata.js`
3. `js/index-search.js`

下層カテゴリページは、通常 `js/common-interactions.js` → `js/page-search.js` の順で読み込みます。
