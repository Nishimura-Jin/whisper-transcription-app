import io


def test_upload_audio_success(client):
    """音声ファイルをアップロードするとjob_idが返る"""
    dummy_audio = io.BytesIO(b"dummy audio content")
    response = client.post(
        "/api/transcriptions",
        files={"file": ("test.mp3", dummy_audio, "audio/mpeg")},
        data={"filler_removal_enabled": "false"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "pending"
    assert data["filename"] == "test.mp3"


def test_upload_audio_no_file(client):
    """ファイルなしでアップロードすると422が返る"""
    response = client.post(
        "/api/transcriptions",
        data={"filler_removal_enabled": "false"},
    )
    assert response.status_code == 422


def test_upload_invalid_extension(client):
    """非対応の拡張子は400が返る"""
    dummy = io.BytesIO(b"dummy")
    response = client.post(
        "/api/transcriptions",
        files={"file": ("test.txt", dummy, "text/plain")},
        data={"filler_removal_enabled": "false"},
    )
    assert response.status_code == 400


def test_get_transcription_not_found(client):
    """存在しないjob_idで404が返る"""
    response = client.get("/api/transcriptions/invalid-job-id")
    assert response.status_code == 404


def test_get_transcription_after_upload(client):
    """アップロード後にjob_idでステータスが取得できる"""
    dummy_audio = io.BytesIO(b"dummy audio content")
    upload = client.post(
        "/api/transcriptions",
        files={"file": ("test.mp3", dummy_audio, "audio/mpeg")},
        data={"filler_removal_enabled": "false"},
    )
    job_id = upload.json()["job_id"]
    response = client.get(f"/api/transcriptions/{job_id}")
    assert response.status_code == 200
    assert response.json()["job_id"] == job_id
