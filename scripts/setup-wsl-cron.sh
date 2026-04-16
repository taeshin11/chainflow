#!/bin/bash
# setup-wsl-cron.sh
# Run this script ONCE in WSL to install the nightly cron job.
# It adds a crontab entry that runs the FlowVium data scraper at 3:00 AM every day.
#
# Usage (from WSL terminal):
#   chmod +x /mnt/c/NoAddsMakingApps/FlowVium/scripts/setup-wsl-cron.sh
#   /mnt/c/NoAddsMakingApps/FlowVium/scripts/setup-wsl-cron.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Config — adjust if your paths differ
# ---------------------------------------------------------------------------
PROJECT_DIR="/mnt/c/NoAddsMakingApps/FlowVium"
LOG_FILE="/mnt/c/NoAddsMakingApps/FlowVium/scrape.log"
CRON_HOUR=3
CRON_MIN=0

# ---------------------------------------------------------------------------
# Detect tsx
# ---------------------------------------------------------------------------
TSX_PATH=""
if command -v tsx &>/dev/null; then
  TSX_PATH="$(command -v tsx)"
elif [ -f "$PROJECT_DIR/node_modules/.bin/tsx" ]; then
  TSX_PATH="$PROJECT_DIR/node_modules/.bin/tsx"
else
  echo "[setup-wsl-cron] ERROR: tsx not found."
  echo "  Install it globally:  npm install -g tsx"
  echo "  Or ensure node_modules is installed:  cd $PROJECT_DIR && npm install"
  exit 1
fi

echo "[setup-wsl-cron] Using tsx at: $TSX_PATH"

# ---------------------------------------------------------------------------
# Detect node (needed for PATH in cron context)
# ---------------------------------------------------------------------------
NODE_PATH=""
if command -v node &>/dev/null; then
  NODE_PATH="$(dirname "$(command -v node)")"
fi

# ---------------------------------------------------------------------------
# Build the cron line
# ---------------------------------------------------------------------------
# cron doesn't inherit the interactive shell's PATH, so we set it explicitly.
CRON_PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
if [ -n "$NODE_PATH" ] && [[ ":$CRON_PATH:" != *":$NODE_PATH:"* ]]; then
  CRON_PATH="$NODE_PATH:$CRON_PATH"
fi

CRON_JOB="${CRON_MIN} ${CRON_HOUR} * * * cd ${PROJECT_DIR} && PATH=${CRON_PATH} ${TSX_PATH} scripts/scrape-daily.ts >> ${LOG_FILE} 2>&1"

# ---------------------------------------------------------------------------
# Install — avoid duplicates
# ---------------------------------------------------------------------------
MARKER="scrape-daily.ts"

# Read existing crontab (may be empty for a new user)
EXISTING_CRON="$(crontab -l 2>/dev/null || true)"

if echo "$EXISTING_CRON" | grep -qF "$MARKER"; then
  echo "[setup-wsl-cron] Cron job already exists — updating it."
  # Remove old entry and re-add fresh
  NEW_CRON="$(echo "$EXISTING_CRON" | grep -v "$MARKER")"
else
  NEW_CRON="$EXISTING_CRON"
  echo "[setup-wsl-cron] Installing new cron job."
fi

# Append new entry and install
printf '%s\n%s\n' "$NEW_CRON" "$CRON_JOB" | crontab -

echo ""
echo "[setup-wsl-cron] SUCCESS. Current crontab:"
crontab -l

echo ""
echo "[setup-wsl-cron] The scraper will run daily at ${CRON_HOUR}:$(printf '%02d' $CRON_MIN) (WSL system time)."
echo "[setup-wsl-cron] Logs will be written to: ${LOG_FILE}"
echo ""
echo "Tips:"
echo "  - To run the scraper manually:  cd $PROJECT_DIR && npm run scrape"
echo "  - To view logs:                 tail -f $LOG_FILE"
echo "  - To remove the cron job:       crontab -e  (then delete the scrape-daily line)"
echo "  - WSL must be running at 3 AM — Windows Task Scheduler can auto-start WSL if needed."
