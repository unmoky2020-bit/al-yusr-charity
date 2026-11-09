#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — 9 Nov 2026
#    • photo gallery: show / edit / delete reached an empty record (route {gallery} vs
#      $galleryImage), so a deleted photo came back; removing a photo keeps the stored file
#    • dashboard home: a content editor gets the content counts only (no donation money)
#    • my donations: a donor sees the donations made with their account email (was donor_id =
#      user id, i.e. another donor's records); ?mine=1 gives an admin their own list too
#    • delivery steps of a paid donation: PATCH /donations/{id}/delivery
#      (family_identified → preparing → delivered) + a notification to the donor's account
#    • profile: PUT /profile, POST|DELETE /profile/avatar  (+ bio, city, governorate, job title,
#      contact preferences, email_verified_at columns on users)
#    • the customers sheet: GET /reports/donors
#    • engagement counters of the homepage campaigns strip: POST /engagement, GET|DELETE /admin/engagement
#  Migrations: ONLY this bundle's two files are run (--path), never anyone else's pending ones.
#  New routes: routes/api-2026-11-09.php
#  bash deploy.sh --check   → checks only        bash deploy.sh → deploy (backup first, auto-rollback)
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"
BK="$HOME/backups/2026-11-09-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
FORCE="${FORCE:-0}"
REQUIRE_LINE="require __DIR__.'/api-2026-11-09.php';"
MIGRATIONS=(
  database/migrations/2026_11_09_000001_add_profile_fields_to_users_table.php
  database/migrations/2026_11_09_000002_create_engagement_counters_table.php
)

