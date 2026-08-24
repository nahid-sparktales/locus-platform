"""Local speech component contracts shared by Locus desktop clients."""
from __future__ import annotations

import hashlib
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any


class SpeechRuntimeError(RuntimeError):
    """Raised when the managed on-device transcriber is unavailable or fails."""


@dataclass(frozen=True)
class SpeechModel:
    id: str
    name: str
    url: str
    sha256: str
    size: int
    file: str


def speech_component_manifest() -> dict[str, Any]:
    path = Path(__file__).with_name("runtime_components") / "whisper-cpp.json"
    return json.loads(path.read_text(encoding="utf-8"))


def speech_models() -> tuple[SpeechModel, ...]:
    return tuple(SpeechModel(**item) for item in speech_component_manifest()["models"])


def verify_speech_model(path: Path, model: SpeechModel) -> bool:
    if not path.is_file() or path.stat().st_size != model.size:
        return False
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest() == model.sha256


def transcribe_wav(
    executable: Path,
    model_path: Path,
    wav: bytes,
    *,
    language: str = "auto",
    timeout: float = 45.0,
) -> str:
    """Transcribe a 16 kHz WAV chunk through an anonymous pipe."""
    if not executable.is_file():
        raise SpeechRuntimeError("The on-device speech component is not installed.")
    model = next((item for item in speech_models() if item.file == model_path.name), None)
    if model is None or not verify_speech_model(model_path, model):
        raise SpeechRuntimeError("The on-device speech model failed verification.")
    if not wav or len(wav) > 10 * 1024 * 1024:
        raise SpeechRuntimeError("The speech audio chunk is unavailable.")
    command = [
        str(executable), "--model", str(model_path), "--file", "/dev/fd/0",
        "--no-prints", "--no-timestamps",
    ]
    if language and language != "auto":
        command.extend(["--language", language])
    try:
        result = subprocess.run(
            command,
            check=False,
            capture_output=True,
            input=wav,
            timeout=timeout,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise SpeechRuntimeError("On-device transcription did not finish.") from exc
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).decode("utf-8", errors="replace").strip()[-500:]
        raise SpeechRuntimeError(detail or "On-device transcription failed.")
    return result.stdout.decode("utf-8", errors="replace").strip()
