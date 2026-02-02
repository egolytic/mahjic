#!/bin/bash
# Validate env vars have no trailing newlines or whitespace
# Usage: ./scripts/validate-env.sh [environment]

set -e

ENVIRONMENT="${1:-production}"
TEMP_FILE=".env.validate.$$"

echo "Pulling $ENVIRONMENT env vars..."
vercel env pull "$TEMP_FILE" --environment "$ENVIRONMENT" --yes 2>/dev/null

if [ ! -f "$TEMP_FILE" ]; then
  echo "Error: Failed to pull env vars"
  exit 1
fi

echo ""
echo "=== Validation Results ==="
ISSUES=0
CHECKED=0

while IFS='=' read -r key value || [ -n "$key" ]; do
  # Skip comments and empty lines
  [[ "$key" =~ ^[[:space:]]*# ]] && continue
  [[ -z "$key" ]] && continue
  [[ "$key" =~ ^[[:space:]]*$ ]] && continue

  # Skip Vercel system vars
  [[ "$key" =~ ^VERCEL ]] && continue
  [[ "$key" =~ ^TURBO ]] && continue
  [[ "$key" =~ ^NX_ ]] && continue

  CHECKED=$((CHECKED + 1))

  # Remove surrounding quotes from value
  clean_value="${value#\"}"
  clean_value="${clean_value%\"}"

  # Check for trailing whitespace (including newlines)
  if [[ "$clean_value" =~ [[:space:]]$ ]]; then
    echo "X $key - has trailing whitespace"
    ISSUES=$((ISSUES + 1))
  # Check for embedded newlines (literal \n or actual newline)
  elif [[ "$clean_value" == *$'\n'* ]] || [[ "$clean_value" == *'\n'* ]]; then
    echo "X $key - contains newline character"
    ISSUES=$((ISSUES + 1))
  # Validate known formats
  elif [[ "$key" == "RESEND_API_KEY" ]] && [[ ! "$clean_value" =~ ^re_ ]]; then
    echo "!  $key - expected to start with 're_'"
    ISSUES=$((ISSUES + 1))
  elif [[ "$key" == "STRIPE_WEBHOOK_SECRET" ]] && [[ ! "$clean_value" =~ ^whsec_ ]]; then
    echo "!  $key - expected to start with 'whsec_'"
    ISSUES=$((ISSUES + 1))
  elif [[ "$key" == "STRIPE_SECRET_KEY" ]] && [[ ! "$clean_value" =~ ^sk_(test|live)_ ]]; then
    echo "!  $key - expected to start with 'sk_test_' or 'sk_live_'"
    ISSUES=$((ISSUES + 1))
  elif [[ "$key" == "STRIPE_SECRET_KEY" ]] && [[ "$ENVIRONMENT" == "production" ]] && [[ "$clean_value" =~ ^sk_test_ ]]; then
    echo "X $key - production should use LIVE keys (sk_live_), not test keys"
    ISSUES=$((ISSUES + 1))
  elif [[ "$key" == "NEXT_PUBLIC_SUPABASE_URL" ]] && [[ ! "$clean_value" =~ ^https:// ]]; then
    echo "!  $key - expected to start with 'https://'"
    ISSUES=$((ISSUES + 1))
  elif [[ "$key" == "NEXT_PUBLIC_APP_URL" ]] && [[ "$ENVIRONMENT" == "production" ]] && [[ "$clean_value" == *"localhost"* ]]; then
    echo "X $key - production should NOT use localhost (got: $clean_value)"
    ISSUES=$((ISSUES + 1))
  elif [[ "$key" == "NEXT_PUBLIC_APP_URL" ]] && [[ "$ENVIRONMENT" == "production" ]] && [[ ! "$clean_value" =~ ^https:// ]]; then
    echo "!  $key - production should use https:// (got: $clean_value)"
    ISSUES=$((ISSUES + 1))
  fi
done < "$TEMP_FILE"

# Check for required env vars
echo ""
echo "=== Required Vars Check ==="
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "NEXT_PUBLIC_APP_URL"
  "RESEND_API_KEY"
  "RESEND_FROM_EMAIL"
)

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^$var=" "$TEMP_FILE" 2>/dev/null; then
    echo "X $var - MISSING"
    MISSING=$((MISSING + 1))
  else
    echo "OK $var - present"
  fi
done

rm -f "$TEMP_FILE"

echo ""
echo "=== Summary ==="
if [ $ISSUES -eq 0 ] && [ $MISSING -eq 0 ]; then
  echo "OK All $CHECKED env vars are clean"
  echo "OK All required vars are present"
else
  if [ $ISSUES -gt 0 ]; then
    echo "!  Found $ISSUES format issues out of $CHECKED vars checked"
  fi
  if [ $MISSING -gt 0 ]; then
    echo "X Missing $MISSING required vars"
  fi
  echo ""
  echo "To fix, update your env file and run:"
  echo "  ./scripts/sync-env.sh .env.local production"
  exit 1
fi
