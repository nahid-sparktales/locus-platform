from pathlib import Path
from types import SimpleNamespace

import pytest

from ollama_code import speech
from ollama_code.speech import (
    SpeechRuntimeError,
    speech_models,
    transcribe_wav,
    verify_speech_model,
)


def test_speech_model_manifest_is_pinned():
    model = speech_models()[0]
    assert model.id == "base-q5_1"
    assert len(model.sha256) == 64
    assert model.url.startswith("https://")
    assert model.size > 50_000_000


def test_model_verification_rejects_untrusted_bytes(tmp_path):
    path = tmp_path / speech_models()[0].file
    path.write_bytes(b"not a model")
    assert verify_speech_model(path, speech_models()[0]) is False


def test_transcriber_requires_managed_binary(tmp_path):
    with pytest.raises(SpeechRuntimeError, match="not installed"):
        transcribe_wav(Path("/missing/whisper-cli"), tmp_path / "model.bin", b"RIFF")


def test_transcriber_streams_audio_through_anonymous_stdin(tmp_path, monkeypatch):
    executable = tmp_path / "whisper-cli"
    executable.write_bytes(b"fixture")
    model = tmp_path / speech_models()[0].file
    captured = {}

    monkeypatch.setattr(speech, "verify_speech_model", lambda *_args: True)

    def run(command, **options):
        captured.update(command=command, options=options)
        return SimpleNamespace(returncode=0, stdout=b"hello locally\n", stderr=b"")

    monkeypatch.setattr(speech.subprocess, "run", run)
    assert transcribe_wav(executable, model, b"RIFF-private-audio") == "hello locally"
    assert captured["options"]["input"] == b"RIFF-private-audio"
    assert "/dev/fd/0" in captured["command"]
