#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — deploy of 2 Nov 2026
#    • newsletter: public POST /newsletter/subscribe (visitors were getting 401)
#    • misbaha: shared misbaha rooms (deceased / sick / group) + stats
#
#  Run ON THE SERVER, from this folder:     bash deploy.sh
#  Dry run (checks only, changes nothing):  bash deploy.sh --check
#
#  What it does, in order — it stops at the first problem:
#    1. checks PHP, artisan, and that every file it replaces is still the version we expect
#    2. backs up the code it touches + the WHOLE database to ~/backups/2026-11-02-<time>/
#    3. copies the files, adds one require line to routes/api.php, runs php -l on everything
#    4. runs ONLY its own migration (never other pending ones), clears caches, calls the new endpoints
#    5. if any step after the backup fails, it restores the code automatically
#  A rollback.sh is written into the backup folder for later.
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"
BK="$HOME/backups/2026-11-02-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
FORCE="${FORCE:-0}"
REQUIRE_LINE="require __DIR__.'/api-2026-11.php';"

green() { printf '\033[32m%s\033[0m\n' "$*"; }
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
step()  { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

# ── 1. Checks ────────────────────────────────────────────────────────────────
step "1/5 فحص قبل أي تعديل"
[[ -f "$APP/artisan" ]] || { red "مش لاقي Laravel في $APP (غيّر المسار: APP=/path bash deploy.sh)"; exit 1; }
command -v php >/dev/null || { red "php مش موجود"; exit 1; }
cd "$APP"
php artisan --version

PROBLEMS=0
while read -r expected path; do
  [[ -z "$path" ]] && continue
  if [[ "$expected" == "NEW" ]]; then
    if [[ -f "$APP/$path" ]] && ! cmp -s "$APP/$path" "$SRC/$path"; then
      red "  موجود بالفعل ومختلف: $path"; PROBLEMS=$((PROBLEMS+1))
    fi
  else
    if [[ ! -f "$APP/$path" ]]; then
      red "  ناقص على السيرفر: $path"; PROBLEMS=$((PROBLEMS+1))
    elif cmp -s "$APP/$path" "$SRC/$path"; then
      :  # already deployed
    else
      actual="$(sha256sum < "$APP/$path" | cut -d' ' -f1)"
      if [[ "$actual" != "$expected" ]]; then
        red "  اتعدّل على السيرفر بعد 29 أكتوبر: $path"; PROBLEMS=$((PROBLEMS+1))
      fi
    fi
  fi
done < "$HERE/expected-base.sha256"

if (( PROBLEMS > 0 )); then
  red "في $PROBLEMS ملف على السيرفر مش زي النسخة اللي التعديلات مبنية عليها."
  red "مش هكتب فوقهم عشان ما نمسحش شغل حد. ابعت الملفات دي للمطور يدمجها،"
  red "أو لو متأكد إن الاستبدال آمن شغّل:  FORCE=1 bash deploy.sh"
  [[ "$FORCE" == "1" ]] || exit 1
  red "FORCE=1 — هكمّل (فيه نسخة احتياطية قبل أي تعديل)."
fi

# DB credentials from .env (values may be quoted)
envval() { { grep -E "^$1=" "$APP/.env" || true; } | tail -1 | cut -d= -f2- | sed -e 's/\r$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }
DB_CONNECTION="$(envval DB_CONNECTION)"; DB_HOST="$(envval DB_HOST)"; DB_PORT="$(envval DB_PORT)"
DB_DATABASE="$(envval DB_DATABASE)"; DB_USERNAME="$(envval DB_USERNAME)"; DB_PASSWORD="$(envval DB_PASSWORD)"
[[ "$DB_CONNECTION" == "mysql" || "$DB_CONNECTION" == "mariadb" ]] || { red "قاعدة البيانات مش MySQL ($DB_CONNECTION) — الباك أب لازم يتعمل يدوي"; exit 1; }
command -v mysqldump >/dev/null || { red "mysqldump مش موجود"; exit 1; }
php artisan migrate:status --no-ansi >/dev/null || { red "migrate:status فشل — اتأكد من الاتصال بقاعدة البيانات"; exit 1; }
green "الفحص تمام."
(( CHECK_ONLY )) && { green "(--check) مفيش أي تعديل اتعمل."; exit 0; }

# ── 2. Backup ────────────────────────────────────────────────────────────────
step "2/5 نسخة احتياطية → $BK"
mkdir -p "$BK"
tar -czf "$BK/code.tgz" -C "$APP" app routes database bootstrap config composer.json composer.lock
export MYSQL_PWD="$DB_PASSWORD"
mysqldump --single-transaction --quick --routines --no-tablespaces \
  -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" "$DB_DATABASE" | gzip > "$BK/db.sql.gz"
unset MYSQL_PWD
[[ "$(zcat "$BK/db.sql.gz" | tail -c 200 | grep -c 'Dump completed')" -ge 1 ]] || { red "الباك أب بتاع قاعدة البيانات مش كامل — وقفت."; exit 1; }
php artisan migrate:status --no-ansi > "$BK/migrate-status-before.txt" || true

cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
# يرجّع الكود زي ما كان قبل نشر $STAMP. قاعدة البيانات: شوف آخر الملف.
set -e
cd "$APP"
rm -f routes/api-2026-11.php app/Http/Controllers/Api/V1/Misbaha/MisbahaRoomController.php app/Models/MisbahaRoom.php \\
      app/Http/Controllers/Api/V1/Newsletter/NewsletterPublicController.php app/Console/Commands/SendNewsletterConfirmations.php \\
      database/migrations/2026_11_02_120000_create_misbaha_rooms_table.php
tar -xzf "$BK/code.tgz" -C "$APP"
php artisan optimize:clear
echo "الكود رجع. الجداول/الأعمدة الجديدة لسه موجودة ومش بتضر."
echo "لو عايز ترجّع قاعدة البيانات كلها (هيمسح أي بيانات اتسجلت بعد النشر):"
echo "  zcat $BK/db.sql.gz | mysql -h ${DB_HOST:-127.0.0.1} -P ${DB_PORT:-3306} -u $DB_USERNAME -p $DB_DATABASE"
RB
chmod +x "$BK/rollback.sh"
green "اتاخدت: code.tgz + db.sql.gz ($(du -h "$BK/db.sql.gz" | cut -f1)) + rollback.sh"

restore() {
  red "حصل خطأ — برجّع الكود من النسخة الاحتياطية…"
  bash "$BK/rollback.sh" || true
  red "رجع. ابعت آخر 40 سطر من الشاشة دي للمطور."
}
trap restore ERR

# ── 3. Files ─────────────────────────────────────────────────────────────────
step "3/5 نسخ الملفات"
# Only the files in the manifest (anything else left in files/ from an older copy is ignored).
awk '{print $2}' "$HERE/expected-base.sha256" | while read -r f; do
  [[ -z "$f" ]] && continue
  mkdir -p "$APP/$(dirname "$f")"
  cp "$SRC/$f" "$APP/$f"
  php -l "$APP/$f" >/dev/null
  echo "  ✓ $f"
done
if ! grep -qF "$REQUIRE_LINE" "$APP/routes/api.php"; then
  printf '\n%s\n' "$REQUIRE_LINE" >> "$APP/routes/api.php"
  echo "  ✓ routes/api.php ← $REQUIRE_LINE"
fi
php -l "$APP/routes/api.php" >/dev/null

# ── 4. Migrate + caches ─────────────────────────────────────────────────────
step "4/5 migrations"
# Only our migration: other people's pending migrations on this server are left alone.
php artisan migrate --force --no-ansi --path=database/migrations/2026_11_02_120000_create_misbaha_rooms_table.php
php artisan optimize:clear --no-ansi
php artisan route:list --path=misbaha-rooms --no-ansi | grep -q "misbaha-rooms/stats"
php artisan route:list --path=newsletter/subscribe --no-ansi | grep -q "newsletter/subscribe"

# ── 5. Smoke tests ───────────────────────────────────────────────────────────
step "5/5 تجربة الـ endpoints"
trap - ERR
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
ok=1
c=$(code "$API_URL/misbaha-rooms/stats");                         echo "  GET  misbaha-rooms/stats        → $c (المتوقع 200)"; [[ $c == 200 ]] || ok=0
c=$(code "$API_URL/misbaha-rooms");                               echo "  GET  misbaha-rooms              → $c (المتوقع 200)"; [[ $c == 200 ]] || ok=0
c=$(code -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{"email":"x"}' "$API_URL/newsletter/subscribe")
                                                                  echo "  POST newsletter/subscribe (غلط) → $c (المتوقع 422، مش 401)"; [[ $c == 422 ]] || ok=0

echo
if (( ok )); then
  green "✅ النشر خلص. النسخة الاحتياطية: $BK"
  green "   للرجوع في أي وقت:  bash $BK/rollback.sh"
else
  red "⚠️  النشر اتعمل بس في endpoint مش بيرد زي المتوقع (فوق)."
  red "   ممكن يكون كاش الـ CDN — جرّب تاني بعد دقيقة. للرجوع: bash $BK/rollback.sh"
fi
echo
echo "باقي حاجة واحدة يدوي: بيانات SMTP في .env عشان إيميل تأكيد النشرة يتبعت، وبعدها:"
echo "  php artisan config:clear && php artisan newsletter:send-confirmations"
