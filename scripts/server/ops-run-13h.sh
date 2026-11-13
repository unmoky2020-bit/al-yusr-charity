#!/usr/bin/env bash
# One-time run from an hPanel cron job (the SSH link from the owner's computer was down):
# deploys bundle 13h + the frontend build, lists the deleted accounts (dry run), turns open/click
# tracking off (tracked test emails were flagged as spam). Log: ~/ops-run.log, and a copy the
# session reads at https://elyusr.org/.well-known/ops-<id>.txt (deleted by the next run).
set -uo pipefail
LOG="$HOME/ops-run.log"; PUB="$HOME/domains/elyusr.org/public_html/.well-known/ops-5ab3cac0e8baf4ef2d6f7f00.txt"
[[ -f "$HOME/.ops-run-13h.done" ]] && exit 0
touch "$HOME/.ops-run-13h.done"
exec >"$LOG" 2>&1
REPO="https://codeload.github.com/unmoky2020-bit/al-yusr-charity/tar.gz"
SHA="f2ceda771d419ca4f44be0a24d776eb58fd238d5"; ART="494eb871caf7e3ad8e7c7b2bf4043377863e67ab"
API="$HOME/domains/api.elyusr.org/public_html"
echo "== $(date) =="

echo "== backend 13h =="
rm -rf "$HOME/dep-h" && mkdir "$HOME/dep-h" && cd "$HOME/dep-h"
curl -sSL "$REPO/$SHA" | tar xz --strip-components=1 --wildcards "*/backend-handoff/deploy-2026-11-13h-backups-perf" "*/scripts/server/purge-deleted-users.php"
cd "$HOME/dep-h/backend-handoff/deploy-2026-11-13h-backups-perf" && bash deploy.sh --check && bash deploy.sh
cp "$HOME/dep-h/scripts/server/purge-deleted-users.php" "$HOME/purge-deleted-users.php"

echo "== frontend =="
cd "$HOME" && for f in front-1-assets.tgz front-2-site.tgz; do curl -sSL -o "$HOME/$f" "https://raw.githubusercontent.com/unmoky2020-bit/al-yusr-charity/$ART/$f"; done
md5sum "$HOME/front-1-assets.tgz" "$HOME/front-2-site.tgz"
rm -rf "$HOME/front-new" && mkdir "$HOME/front-new" && cd "$HOME/front-new" && tar -xzf "$HOME/front-1-assets.tgz" && tar -xzf "$HOME/front-2-site.tgz" && bash deploy.sh --check && bash deploy.sh 2>&1 | tail -22
cd "$HOME" && rm -rf "$HOME/front-new" "$HOME/front-1-assets.tgz" "$HOME/front-2-site.tgz"

echo "== tracking off =="
cd "$API" && php -r 'require "vendor/autoload.php"; $a=require "bootstrap/app.php"; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); print_r(App\Support\Mail\MailSettings::save(["track"=>false])["track"] ? "on\n" : "off\n");'

echo "== deleted accounts (dry run) =="
php "$HOME/purge-deleted-users.php"

echo "== state =="
php artisan schedule:list --no-ansi 2>&1 | head -12
ls -la "$API/storage/app/backups" | tail -5
echo "== done $(date) =="
mkdir -p "$(dirname "$PUB")" && cp "$LOG" "$PUB"
