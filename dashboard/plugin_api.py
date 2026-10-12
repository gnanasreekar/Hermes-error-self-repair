"""Read-only local Hermes error and cron-recovery telemetry."""
from __future__ import annotations

import json
import os
from collections import deque
from pathlib import Path
from typing import Any

from fastapi import APIRouter

router = APIRouter()
_LIMIT = 150
_MAX_LINE_CHARS = 8000


def _hermes_home() -> Path:
    """Resolve the active Hermes home, including profile-specific installs."""
    configured = os.environ.get("HERMES_HOME", "").strip()
    if configured:
        return Path(configured).expanduser()

    try:
        from hermes_constants import get_hermes_home

        return Path(get_hermes_home()).expanduser()
    except Exception:
        return (Path.home() / ".hermes").expanduser()


def _recent_lines(path: Path, limit: int = _LIMIT) -> list[str]:
    """Return the most recent nonblank lines without loading the whole log."""
    try:
        with path.open("r", encoding="utf-8", errors="replace") as stream:
            lines = deque(
                (line.rstrip("\r\n")[:_MAX_LINE_CHARS] for line in stream if line.strip()),
                maxlen=limit,
            )
    except OSError:
        return []
    return list(lines)


def _recent_errors() -> list[dict[str, str]]:
    path = _hermes_home() / "logs" / "errors.log"
    return [{"line": line} for line in reversed(_recent_lines(path))]


def _recent_recoveries() -> list[dict[str, str]]:
    path = _hermes_home() / "cron" / "persisted_error_recoveries.jsonl"
    recoveries: list[dict[str, str]] = []

    for line in _recent_lines(path):
        try:
            record: Any = json.loads(line)
        except (json.JSONDecodeError, TypeError):
            continue
        if not isinstance(record, dict):
            continue

        raw_name = record.get("name") or record.get("job_id")
        job_name = raw_name[:200] if isinstance(raw_name, str) else "Scheduled job"
        raw_timestamp = record.get("rearmed_at")
        timestamp = raw_timestamp[:100] if isinstance(raw_timestamp, str) else ""
        raw_previous = record.get("previous_next_run_at")
        previous = raw_previous[:100] if isinstance(raw_previous, str) else ""

        details = "Re-armed automatically after Hermes detected a stale error state."
        if previous:
            details += f" Previous next-run time: {previous}."

        recoveries.append({
            "timestamp": timestamp,
            "event": f"Scheduled job re-armed: {job_name}",
            "details": details,
        })

    return list(reversed(recoveries))


@router.get("/errors")
def get_errors() -> dict[str, list[dict[str, str]]]:
    """Return recent local errors and persisted cron recovery events."""
    return {"errors": _recent_errors(), "recoveries": _recent_recoveries()}
