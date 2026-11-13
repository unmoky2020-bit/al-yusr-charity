#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — backups + speed (13 Nov 2026, h)
#    • backups: backup_runs table, BackupRunner (database / database+uploads), dashboard API,
#      daily + weekly schedule, ~/yusr-backup-sync.sh (Google Drive), ~/yusr-restore.sh
#    • speed: perf:recache keeps config/route caches fresh (rebuilt within a minute of any edit),
#      web requests stop sending mail when cron runs, the log rotates daily (14 days)
#    • mail footer takes the foundation's contact data from the dashboard (org_info)
#  bash deploy.sh --check  /  bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"; BK="$HOME/backups/backups-perf-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
MIG=database/migrations/2026_11_13_320000_create_backup_runs.php
REQ_API="require __DIR__.'/api-2026-11-13h-backups.php';"; REQ_CON="require __DIR__.'/console-ops.php';"
NEW=(app/Support/Backup/BackupRunner.php app/Console/Commands/BackupRun.php app/Console/Commands/PerfRecache.php
     app/Http/Controllers/Api/V1/Backup/BackupController.php routes/api-2026-11-13h-backups.php routes/console-ops.php "$MIG")
REPLACED=(app/Providers/MailSystemServiceProvider.php app/Support/Mail/MailRenderer.php)
declare -A EXPECT=([app/Providers/MailSystemServiceProvider.php]=0016330f3ade4b62b3b595ce940a7a45 [app/Support/Mail/MailRenderer.php]=a87b983c44c52971aefec18fe7a81d7c)
green() { printf '\033[32m%s\033[0m\n' "$*"; }; red() { printf '\033[31m%s\033[0m\n' "$*"; }; step() { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

step "1/6 فحص"; cd "$APP"; P=0
for f in "${REPLACED[@]}"; do now=$(md5sum "$f" | cut -d' ' -f1); [[ "$now" == "${EXPECT[$f]}" ]] || { red "  $f اتغير ($now)"; P=$((P+1)); }; done
for f in "${NEW[@]}"; do [[ -e "$f" ]] && { red "  $f موجود"; P=$((P+1)); }; done
for f in $(cd "$SRC" && find . -name '*.php'); do php -l "$SRC/$f" >/dev/null || { red "  syntax $f"; P=$((P+1)); }; done
php -r 'exit(class_exists("ZipArchive")?0:1);' && echo "  ZipArchive: موجود" || echo "  ZipArchive: مش موجود (النسخة الكاملة هتفشل، قاعدة البيانات بس)"
command -v mysql >/dev/null && echo "  mysql client: موجود (للاسترجاع)" || { red "  mysql client مش موجود"; P=$((P+1)); }
(( P > 0 )) && { red "في $P مشكلة. مفيش حاجة اتغيرت."; exit 1; }
green "الفحص تمام."; (( CHECK_ONLY )) && exit 0

step "2/6 نسخة احتياطية → $BK"
mkdir -p "$BK"; chmod 700 "$BK"
for f in "${REPLACED[@]}" routes/api.php routes/console.php .env; do mkdir -p "$BK/$(dirname "$f")"; cp "$f" "$BK/$f"; done
cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
cd "$APP"; php artisan config:clear >/dev/null; php artisan route:clear >/dev/null
for f in ${REPLACED[*]} routes/api.php routes/console.php .env; do cp "$BK/\$f" "\$f"; done
php artisan migrate:rollback --path=$MIG --force --no-ansi || true; rm -f ${NEW[*]}
php artisan optimize:clear >/dev/null; echo "رجع زي ما كان."
RB
chmod +x "$BK/rollback.sh"; trap 'red "خطأ — برجّع"; bash "$BK/rollback.sh" || true' ERR

step "3/6 نسخ"
for f in "${NEW[@]}" "${REPLACED[@]}"; do mkdir -p "$(dirname "$f")"; cp "$SRC/$f" "$f"; echo "  ✓ $f"; done
grep -qF "$REQ_API" routes/api.php || printf '\n%s\n' "$REQ_API" >> routes/api.php
grep -qF "$REQ_CON" routes/console.php || printf '\n%s\n' "$REQ_CON" >> routes/console.php
for s in yusr-backup-sync.sh yusr-restore.sh yusr-drive-setup.sh; do cp "$HERE/$s" "$HOME/$s"; chmod 700 "$HOME/$s"; echo "  ✓ ~/$s"; done

step "4/6 migration + السجل اليومي"
php artisan migrate --path="$MIG" --force --no-ansi | sed 's/^/  /'
php -r '$f=".env"; $s=file_get_contents($f); foreach(["LOG_STACK"=>"daily","LOG_DAILY_DAYS"=>"14"] as $k=>$v){ if(preg_match("/^$k=/m",$s)) $s=preg_replace("/^$k=.*$/m","$k=$v",$s); else $s=rtrim($s)."\n$k=$v\n"; } file_put_contents($f,$s);'
mkdir -p "$HOME/backups/logs"
if [[ -s storage/logs/laravel.log ]]; then gzip -c storage/logs/laravel.log > "$HOME/backups/logs/laravel-until-$STAMP.log.gz" && : > storage/logs/laravel.log; echo "  ✓ السجل القديم اتحفظ في ~/backups/logs"; fi

step "5/6 الكاش"
php artisan optimize:clear --no-ansi >/dev/null
php artisan perf:recache --force --no-ansi | sed 's/^/  /'
php artisan schedule:list --no-ansi | sed 's/^/  /'
trap - ERR

step "6/6 تجربة"
ok=1
php artisan backup:run --kind=db --no-ansi | sed 's/^/  /' || ok=0
last=$(ls -1t storage/app/backups | grep -- '-db-' | head -1)
[[ -n "$last" ]] && gzip -t "storage/app/backups/$last/database.sql.gz" && echo "  ✓ أول نسخة سليمة: $last ($(du -sh storage/app/backups/$last | cut -f1))" || ok=0
c=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' https://api.elyusr.org/api/v1/admin/backups || true); echo "  admin/backups بدون دخول → $c (401)"
php ~/dep-mail/deploy-2026-11-13e-mail-system/selftest.php | tail -1 || true
(( ok )) && green "✅ خلص. الرجوع: bash $BK/rollback.sh" || red "⚠️ الرجوع: bash $BK/rollback.sh"
