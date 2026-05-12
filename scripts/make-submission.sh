#!/usr/bin/env bash
# Build a sanitized academic submission archive.
#
# Excludes everything that would not belong in a code-only academic
# deliverable: AI-assistant configuration, git history, build artifacts,
# virtual environments, and the trained model weights (downloaded on demand
# via services/sentiment/scripts/download_model.py).
#
# Usage:
#   ./scripts/make-submission.sh                      # default name
#   ./scripts/make-submission.sh CUSTOM_NAME          # override base name

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BASE_NAME="${1:-2022510140_2022510014}"
STAGING_DIR="$ROOT_DIR/build/$BASE_NAME"
ZIP_PATH="$ROOT_DIR/build/${BASE_NAME}.zip"

echo "▸ Cleaning previous build…"
rm -rf "$ROOT_DIR/build"
mkdir -p "$STAGING_DIR"

echo "▸ Copying repository contents into staging…"
# rsync with explicit excludes is safer than tar --exclude on macOS.
rsync -a \
  --exclude='.git/' \
  --exclude='.github/' \
  --exclude='.claude/' \
  --exclude='CLAUDE.md' \
  --exclude='.vscode/' \
  --exclude='.idea/' \
  --exclude='.DS_Store' \
  --exclude='**/.DS_Store' \
  --exclude='node_modules/' \
  --exclude='**/node_modules/' \
  --exclude='dist/' \
  --exclude='**/dist/' \
  --exclude='build/' \
  --exclude='coverage/' \
  --exclude='**/coverage/' \
  --exclude='.pnpm-store/' \
  --exclude='.venv/' \
  --exclude='**/__pycache__/' \
  --exclude='**/*.pyc' \
  --exclude='services/sentiment/model/' \
  --exclude='*.tsbuildinfo' \
  --exclude='**/*.tsbuildinfo' \
  --exclude='apps/web/test-results/' \
  --exclude='apps/web/playwright-report/' \
  --exclude='*.zip' \
  --exclude='.env' \
  --exclude='**/.env' \
  --exclude='.claude/scheduled_tasks.lock' \
  --exclude='scripts/make-submission.sh' \
  ./ "$STAGING_DIR/"

echo "▸ Stripping AI-tool comments from .gitignore…"
if [[ -f "$STAGING_DIR/.gitignore" ]]; then
  # Remove the two lines that reference Claude Code transient state.
  grep -vi -E "claude|^# AI" "$STAGING_DIR/.gitignore" > "$STAGING_DIR/.gitignore.tmp"
  mv "$STAGING_DIR/.gitignore.tmp" "$STAGING_DIR/.gitignore"
fi

echo "▸ Sanity-checking that no AI-related artifacts leaked through…"
LEAKS=0
for pattern in '.claude' 'CLAUDE.md' '.git'; do
  if find "$STAGING_DIR" -name "$pattern" -print -quit 2>/dev/null | grep -q .; then
    echo "  WARN: '$pattern' present in staging directory"
    LEAKS=1
  fi
done

if [[ $LEAKS -eq 1 ]]; then
  echo "✗ Sanitization failed. See warnings above." >&2
  exit 1
fi

echo "▸ Looking for the final PDF report to bundle…"
PDF_CANDIDATES=(
  "$ROOT_DIR/docs/final_report/${BASE_NAME}_FINAL_REPORT.pdf"
  "$HOME/Downloads/${BASE_NAME}_FINAL_REPORT.pdf"
  "$ROOT_DIR/${BASE_NAME}_FINAL_REPORT.pdf"
)
PDF_FOUND=""
for candidate in "${PDF_CANDIDATES[@]}"; do
  if [[ -f "$candidate" ]]; then
    PDF_FOUND="$candidate"
    break
  fi
done

if [[ -n "$PDF_FOUND" ]]; then
  echo "  found: $PDF_FOUND"
  mkdir -p "$STAGING_DIR/docs/final_report"
  cp "$PDF_FOUND" "$STAGING_DIR/docs/final_report/${BASE_NAME}_FINAL_REPORT.pdf"
else
  echo "  WARN: no final report PDF found. Looked at:"
  printf '         %s\n' "${PDF_CANDIDATES[@]}"
  echo "         The archive will ship without the PDF."
fi

echo "▸ Recording submission metadata…"
cat > "$STAGING_DIR/SUBMISSION.txt" <<EOF
Submission: $BASE_NAME
Built:      $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Authors:    Esma Oruc (2022510140), Ayan Abasova (2022510014)

This archive contains the full source code of the CineSentiment project.
Trained model weights are not included (~270 MB); they are pulled at first
run from huggingface.co/ethsmaa/cinesentiment-distilbert-imdb via
services/sentiment/scripts/download_model.py.

Quick start instructions are in README.md.
The final report (LaTeX source) is in docs/final_report/.
EOF

echo "▸ Creating archive…"
(cd "$ROOT_DIR/build" && zip -rq "${BASE_NAME}.zip" "$BASE_NAME")

SIZE=$(du -sh "$ZIP_PATH" | cut -f1 | xargs)
COUNT=$(unzip -l "$ZIP_PATH" | tail -1 | awk '{print $2}')

echo
echo "✓ Submission ready:"
echo "  Archive: $ZIP_PATH"
echo "  Size:    $SIZE"
echo "  Files:   $COUNT"
echo
echo "Next step: rename the archive if needed and upload it as required by the instructor."
