#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Copies the site's backups (storage/app/backups) to Google Drive, folder "ElyusrBackups".
#  Cron (hPanel → Cron Jobs), every 15 minutes:  bash ~/yusr-backup-sync.sh
#  Needs the rclone remote "gdrive" (bash ~/yusr-drive-setup.sh, once). Writes drive-status.json
#  next to the backups; the dashboard page «النسخ الاحتياطية» shows it.
#  Drive keeps 120 days; the server keeps the last 14 daily + 4 weekly (BackupRunner).
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
DIR="$APP/storage/app/backups"; RC="$HOME/bin/rclone"; REMOTE="${REMOTE:-gdrive:ElyusrBackups}"
STATUS="$DIR/drive-status.json"; LOG="$HOME/.yusr-backup-sync.log"
mkdir -p "$DIR"
status() { php -r 'file_put_contents($argv[1], json_encode(["at"=>date("c"),"ok"=>$argv[2]==="1","message"=>$argv[3],"remote"=>$argv[4],"folders"=>(int)$argv[5]], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));' "$STATUS" "$1" "$2" "$REMOTE" "${3:-0}"; }

if [[ ! -x "$RC" ]] || ! "$RC" listremotes 2>/dev/null | grep -q '^gdrive:'; then
  status 0 "جوجل درايف مش مربوط لسه (bash ~/yusr-drive-setup.sh)"; exit 0
fi
exec 9>"$HOME/.yusr-backup-sync.lock"; flock -n 9 || exit 0

if "$RC" copy "$DIR" "$REMOTE" --exclude drive-status.json --exclude .htaccess --transfers 2 --checkers 4 --retries 3 --low-level-retries 5 >"$LOG" 2>&1; then
  "$RC" delete "$REMOTE" --min-age 120d >>"$LOG" 2>&1 || true
  "$RC" rmdirs "$REMOTE" --leave-root >>"$LOG" 2>&1 || true
  n=$("$RC" lsf "$REMOTE" --dirs-only 2>/dev/null | wc -l)
  status 1 "آخر نقل تم" "$n"
else
  msg=$(tail -3 "$LOG" | tr '\n' ' ' | cut -c1-300)
  status 0 "النقل فشل: $msg"
fi
