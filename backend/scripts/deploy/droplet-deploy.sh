#!/usr/bin/env bash
set -euo pipefail

# droplet-deploy.sh
# One-shot helper to clone the repo, install Node, install deps,
# run prisma migrations and start the backend with pm2.
#
# Usage (on the droplet):
#   sudo bash droplet-deploy.sh
#
# Preconditions:
# - An SSH deploy key for GitHub has been added to this machine and to the
#   target GitHub repo (or your GitHub account).
# - Run as root or a user with sudo privileges.

REPO_SSH_URL="git@github.com:pdtribe181-prog/-modular-saas-platform.git"
TARGET_PARENT_DIR="/var/www"
REPO_DIR_NAME="-modular-saas-platform"
BACKEND_DIR="$TARGET_PARENT_DIR/$REPO_DIR_NAME/backend"
NODE_VERSION="20"

echo "==> Deploy helper started"
echo "Repo: $REPO_SSH_URL"
echo "Target dir: $BACKEND_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "Installing git..."
  apt-get update -y
  apt-get install -y git ca-certificates curl build-essential
fi

mkdir -p "$TARGET_PARENT_DIR"
chown "$SUDO_USER:${SUDO_USER:-$(whoami)}" "$TARGET_PARENT_DIR" || true
cd "$TARGET_PARENT_DIR"

if [ -d "$TARGET_PARENT_DIR/$REPO_DIR_NAME" ]; then
  echo "Repository already exists in $TARGET_PARENT_DIR/$REPO_DIR_NAME — skipping clone"
  # Skip git pull when running as sudo to avoid SSH key issues
  # User should manually pull if needed before running this script
else
  echo "Cloning repository..."
  git clone "$REPO_SSH_URL"
fi

cd "$BACKEND_DIR"

echo "==> Installing nvm and Node.js $NODE_VERSION (if needed)"
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
fi
# shellcheck source=/dev/null
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi
nvm install "$NODE_VERSION" || true
nvm use "$NODE_VERSION" || true

echo "==> Installing repository dependencies"
npm install --no-audit --no-fund

echo "==> Generating Prisma client"
npx prisma generate

echo "==> IMPORTANT: Ensure you have a valid .env in $BACKEND_DIR with DATABASE_URL and other secrets."
if [ ! -f .env ]; then
  if [ -f .env.test ]; then
    echo "No .env found — copying .env.test -> .env (edit values as needed)"
    cp .env.test .env
  else
    echo "No .env or .env.test present — create .env before running migrations"
  fi
fi

echo "==> Running Prisma migrations (deploy)"
if [ -n "${DATABASE_URL:-}" ] || grep -q 'DATABASE_URL' .env 2>/dev/null; then
  npx prisma migrate deploy || echo "Prisma migrate deploy returned non-zero exit code"
else
  echo "DATABASE_URL not set in environment nor .env — skipping migrations"
fi

echo "==> Starting backend with pm2"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# Start or reload the app using pm2
if pm2 list | grep -q advancia-backend; then
  echo "Reloading advancia-backend with pm2"
  pm2 restart advancia-backend || pm2 reload advancia-backend || true
else
  echo "Starting advancia-backend with pm2"
  pm2 start npm --name advancia-backend -- start
fi

pm2 save

echo "==> Deploy helper finished — check pm2 status and logs"
echo "  pm2 status advancia-backend"
echo "  pm2 logs advancia-backend --lines 200"

# Optional: when run as root, optionally install systemd unit and nginx site
# Controls via environment variables (set when invoking the script):
#   ENABLE_SYSTEMD=true  -> install and start systemd unit from templates
#   ENABLE_NGINX=true    -> install nginx site from templates
#   ENABLE_CERTBOT=true  -> run certbot for SERVER_NAME (requires domain)
#   SERVER_NAME=example.com
#   SERVICE_USER=www-data

if [ "$(id -u)" -eq 0 ]; then
  echo "==> Running post-deploy system tasks as root"

  # Install systemd unit if requested
  if [ "${ENABLE_SYSTEMD:-false}" = "true" ]; then
    UNIT_TEMPLATE="$BACKEND_DIR/deploy/templates/advancia-backend.service.template"
    if [ -f "$UNIT_TEMPLATE" ]; then
      SERVICE_USER="${SERVICE_USER:-www-data}"
      ENV_FILE="${ENV_FILE:-$BACKEND_DIR/.env}"
      WORKING_DIR="${WORKING_DIR:-$BACKEND_DIR}"
      echo "Installing systemd unit from template (user=$SERVICE_USER, env_file=$ENV_FILE)"
      # Backup existing unit if present
      if [ -f /etc/systemd/system/advancia-backend.service ]; then
        ts=$(date +%Y%m%d%H%M%S)
        echo "Backing up existing systemd unit to /etc/systemd/system/advancia-backend.service.bak.$ts"
        cp /etc/systemd/system/advancia-backend.service /etc/systemd/system/advancia-backend.service.bak.$ts
      fi
      sed -e "s/{{USER}}/${SERVICE_USER}/g" \
          -e "s|{{WORKING_DIR}}|${WORKING_DIR}|g" \
          -e "s|{{ENV_FILE}}|${ENV_FILE}|g" \
          "$UNIT_TEMPLATE" > /etc/systemd/system/advancia-backend.service
      systemctl daemon-reload
      systemctl enable advancia-backend
      systemctl restart advancia-backend || true
      echo "Systemd unit installed and started (advancia-backend)"
    else
      echo "Systemd template not found at $UNIT_TEMPLATE — skipping"
    fi
  fi

  # Install nginx site if requested
  if [ "${ENABLE_NGINX:-false}" = "true" ]; then
    NGINX_TEMPLATE="$BACKEND_DIR/deploy/templates/advancia-nginx.conf.template"
    if [ -f "$NGINX_TEMPLATE" ]; then
      SERVER_NAME="${SERVER_NAME:-_}"
      echo "Installing nginx site for server_name=$SERVER_NAME"
      # Backup existing nginx config if present
      if [ -f /etc/nginx/sites-available/advancia ]; then
        ts=$(date +%Y%m%d%H%M%S)
        echo "Backing up existing nginx site to /etc/nginx/sites-available/advancia.bak.$ts"
        cp /etc/nginx/sites-available/advancia /etc/nginx/sites-available/advancia.bak.$ts
      fi
      sed -e "s/{{SERVER_NAME}}/${SERVER_NAME}/g" "$NGINX_TEMPLATE" > /etc/nginx/sites-available/advancia
      ln -sf /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/advancia
      nginx -t && systemctl restart nginx || echo "nginx test/restart failed"

      if [ "${ENABLE_CERTBOT:-false}" = "true" ] && [ "$SERVER_NAME" != "_" ]; then
        echo "Attempting to obtain TLS certificate for $SERVER_NAME via certbot"
        apt-get update -y
        apt-get install -y certbot python3-certbot-nginx || true
        certbot --nginx -d "$SERVER_NAME" --non-interactive --agree-tos -m "admin@$SERVER_NAME" || echo "certbot failed or requires manual intervention"
      fi
    else
      echo "NGINX template not found at $NGINX_TEMPLATE — skipping"
    fi
  fi
fi

exit 0
