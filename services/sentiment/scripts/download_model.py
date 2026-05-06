"""Download the fine-tuned DistilBERT sentiment model from Hugging Face Hub.

Run from the repo root:

    python3 services/sentiment/scripts/download_model.py

Reads optional environment variables:
    HF_REPO_ID  Hub repo to pull from. Default: ethsmaa/cinesentiment-distilbert-imdb
    HF_TOKEN    Required only if the repo is private (write or read scope).

Exits 0 on success, non-zero on failure (so CI can rely on the status code).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

DEFAULT_REPO = "ethsmaa/cinesentiment-distilbert-imdb"
SCRIPT_DIR = Path(__file__).resolve().parent
SERVICE_DIR = SCRIPT_DIR.parent
TARGET_DIR = SERVICE_DIR / "model"

# Files we cannot run inference without.
REQUIRED_FILES = {
    "config.json",
    "model.safetensors",
    "tokenizer_config.json",
}


def fail(message: str, code: int) -> int:
    print(f"ERROR: {message}", file=sys.stderr)
    return code


def main() -> int:
    try:
        from huggingface_hub import snapshot_download
        from huggingface_hub.utils import HfHubHTTPError, RepositoryNotFoundError
    except ImportError:
        return fail(
            "huggingface_hub not installed.\n"
            "  Run: pip install -r services/sentiment/scripts/requirements-download.txt",
            1,
        )

    repo_id = os.environ.get("HF_REPO_ID", DEFAULT_REPO)
    token = os.environ.get("HF_TOKEN") or None

    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {repo_id}")
    print(f"        →   {TARGET_DIR}")
    if token:
        print("        (using HF_TOKEN)")

    try:
        snapshot_download(
            repo_id=repo_id,
            local_dir=str(TARGET_DIR),
            token=token,
            # Skip auto-pushed README; Trainer adds one but we don't need it at runtime.
            ignore_patterns=["*.md", ".gitattributes"],
        )
    except RepositoryNotFoundError:
        return fail(
            f"Repo '{repo_id}' not found or you lack access.\n"
            "  If the repo is private, set HF_TOKEN.",
            2,
        )
    except HfHubHTTPError as exc:
        return fail(f"HF Hub HTTP error: {exc}", 3)
    except Exception as exc:
        return fail(f"download failed: {exc}", 4)

    present = {p.name for p in TARGET_DIR.iterdir() if p.is_file()}
    missing = REQUIRED_FILES - present
    if missing:
        return fail(f"required files missing after download: {sorted(missing)}", 5)

    total_bytes = sum(p.stat().st_size for p in TARGET_DIR.rglob("*") if p.is_file())
    print(f"\nDone. {total_bytes / 1e6:.1f} MB across {len(present)} files.")
    print(f"Files: {sorted(present)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
