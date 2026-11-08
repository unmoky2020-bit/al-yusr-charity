#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — 8 Nov 2026: donor notifications + program slugs
#    • the donor's own account is notified when a donation is confirmed (paid) or fails, and
#      when an update is posted on a case they paid for (in-app + web push, like the admins)
#    • program slugs: a pasted page address is cleaned to its last part; only a-z 0-9 and "-"
#  No migration, no new route.
#  bash deploy.sh --check   → checks only        bash deploy.sh → deploy (backup first, auto-rollback)
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"
BK="$HOME/backups/2026-11-08-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
FORCE="${FORCE:-0}"

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
      if [[ "|$expected|" != *"|$actual|"* ]]; then
        red "  اتعدّل على السيرفر (مش النسخة اللي التعديل مبني عليها): $path"; PROBLEMS=$((PROBLEMS+1))
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
step "3/5 نسخ الملفات"
# Only the files in the manifest (anything else left in files/ from an older copy is ignored).
awk '{print $2}' "$HERE/expected-base.sha256" | while read -r f; do
  [[ -z "$f" ]] && continue
  mkdir -p "$APP/$(dirname "$f")"
  cp "$SRC/$f" "$APP/$f"
  php -l "$APP/$f" >/dev/null
  echo "  ✓ $f"
done

# ── 4. Caches ───────────────────────────────────────────────────────────────
step "4/5 تنظيف الكاش"
php artisan optimize:clear --no-ansi >/dev/null

# ── 5. Smoke tests ───────────────────────────────────────────────────────────
step "5/5 تجربة"
trap - ERR
ok=1
c=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$API_URL/programs?per_page=1")
echo "  GET programs → $c (المتوقع 200)"; [[ $c == 200 ]] || ok=0
php artisan tinker --execute="foreach (['App\\Support\\NotifyDonor','App\\Notifications\\DonorDonationPaidNotification','App\\Notifications\\DonorDonationFailedNotification','App\\Notifications\\DonorCaseUpdateNotification','App\\Observers\\CaseUpdateObserver'] as \$c) { echo '  '.(class_exists(\$c) ? '✓' : '✗').' '.\$c.PHP_EOL; }" || ok=0
php artisan tinker --execute="\$d = App\\Models\\Donation::with('donor')->where('status','paid')->latest()->first(); echo '  آخر تبرع مدفوع: '.(\$d ? ('#'.\$d->id.' — حساب المتبرع: '.(App\\Support\\NotifyDonor::accountFor(\$d)?->email ?? 'مفيش حساب (متبرع ضيف)')) : 'مفيش').PHP_EOL;" || true
echo
if (( ok )); then green "✅ النشر خلص. النسخة الاحتياطية: $BK"; else red "⚠️  في تجربة مش زي المتوقع (فوق). للرجوع: bash $BK/rollback.sh"; fi
