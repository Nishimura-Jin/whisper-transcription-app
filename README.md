![pytest](https://github.com/Nishimura-Jin/whisper-transcription-app/actions/workflows/test.yml/badge.svg)

# whisper-transcription-app

OpenAI Whisperを使った音声文字起こしWebアプリ。  
FastAPI + React + Docker で構成し、話者分離・フィラー除去・複数形式ダウンロードに対応。

---

## スクリーンショット

![文字起こし結果](docs/screenshots/screenshot.png)
![話者分離結果](docs/screenshots/screenshot2.png)

---

## 開発の背景

フリーランスでYouTube動画を制作する中で、字幕を付けたいと思ったのがきっかけです。有料の動画編集ソフトには字幕機能がありましたが、無料で実現できないか調べたところPythonで実装できることがわかりました。最初はCLIツールとして作りましたが、ブラウザから手軽に使えるWebアプリとして作り直しました。

---

## 機能

- 音声・動画ファイルのアップロード（mp3 / mp4 / wav / m4a / flac / ogg / webm）
- Whisperによる日本語文字起こし（GPU / CPU 自動切り替え）
- 話者分離（pyannote.audio）による複数話者の自動識別・色分け表示
- フィラー除去（「えーと」「あのー」などを自動削除）
- 複数形式ダウンロード（TXT / SRT / VTT / TSV / JSON）
- ダウンロードファイル名を元のファイル名ベースで生成
- GitHub Actions による CI（pytest 5テスト全通過）

---

## デモについて

WhisperはCPU/GPUリソースを大量に使用するため、無料のクラウドサーバーでは  
タイムアウトが発生し安定稼働が困難です。  
そのため動作確認はローカル環境での起動をご参照ください。

---

## フォルダ構成

```
whisper-transcription-app/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── transcription.py
│   │   ├── services/
│   │   │   ├── whisper_service.py
│   │   │   └── download_service.py
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_transcription.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── transcription.js
│   │   ├── components/
│   │   │   ├── TranscriptResult.jsx
│   │   │   └── UploadForm.jsx
│   │   ├── pages/
│   │   │   └── UploadPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── index.html
│   └── vite.config.js
├── docs/
│   └── screenshots/
├── .env.example
├── docker-compose.yml
└── README.md
```

## 技術スタック

| カテゴリ | 使用技術 |
|---|---|
| バックエンド | Python / FastAPI / OpenAI Whisper / pyannote.audio |
| フロントエンド | React / Vite |
| インフラ | Docker / Docker Compose |
| CI | GitHub Actions / pytest |

---

## 技術選定理由

**FastAPI**  
文字起こし処理は時間がかかるため、リクエストを受け付けた後にバックグラウンドで処理を実行し、完了後にフロントから結果を取得する非同期設計が必要でした。FastAPIのBackgroundTasksがこの用途に適していたため採用しました。

**pyannote.audio**  
話者分離の実装にあたり、Whisperのセグメント情報と組み合わせて使える設計になっており、HuggingFaceで公開されているモデルをそのまま利用できる点が決め手です。

**React**  
文字起こし完了までポーリングで状態を監視する必要があり、状態管理がしやすいReactを選びました。

---

## こだわった点

**非同期処理設計**  
文字起こしはリクエストごとにジョブIDを発行し、バックグラウンドで処理します。フロントはジョブIDをもとにポーリングして完了を検知する設計にしました。処理中にタイムアウトが起きない構成です。

**無限ループ防止**  
`condition_on_previous_text=False` を設定し、Whisper特有の誤認識の連鎖（同じ文が繰り返し出力される現象）を防いでいます。

**話者分離の組み合わせ**  
Whisperのセグメント（開始・終了時刻）とpyannoteの話者ラベルを時間の重複で紐づけることで、「誰がいつ何を話したか」を一画面で確認できるようにしました。

**ダウンロードファイル名**  
アップロード時の元ファイル名をもとにダウンロードファイル名を生成しています。日本語ファイル名にも対応するためURLエンコードで処理しています。

---

## 起動手順

### 必要なもの

- Docker / Docker Compose
- （Windowsの場合）Docker Desktop
- HuggingFace アクセストークン（話者分離に必要）

### 環境変数の設定

`.env.example` をコピーして `.env` を作成し、HuggingFaceトークンを設定してください。

```bash
cp .env.example .env
```

`.env` の中身：

```
HUGGINGFACE_TOKEN=your_token_here
```

HuggingFaceトークンは [huggingface.co](https://huggingface.co/settings/tokens) で取得できます。  
また、以下のモデルへのアクセス許可が必要です：
- [pyannote/speaker-diarization-3.1](https://huggingface.co/pyannote/speaker-diarization-3.1)

### 起動

```bash
git clone https://github.com/Nishimura-Jin/whisper-transcription-app.git
cd whisper-transcription-app
docker compose up --build
```

起動後、以下のURLにアクセスしてください：

- フロントエンド: http://localhost:5173
- APIドキュメント: http://localhost:8000/docs

### 基本的な使い方

1. ブラウザで http://localhost:5173 を開く
2. 音声・動画ファイルをアップロード
3. 話者分離を使用する場合はトグルをONにする
4. 文字起こし完了後、タブ切替で話者ごとの結果を確認
5. 任意の形式でダウンロード