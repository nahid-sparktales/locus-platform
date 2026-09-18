"""The streaming <think> filter."""
from __future__ import annotations

import re

_THINK_RE = re.compile(r"<think(?:ing)?>.*?</think(?:ing)?>", re.DOTALL)
_THINK_UNCLOSED_RE = re.compile(r"<think(?:ing)?>.*", re.DOTALL)


def strip_think(text: str) -> str:
    """Remove think blocks from stored message content."""
    return _THINK_UNCLOSED_RE.sub("", _THINK_RE.sub("", text)).strip()


class ThinkFilter:
    """Split inline reasoning from visible output across arbitrary chunks."""

    OPEN_TAGS = {"<think>": "</think>", "<thinking>": "</thinking>"}

    def __init__(self) -> None:
        self._buf = ""
        self._in_think = False
        self._close_tag = "</think>"
        self._pending_thinking: list[str] = []
        self._all_thinking: list[str] = []
        #: Everything handed to the UI so far, so a stream that dies mid-way
        #: can still be persisted instead of vanishing from the transcript.
        self._emitted: list[str] = []

    def feed(self, token: str) -> str:
        self._buf += token
        out: list[str] = []
        while self._buf:
            if self._in_think:
                end = self._buf.find(self._close_tag)
                if end == -1:
                    # Surface all reasoning except a tail that may be the
                    # beginning of the closing tag.
                    keep = self._partial_suffix_len(self._close_tag)
                    emit_end = len(self._buf) - keep
                    self._record_thinking(self._buf[:emit_end])
                    self._buf = self._buf[emit_end:]
                    break
                self._record_thinking(self._buf[:end])
                self._buf = self._buf[end + len(self._close_tag):]
                self._in_think = False
            else:
                found = [
                    (self._buf.find(open_tag), open_tag, close_tag)
                    for open_tag, close_tag in self.OPEN_TAGS.items()
                    if self._buf.find(open_tag) >= 0
                ]
                if not found:
                    keep = max(self._partial_suffix_len(tag) for tag in self.OPEN_TAGS)
                    emit_end = len(self._buf) - keep
                    out.append(self._buf[:emit_end])
                    self._buf = self._buf[emit_end:]
                    break
                start, open_tag, close_tag = min(found, key=lambda item: item[0])
                out.append(self._buf[:start])
                self._buf = self._buf[start + len(open_tag):]
                self._in_think = True
                self._close_tag = close_tag
        text = "".join(out)
        if text:
            self._emitted.append(text)
        return text

    def flush(self) -> str:
        if self._in_think:
            self._record_thinking(self._buf)
            tail = ""
        else:
            tail = self._buf
        self._buf = ""
        if tail:
            self._emitted.append(tail)
        return tail

    def flush_all(self) -> str:
        """Everything emitted so far, including any un-flushed tail."""
        self.flush()
        return "".join(self._emitted)

    def take_thinking(self) -> str:
        """Return reasoning discovered since the previous call."""
        text = "".join(self._pending_thinking)
        self._pending_thinking = []
        return text

    @property
    def thinking(self) -> str:
        return "".join(self._all_thinking)

    def _record_thinking(self, text: str) -> None:
        if text:
            self._pending_thinking.append(text)
            self._all_thinking.append(text)

    def _partial_suffix_len(self, tag: str) -> int:
        for n in range(min(len(tag) - 1, len(self._buf)), 0, -1):
            if self._buf.endswith(tag[:n]):
                return n
        return 0
