![pytest](https://github.com/Nishimura-Jin/whisper-transcription-app/actions/workflows/test.yml/badge.svg)
# whisper-transcription-app

WhisperAIを使った音声文字起こしWebアプリ。
FastAPI + React + PostgreSQL + Dockerで構成。

## デモについて

WhisperはCPU/GPUリソースを大量に使用するため、無料のクラウドサーバーでは
タイムアウトが発生し安定稼働が困難です。
そのためデモ動画にて動作をご確認いただけます。
実際に動作させる場合は以下の起動手順をご参照ください。

## 起動手順

### 必要なもの
- Docker / Docker Compose
- （Windowsの場合）Docker Desktop

### 起動
\```bash
git clone https://github.com/Nishimura-Jin/whisper-transcription-app.git
cd whisper-transcription-app
docker compose up --build
\```

起動後、以下のURLにアクセスしてください：
- フロントエンド: http://localhost:5173
- APIドキュメント: http://localhost:8000/docs