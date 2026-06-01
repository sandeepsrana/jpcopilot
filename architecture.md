# ポモドーロタイマー Webアプリケーション アーキテクチャ案

## 1. 目的

本ドキュメントは、Flask + HTML/CSS/JavaScript で実装するポモドーロタイマーのアーキテクチャ方針を定義する。

- 初期実装を短期間で成立させる
- UIモックの見た目と操作感を再現する
- 将来的な機能追加（サーバー保存、ユーザー機能など）に対応しやすい構成にする

## 2. 設計方針

基本方針は「フロントエンド主導 + Flaskは配信と拡張ポイント提供」。

- タイマー進行、画面更新、当日統計はフロントエンドで完結
- FlaskはHTML/静的ファイル配信を担当
- 永続化は段階導入
  - Phase 1: LocalStorage
  - Phase 2: Flask API + サーバー側保存（必要時）

## 3. 全体アーキテクチャ

### 3.1 レイヤー構成

1. Presentation層
- HTML: 画面構造（タイトル、進捗リング、ボタン、統計カード）
- CSS: デザイントークン（色、余白、角丸、タイポグラフィ）
- JavaScript: DOM描画とイベント接続

2. Domain層
- タイマー状態管理
- フェーズ遷移ロジック（作業 / 短休憩 / 長休憩）
- 進捗率計算

3. Infrastructure層
- Flask: ルーティング、テンプレート/静的配信、将来API
- Storage: LocalStorage実装（将来API実装へ差し替え可能）

### 3.2 実行責務

- クライアント: 状態遷移、UI反映、日次集計、ブラウザ保存
- サーバー: ページ提供、静的配信、将来のデータ永続化エンドポイント

## 4. フロントエンド内部設計

### 4.1 モジュール分割

1. TimerEngine
- 開始/停止/リセット
- 残り時間算出
- フェーズ完了時の次フェーズ遷移

2. StateStore
- 設定値保存（作業時間、休憩時間、長休憩周期）
- 当日統計保存（完了数、集中時間）
- 日付変更時の統計リセット

3. UIController
- 時間表示（mm:ss）
- フェーズ表示（作業中/休憩中）
- ボタン状態制御（開始中は停止に切替）
- 統計カード更新

4. ProgressRing
- SVGベースの円形進捗表示
- 進捗率に応じた stroke-dashoffset 更新

### 4.2 タイマー精度方針

`setInterval` で単純に 1 秒減算するのではなく、終了予定時刻との差分で残り時間を算出する。
これにより、非アクティブタブ復帰時の時間ずれを抑制する。

## 5. 状態モデル

最低限のアプリ状態は以下を持つ。

- phase: `focus | shortBreak | longBreak`
- isRunning: `boolean`
- remainingSec: `number`
- durations:
  - focusSec
  - shortBreakSec
  - longBreakSec
- cycleCount: `number`
- statsToday:
  - dateKey (YYYY-MM-DD)
  - completedCount
  - focusTotalSec

## 6. Flaskアプリケーション設計

### 6.1 構成方針

- App Factory パターンを採用
- Blueprint で責務分割
  - page: 画面表示
  - api: 将来拡張用

### 6.2 初期エンドポイント

- `GET /` : タイマー画面表示

### 6.3 将来API（必要時）

- `GET /api/config`
- `GET /api/stats/today`
- `POST /api/session/start`
- `POST /api/session/complete`
- `POST /api/stats/reset`

※ 初期段階では未実装でもよい。URL設計のみ先に定義しておく。

## 7. 画面仕様（UIモック対応）

- メインカード中央に円形タイマーと残り時間
- フェーズラベル（例: 作業中）
- アクションボタン（開始/停止、リセット）
- 「今日の進捗」カード
  - 完了ポモドーロ数
  - 集中時間（時:分）

レスポンシブ要件:

- デスクトップ/モバイル双方で可読性を維持
- カード幅、フォント、円サイズを画面幅で調整

## 8. データ永続化戦略

### Phase 1: ブラウザ保存

- LocalStorageに以下を保存
  - 設定値
  - 当日統計
- メリット: 実装が速く、初期構築に向く

### Phase 2: サーバー保存

- Flask API経由で統計を保存
- 将来的なユーザー機能、複数端末同期に対応

## 9. 非機能要件

- 保守性: モジュール分割と責務明確化
- 拡張性: Storage抽象化、APIの段階導入
- 可用性: タブ切替時の時間計測ズレ抑制
- アクセシビリティ: ボタンラベル明確化、色以外の状態表示

## 10. 実装ロードマップ

1. Flask最小構成で画面配信
2. HTML/CSSでUIモック再現
3. TimerEngine + UIController実装（開始/停止/リセット）
4. SVG進捗リング実装
5. LocalStorage保存（設定/当日統計）
6. フェーズ遷移（短休憩・長休憩）実装
7. 必要に応じてAPI実装へ移行

## 11. ディレクトリ構成案

```text
1.pomodoro/
  app.py
  templates/
    index.html
  static/
    css/
      style.css
    js/
      timer-engine.js
      state-store.js
      ui-controller.js
      progress-ring.js
      main.js
```

初期はこの最小構成で開始し、機能追加に応じて `api/` や `services/` を増設する。
