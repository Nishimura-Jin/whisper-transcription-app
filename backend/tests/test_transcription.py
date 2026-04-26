import io


# ===========================
# GET /api/transcriptions
# ===========================


def test_get_transcriptions_empty(client):
    """履歴が空のとき空リストが返る"""
    response = client.get("/api/transcriptions")
    assert response.status_code == 200
    assert response.json() == []


# ===========================
# POST /api/transcriptions
# ===========================


def test_upload_audio_success(client):
    """音声ファイルをアップロードするとレコードが作成される"""
    dummy_audio = io.BytesIO(b"dummy audio content")
    response = client.post(
        "/api/transcriptions",
        files={"file": ("test.mp3", dummy_audio, "audio/mpeg")},
        data={"filler_removal_enabled": "false"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["status"] in ("pending", "processing")
    assert data["filename"] == "test.mp3"


def test_upload_audio_no_file(client):
    """ファイルなしでアップロードすると422が返る"""
    response = client.post(
        "/api/transcriptions",
        data={"filler_removal_enabled": "false"},
    )
    assert response.status_code == 422


# ===========================
# GET /api/transcriptions/{id}
# ===========================


def test_get_transcription_by_id(client):
    """アップロード後にIDで取得できる"""
    dummy_audio = io.BytesIO(b"dummy audio content")
    upload = client.post(
        "/api/transcriptions",
        files={"file": ("test.mp3", dummy_audio, "audio/mpeg")},
        data={"filler_removal_enabled": "false"},
    )
    record_id = upload.json()["id"]

    response = client.get(f"/api/transcriptions/{record_id}")
    assert response.status_code == 200
    assert response.json()["id"] == record_id


def test_get_transcription_not_found(client):
    """存在しないIDで404が返る"""
    response = client.get("/api/transcriptions/99999")
    assert response.status_code == 404


# ===========================
# PATCH /api/transcriptions/{id}/filler
# ===========================


def test_toggle_filler(client):
    """フィラー除去のON/OFFが切り替わる"""
    from app.models.transcription import Transcription

    # アップロードしてレコード作成
    dummy_audio = io.BytesIO(b"dummy audio content")
    upload = client.post(
        "/api/transcriptions",
        files={"file": ("test.mp3", dummy_audio, "audio/mpeg")},
        data={"filler_removal_enabled": "false"},
    )
    record_id = upload.json()["id"]

    # DBを直接触ってステータスをcompletedにする
    from conftest import TestingSessionLocal

    db = TestingSessionLocal()
    record = db.query(Transcription).filter(Transcription.id == record_id).first()
    record.status = "completed"
    record.transcript = "えーとテストのなんか文字起こしテキストです"
    db.commit()
    db.close()

    # フィラー除去をONにする
    response = client.patch(
        f"/api/transcriptions/{record_id}/filler",
        json={"filler_removal_enabled": True},
    )
    assert response.status_code == 200
    assert response.json()["filler_removal_enabled"] == True


# ===========================
# GET /api/transcriptions（件数確認）
# ===========================


def test_get_transcriptions_after_upload(client):
    """アップロード後に履歴一覧に1件追加されている"""
    dummy_audio = io.BytesIO(b"dummy audio content")
    client.post(
        "/api/transcriptions",
        files={"file": ("test.mp3", dummy_audio, "audio/mpeg")},
        data={"filler_removal_enabled": "false"},
    )

    response = client.get("/api/transcriptions")
    assert response.status_code == 200
    assert len(response.json()) == 1
