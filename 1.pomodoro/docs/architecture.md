# アーキテクチャ（現状）

## 実装フェーズ

現在は **Phase 0**（Flask 最小構成で画面配信を確認）の段階です。

---

## ディレクトリ構成

```
1.pomodoro/
├── app.py               # Flask アプリケーション本体
├── templates/
│   └── index.html       # メイン画面テンプレート
└── static/
    ├── css/
    │   └── style.css    # スタイルシート
    └── js/
        └── main.js      # フロントエンド JavaScript（プレースホルダー）
```

---

## Flask アプリケーション構成（`app.py`）

### App Factory パターン

`create_app()` 関数でアプリケーションインスタンスを生成します。

```python
def create_app() -> Flask:
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.register_blueprint(page_bp)
    return app
```

### Blueprint

| Blueprint 名 | 変数名     | 担当           |
| ------------ | ---------- | -------------- |
| `page`       | `page_bp`  | 画面ページ配信 |

### ルーティング

| メソッド | パス | ハンドラ    | 説明                        |
| -------- | ---- | ----------- | --------------------------- |
| `GET`    | `/`  | `index()`   | `index.html` をレンダリング |

### デバッグモード制御

環境変数 `FLASK_DEBUG` で制御します。  
`1` / `true` / `yes` / `on`（大文字小文字不問）のいずれかを設定するとデバッグモードが有効になります。

```python
debug = os.getenv("FLASK_DEBUG", "").strip().lower() in ("1", "true", "yes", "on")
app.run(debug=debug)
```

---

## レイヤー構成（現状）

```
┌─────────────────────────────────┐
│  Presentation（テンプレート）    │
│  templates/index.html            │
│  static/css/style.css            │
│  static/js/main.js               │
├─────────────────────────────────┤
│  Infrastructure（Flask）         │
│  app.py  ← App Factory + Blueprint│
└─────────────────────────────────┘
```

Domain 層（タイマーロジック）・永続化層（Storage）は未実装です。

---

## 設計方針（今後の実装方針）

設計の詳細は `../architecture.md`（プロジェクトルート）を参照してください。  
主な方針は以下のとおりです。

- **フロントエンド主導**: タイマー進行・画面更新・統計はフロントエンドで完結
- **Flask は配信と拡張ポイント提供**: HTML/静的ファイル配信、将来の API 提供
- **段階的な永続化**: Phase 1 は LocalStorage、Phase 2 でサーバー側保存を検討
