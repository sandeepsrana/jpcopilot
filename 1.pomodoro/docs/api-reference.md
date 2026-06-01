# API リファレンス

## 概要

現在（Phase 0）の実装では、Flask が HTML ページを配信するエンドポイントのみ提供しています。  
REST API エンドポイントは未実装です。

---

## ページ配信エンドポイント

### `GET /`

タイマー画面（`index.html`）を返します。

**レスポンス**

| 項目            | 値                    |
| --------------- | --------------------- |
| HTTP ステータス | `200 OK`              |
| Content-Type    | `text/html`           |
| ボディ          | `templates/index.html` のレンダリング結果 |

**例**

```
GET / HTTP/1.1
Host: localhost:5000
```

```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8

<!DOCTYPE html>
...
```

---

## 静的ファイル配信

Flask の組み込み静的配信機能により、以下のパスでファイルを取得できます。

| パス                            | ファイル                        |
| ------------------------------- | ------------------------------- |
| `/static/css/style.css`         | `static/css/style.css`          |
| `/static/js/main.js`            | `static/js/main.js`             |

---

## 将来予定の API（未実装）

以下のエンドポイントは設計書（`architecture.md`）に記載されていますが、現時点では実装されていません。

| メソッド | パス                   | 用途                       |
| -------- | ---------------------- | -------------------------- |
| `GET`    | `/api/config`          | タイマー設定の取得         |
| `GET`    | `/api/stats/today`     | 当日統計の取得             |
| `POST`   | `/api/session/start`   | セッション開始の記録       |
| `POST`   | `/api/session/complete`| セッション完了の記録       |
| `POST`   | `/api/stats/reset`     | 当日統計のリセット         |
