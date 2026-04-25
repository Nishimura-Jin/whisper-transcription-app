# 🎙️ Whisper 文字起こしアプリ

## 概要
音声ファイルをアップロードすると自動で文字起こしを行うWebアプリです。
フィラー除去・複数フォーマットのダウンロードに対応しています。

## 使用技術
| カテゴリ | 技術 |
|------|------|
| バックエンド | FastAPI / Python |
| フロントエンド | React / Vite |
| 文字起こし | OpenAI Whisper |
| DB | PostgreSQL |
| インフラ | Docker / Docker Compose |

## 機能一覧
- 音声ファイルアップロード（mp3・mp4・wav・m4a・flac・ogg・webm）
- Whisperによる日本語文字起こし（非同期処理）
- フィラー除去ON/OFF（えー・あの・なんか 等）
- 履歴一覧・再閲覧
- TXT・SRT・VTT・TSV・JSON形式でのダウンロード

## 画面キャプチャ
（スクリーンショットをここに貼る）

## セットアップ・起動方法
### 前提条件
- Docker Desktop がインストール済みであること

### 手順
​```bash
git clone https://github.com/Nishimura-Jin/whisper-transcription-app.git
cd whisper-transcription-app
cp .env.example .env  # 環境変数を設定
docker-compose up -d
​```

ブラウザで http://localhost:5173 を開く

## 環境変数
`.env.example` を参考に `.env` を作成してください。

## 工夫した点・技術的ポイント
- Whisper処理をThreadPoolExecutorで非同期化し、APIがブロックされない設計にした
- モデルを起動時に一度だけロードすることで処理の高速化を図った
- フィラー除去は正規表現で実装し、ON/OFFをDBで管理している

## 今後の予定
- 話者分離（pyannote.audio）の実装