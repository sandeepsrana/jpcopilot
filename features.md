# ポモドーロタイマー 実装機能一覧

このドキュメントは、ポモドーロタイマーアプリケーションの実装対象機能を整理したものです。

## 1. MVP（今すぐ実装が必要な機能）

1. Flaskアプリの最小構成
2. 画面配信ルート（GET /）
3. タイマー画面のUI構築
4. タイマー状態モデルの実装
5. TimerEngine（開始・停止・リセット）
6. 高精度カウントダウン（終了予定時刻ベース）
7. フェーズ遷移（作業/短休憩/長休憩）
8. ProgressRing（円形進捗表示）
9. UIController（表示更新・ボタン状態制御）
10. 当日統計の計算と表示
11. LocalStorage保存（設定/統計）
12. 日付切り替わり時の統計リセット
13. レスポンシブ対応
14. 基本アクセシビリティ対応

## 2. MVP機能の具体項目

### 2.1 Flask最小構成

- アプリ起動エントリを用意する
- テンプレート/静的ファイル配信を設定する

### 2.2 画面配信

- GET / でタイマー画面を表示する

### 2.3 UI構築（モック再現）

- タイトル、フェーズラベル、残り時間表示
- 円形進捗リング
- 開始/停止ボタン、リセットボタン
- 今日の進捗カード（完了数、集中時間）

### 2.4 状態モデル

- phase（focus/shortBreak/longBreak）
- isRunning
- remainingSec
- durations（focusSec/shortBreakSec/longBreakSec）
- cycleCount
- statsToday（dateKey/completedCount/focusTotalSec）

### 2.5 TimerEngine

- start/stop/reset
- フェーズ完了時の次フェーズ判定
- cycleCount更新（長休憩判定に利用）

### 2.6 高精度カウントダウン

- 1秒減算方式ではなく、終了予定時刻との差分でremainingSecを算出
- 非アクティブタブ復帰時の時間ずれを抑制

### 2.7 フェーズ遷移

- focus完了後にshortBreakまたはlongBreakへ遷移
- break完了後にfocusへ復帰
- 長休憩周期（例: 4セットごと）を適用

### 2.8 ProgressRing

- SVG円のstroke-dasharray/stroke-dashoffsetを更新
- 現フェーズ進捗率を視覚反映

### 2.9 UIController

- 時間表示（mm:ss）更新
- フェーズ表示（作業中/休憩中）更新
- ボタン表示切替（開始中は停止、停止中は開始）
- 統計カード更新

### 2.10 当日統計

- 完了ポモドーロ数をカウント
- 集中時間合計を時:分で表示
- 作業フェーズ完了時のみ集中時間を加算

### 2.11 LocalStorage

- 設定値（作業/休憩時間、長休憩周期）保存
- 当日統計保存
- 起動時の復元

### 2.12 日次リセット

- dateKey比較で日付変更を検知
- 翌日なら統計を初期化

### 2.13 レスポンシブ

- モバイル/デスクトップで円サイズ、フォント、余白を調整
- カード幅とボタン配置の崩れを防止

### 2.14 アクセシビリティ

- ボタンラベルを明確化
- 色以外でも状態が分かるテキストを表示
- 最低限のキーボード操作性を確保

## 3. 将来拡張（Phase 2以降）

### 3.1 API層の追加

- GET /api/config
- GET /api/stats/today
- POST /api/session/start
- POST /api/session/complete
- POST /api/stats/reset

### 3.2 サーバー永続化

- LocalStorage中心の保存からDB保存へ移行可能にする
- Storage差し替え可能な設計を維持する

### 3.3 ユーザー機能

- ログイン
- 複数端末同期
- 履歴分析

## 4. 実装優先順位（推奨）

1. 画面配信 + UI骨組み
2. TimerEngine + UIController（開始/停止/リセット）
3. ProgressRing
4. フェーズ遷移
5. 当日統計
6. LocalStorage
7. レスポンシブ/アクセシビリティ調整