green() { printf '\033[32m%s\033[0m\n' "$*"; }
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
step()  { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

# ── 1. Checks ────────────────────────────────────────────────────────────────
step "1/6 فحص قبل أي تعديل"
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
      if [[ "|$expected|" != *"|$actual|"* ]]; then
        red "  اتعدّل على السيرفر (مش النسخة اللي التعديل مبني عليها): $path"; PROBLEMS=$((PROBLEMS+1))
      fi
    fi
  fi
done < "$HERE/expected-base.sha256"

for need in app/Notifications/AppNotification.php app/Support/NotifyDonor.php app/Models/Donor.php; do
  [[ -f "$APP/$need" ]] || { red "  ناقص على السيرفر (البندل محتاجه): $need"; PROBLEMS=$((PROBLEMS+1)); }
done

if (( PROBLEMS > 0 )); then
  red "في $PROBLEMS ملف على السيرفر مش زي النسخة اللي التعديلات مبنية عليها."
  red "مش هكتب فوقهم عشان ما نمسحش شغل حد. ابعت الملفات دي للمطور يدمجها،"
  red "أو لو متأكد إن الاستبدال آمن شغّل:  FORCE=1 bash deploy.sh"
  [[ "$FORCE" == "1" ]] || exit 1
  red "FORCE=1 — هكمّل (فيه نسخة احتياطية قبل أي تعديل)."
fi

envval() { { grep -E "^$1=" "$APP/.env" || true; } | tail -1 | cut -d= -f2- | sed -e 's/\r$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }
DB_CONNECTION="$(envval DB_CONNECTION)"; DB_HOST="$(envval DB_HOST)"; DB_PORT="$(envval DB_PORT)"
DB_DATABASE="$(envval DB_DATABASE)"; DB_USERNAME="$(envval DB_USERNAME)"; DB_PASSWORD="$(envval DB_PASSWORD)"
[[ "$DB_CONNECTION" == "mysql" || "$DB_CONNECTION" == "mariadb" ]] || { red "قاعدة البيانات مش MySQL ($DB_CONNECTION) — الباك أب لازم يتعمل يدوي"; exit 1; }
command -v mysqldump >/dev/null || { red "mysqldump مش موجود"; exit 1; }
php artisan migrate:status --no-ansi >/dev/null || { red "migrate:status فشل — اتأكد من الاتصال بقاعدة البيانات"; exit 1; }
PENDING_OTHERS="$(php artisan migrate:status --no-ansi | grep -i pending | grep -v '2026_11_09_00000' || true)"
if [[ -n "$PENDING_OTHERS" ]]; then
  echo "  تنبيه: في migrations تانية مستنية (مش بتاعتنا — مش هتتشغل):"
  echo "$PENDING_OTHERS" | sed 's/^/    /'
fi
green "الفحص تمام."
(( CHECK_ONLY )) && { green "(--check) مفيش أي تعديل اتعمل."; exit 0; }

# ── 2. Backup ────────────────────────────────────────────────────────────────
step "2/6 نسخة احتياطية → $BK"
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
# يرجّع الكود زي ما كان قبل نشر $STAMP. الأعمدة/الجدول الجديدة بتفضل (فاضية ومش مستخدمة) — آمن.
set -e
cd "$APP"
tar -xzf "$BK/code.tgz" -C "$APP"
php artisan optimize:clear
echo "الكود رجع."
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
step "3/6 نسخ الملفات"
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

# ── 4. Our migrations only ──────────────────────────────────────────────────
step "4/6 قاعدة البيانات (الـ migrations بتاعة البندل ده بس)"
for m in "${MIGRATIONS[@]}"; do
  php artisan migrate --path="$m" --force --no-ansi | sed 's/^/  /'
done

# ── 5. Caches ───────────────────────────────────────────────────────────────
step "5/6 تنظيف الكاش"
php artisan optimize:clear --no-ansi >/dev/null
php artisan route:list --path=api/v1/profile --no-ansi | sed 's/^/  /'
trap - ERR

# ── 6. Smoke tests ───────────────────────────────────────────────────────────
step "6/6 تجربة"
ok=1
code() { curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$@"; }
c=$(code "$API_URL/programs?per_page=1");                  echo "  GET programs → $c (200)"; [[ $c == 200 ]] || ok=0
c=$(code -X PUT "$API_URL/profile");                         echo "  PUT profile بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code -X POST "$API_URL/profile/avatar");                 echo "  POST profile/avatar بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code -X PATCH "$API_URL/donations/1/delivery");          echo "  PATCH donations/1/delivery بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code "$API_URL/reports/donors");                         echo "  GET reports/donors بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code "$API_URL/admin/engagement");                       echo "  GET admin/engagement بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
c=$(code -X POST -H 'Content-Type: application/json' -d '{"scope":"campaigns","slug":"deploy-selftest","kind":"card_view"}' "$API_URL/engagement")
echo "  POST engagement → $c (202)"; [[ $c == 202 ]] || ok=0
php artisan tinker --execute="echo '  عدّاد التجربة: '.DB::table('engagement_counters')->where('slug','deploy-selftest')->sum('count').' (اتشال)'.PHP_EOL; DB::table('engagement_counters')->where('slug','deploy-selftest')->delete();" || ok=0
GID=$(php artisan tinker --execute="echo optional(App\Models\GalleryImage::query()->latest('id')->first())->id;" 2>/dev/null | tail -1 | tr -dc '0-9')
if [[ -n "$GID" ]]; then
  r=$(curl -s -H 'Accept: application/json' "$API_URL/gallery/$GID")
  if [[ "$r" == *"\"id\":$GID"* ]]; then echo "  GET gallery/$GID → بيرجّع الصورة نفسها ✓"; else echo "  GET gallery/$GID → مش بيرجّع الصورة ✗"; ok=0; fi
fi
php artisan tinker --execute="foreach (['users.bio','users.governorate','users.preferences','users.email_verified_at'] as \$c) { [\$t,\$col] = explode('.', \$c); echo '  '.(Schema::hasColumn(\$t,\$col) ? '✓' : '✗').' '.\$c.PHP_EOL; } echo '  '.(Schema::hasTable('engagement_counters') ? '✓' : '✗').' engagement_counters'.PHP_EOL;" || ok=0
php artisan tinker --execute="foreach (['App\\Support\\StaffAccess','App\\Support\\DeliverySteps','App\\Notifications\\DonorDeliveryStageNotification','App\\Http\\Controllers\\Api\\V1\\Auth\\ProfileController','App\\Http\\Controllers\\Api\\V1\\Reports\\DonorsReportController','App\\Http\\Controllers\\Api\\V1\\Engagement\\EngagementController'] as \$c) { echo '  '.(class_exists(\$c) ? '✓' : '✗').' '.\$c.PHP_EOL; }" || ok=0
echo
if (( ok )); then green "✅ النشر خلص. النسخة الاحتياطية: $BK"; else red "⚠️  في تجربة مش زي المتوقع (فوق). للرجوع: bash $BK/rollback.sh"; fi
