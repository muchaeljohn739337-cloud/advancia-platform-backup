#!/usr/bin/env bash
# Helper to set a GitHub Actions secret using the GitHub CLI or REST API as fallback.
# Usage: ./scripts/github-set-secret.sh SECRET_NAME SECRET_VALUE

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 SECRET_NAME SECRET_VALUE"
  exit 2
fi

NAME="$1"
VALUE="$2"

if command -v gh >/dev/null 2>&1; then
  echo "Using gh to set secret: $NAME"
  echo -n "$VALUE" | gh secret set "$NAME" --body -
  echo "Secret $NAME set via gh."
else
  echo "gh CLI not found. Attempting REST API method. Requires GH_ADMIN_PAT env var."
  if [ -z "${GH_ADMIN_PAT:-}" ]; then
    echo "Set GH_ADMIN_PAT environment variable to a PAT with 'repo' scope." >&2
    exit 1
  fi
  REPO="$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##' | sed -E 's/\.git$//')"
  echo "Using REST API to set secret for $REPO"
  # We need to encrypt the secret with the repo's public key. Use API to get public key.
  KEY_JSON=$(curl -s -H "Authorization: token $GH_ADMIN_PAT" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/$REPO/actions/secrets/public-key")
  KEY=$(echo "$KEY_JSON" | jq -r .key)
  KEY_ID=$(echo "$KEY_JSON" | jq -r .key_id)
  if [ -z "$KEY" ] || [ -z "$KEY_ID" ]; then
    echo "Failed to retrieve public key for repo. Response: $KEY_JSON" >&2
    exit 1
  fi
  # Use openssl + base64 to create encrypted value using libsodium equivalent? This is complex; recommend gh CLI.
  echo "Manual secret upload via REST API is complex. Please install 'gh' or set secrets in GitHub UI."
  exit 1
fi
