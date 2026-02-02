#!/bin/bash
# Safe env var sync - uses printf to avoid trailing newlines
# Usage: ./scripts/sync-env.sh [env_file] [environment]

set -e

ENV_FILE="${1:-$HOME/.mahjic-env/production.env}"
ENVIRONMENT="${2:-production}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  echo ""
  echo "Create the file first with your env vars in format:"
  echo "  KEY=value"
  echo "  ANOTHER_KEY=another_value"
  echo ""
  echo "Or use .env.local as source:"
  echo "  ./scripts/sync-env.sh .env.local production"
  exit 1
fi

echo "Syncing env vars from $ENV_FILE to $ENVIRONMENT..."
echo ""

SUCCESS=0
SKIPPED=0
FAILED=0

while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" ]] && continue
  [[ "$key" =~ ^[[:space:]]*$ ]] && continue

  # Trim whitespace from key
  key=$(echo "$key" | xargs)

  # Skip Vercel system vars
  [[ "$key" =~ ^VERCEL ]] && { echo "  Skipping $key (Vercel system var)"; SKIPPED=$((SKIPPED + 1)); continue; }
  [[ "$key" =~ ^TURBO ]] && { echo "  Skipping $key (Turbo system var)"; SKIPPED=$((SKIPPED + 1)); continue; }
  [[ "$key" =~ ^NX_ ]] && { echo "  Skipping $key (NX system var)"; SKIPPED=$((SKIPPED + 1)); continue; }

  # Remove surrounding quotes from value if present
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"

  echo "  Uploading $key..."
  if printf '%s' "$value" | vercel env add "$key" "$ENVIRONMENT" --force 2>/dev/null; then
    SUCCESS=$((SUCCESS + 1))
  else
    echo "    Failed to upload $key"
    FAILED=$((FAILED + 1))
  fi
done < "$ENV_FILE"

echo ""
echo "=== Sync Complete ==="
echo "  Uploaded: $SUCCESS"
echo "  Skipped:  $SKIPPED"
echo "  Failed:   $FAILED"
echo ""
echo "Run 'vercel --prod' to deploy with new env vars."
