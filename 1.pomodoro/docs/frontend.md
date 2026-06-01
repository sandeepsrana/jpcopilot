# フロントエンドドキュメント

## 現状

現在（Phase 0）のフロントエンドは最小構成のプレースホルダーです。  
タイマーロジック・UI インタラクションは未実装です。

---

## ファイル一覧

| ファイル                  | 説明                                        |
| ------------------------- | ------------------------------------------- |
| `templates/index.html`    | メイン画面 HTML テンプレート（Jinja2）      |
| `static/css/style.css`    | グローバルスタイルシート                    |
| `static/js/main.js`       | エントリポイント JavaScript（プレースホルダー） |

---

## `templates/index.html`

### 概要

Jinja2 テンプレートとして Flask から配信されます。

- 言語設定: `lang="ja"`
- 文字コード: `UTF-8`
- ビューポート: `width=device-width, initial-scale=1.0`
- タイトル: `ポモドーロタイマー`

### 静的ファイル参照

```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}" />
<script src="{{ url_for('static', filename='js/main.js') }}"></script>
```

Flask の `url_for` を使用してパスを生成しています。

### 現在の本文

```html
<main class="app-shell">
  <h1>ポモドーロタイマー</h1>
  <p>Phase 0: Flask最小構成で画面配信を確認するためのプレースホルダーです。</p>
</main>
```

---

## `static/css/style.css`

### 概要

CSS カスタムプロパティ（変数）とグローバルリセット、レイアウトを定義しています。

### CSS 変数

| 変数名   | 値          | 用途       |
| -------- | ----------- | ---------- |
| `--bg`   | `#f4f4f9`   | 背景色     |
| `--text` | `#222`      | テキスト色 |

### レイアウト

- `body`: `display: grid; place-items: center;` による縦横中央配置
- `.app-shell`: 最大幅 `min(90vw, 720px)`、カード形状（角丸 12px、影付き）

### `.app-shell` のスタイル

```css
.app-shell {
  width: min(90vw, 720px);
  padding: 24px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}
```

---

## `static/js/main.js`

### 現状

プレースホルダーとして以下の 1 行のみ実装されています。

```javascript
console.log("Pomodoro app shell loaded.");
```

---

## 将来予定のモジュール構成（未実装）

設計書（`../architecture.md`）に基づく予定のモジュール分割です。

| モジュール名      | ファイル名（予定）         | 担当                                   |
| ----------------- | -------------------------- | -------------------------------------- |
| TimerEngine       | `timer-engine.js`          | 開始/停止/リセット、フェーズ遷移ロジック |
| StateStore        | `state-store.js`           | 設定・統計の LocalStorage 管理         |
| UIController      | `ui-controller.js`         | 時間表示・フェーズ表示・ボタン制御     |
| ProgressRing      | `progress-ring.js`         | SVG ベースの円形進捗表示               |
| エントリポイント  | `main.js`                  | 各モジュールの初期化と接続             |

### タイマー精度方針

`setInterval` による単純な 1 秒減算ではなく、**終了予定時刻との差分**で残り時間を算出します。  
これにより、非アクティブタブ復帰時の時間ずれを抑制します。
