#!/usr/bin/env bash
# Trigger a Render deploy for a given service.
# Usage: RENDER_API_KEY=... RENDER_SERVICE_ID=... ./scripts/trigger-render-deploy.sh

set -euo pipefail

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "Set RENDER_API_KEY environment variable (store it in GitHub secret RENDER_API_KEY)." >&2
  exit 1
fi
if [ -z "${RENDER_SERVICE_ID:-}" ]; then
  echo "Set RENDER_SERVICE_ID environment variable to your backend service id." >&2
  exit 1
fi

curl -s -X POST \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys | jq .

echo "Triggered deploy for service: $RENDER_SERVICE_ID"
