#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Al-Yusr API — team notifications (9 Nov 2026)
#    • an editor's change (or a new editor account) waits for approval → the super admins
#    • the change was approved / sent back (with the note)            → the editor who sent it
#    • someone asks to volunteer / signs up for a field campaign      → the super admins
#    • a paid donation reaches a case                                 → the team member following it
#    • GET /notifications?types=a,b,prefix_*  (the dashboard filters by kind)
#  No database changes. New: one provider + observers + notifications. Changed: DonationObserver,
#  NotificationController, bootstrap/providers.php (one line).
#  bash deploy.sh --check   → checks only        bash deploy.sh → deploy (backup first, auto-rollback)
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
API_URL="${API_URL:-https://api.elyusr.org/api/v1}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/files"
STAMP="$(date +%Y%m%d-%H%M%S)"
BK="$HOME/backups/notify-2026-11-09-$STAMP"
CHECK_ONLY=0; [[ "${1:-}" == "--check" ]] && CHECK_ONLY=1
FORCE="${FORCE:-0}"

green() { printf '\033[32m%s\033[0m\n' "$*"; }
red()   { printf '\033[31m%s\033[0m\n' "$*"; }
step()  { printf '\n\033[1m▶ %s\033[0m\n' "$*"; }

# ── 1. Checks ────────────────────────────────────────────────────────────────
step "1/5 فحص قبل أي تعديل"
[[ -f "$APP/artisan" ]] || { red "مش لاقي Laravel في $APP"; exit 1; }
cd "$APP"
php artisan --version

PROBLEMS=0
while read -r expected path; do
  [[ -z "$path" ]] && continue
  if [[ "$expected" == "NEW" ]]; then
    if [[ -f "$APP/$path" ]] && ! cmp -s "$APP/$path" "$SRC/$path"; then
      red "  موجود بالفعل ومختلف: $path"; PROBLEMS=$((PROBLEMS+1))
    fi
  elif [[ ! -f "$APP/$path" ]]; then
    red "  ناقص على السيرفر: $path"; PROBLEMS=$((PROBLEMS+1))
  elif ! cmp -s "$APP/$path" "$SRC/$path"; then
    actual="$(sha256sum < "$APP/$path" | cut -d' ' -f1)"
    [[ "$expected" == "$actual" ]] || { red "  اتعدّل على السيرفر (مش النسخة اللي التعديل مبني عليها): $path"; PROBLEMS=$((PROBLEMS+1)); }
  fi
done < "$HERE/expected-base.sha256"

for need in app/Notifications/AppNotification.php app/Support/NotifyAdmins.php app/Support/NotifyDonor.php app/Models/Impact/CaseFollower.php app/Models/ContentChangeRequest.php app/Models/Volunteer.php app/Models/VolunteerCampaignApplication.php; do
  [[ -f "$APP/$need" ]] || { red "  ناقص على السيرفر (البندل محتاجه): $need"; PROBLEMS=$((PROBLEMS+1)); }
done

if (( PROBLEMS > 0 )); then
  red "في $PROBLEMS ملف على السيرفر مش زي النسخة اللي التعديلات مبنية عليها — مش هكتب فوقهم."
  [[ "$FORCE" == "1" ]] || exit 1
  red "FORCE=1 — هكمّل (فيه نسخة احتياطية قبل أي تعديل)."
fi
green "الفحص تمام."
(( CHECK_ONLY )) && { green "(--check) مفيش أي تعديل اتعمل."; exit 0; }

# ── 2. Backup (code only: this bundle doesn't touch the database) ───────────
step "2/5 نسخة احتياطية → $BK"
mkdir -p "$BK"
tar -czf "$BK/code.tgz" -C "$APP" app bootstrap/providers.php
cat > "$BK/rollback.sh" <<RB
#!/usr/bin/env bash
# يرجّع الكود زي ما كان قبل نشر $STAMP (الملفات الجديدة بتفضل بس مش متسجّلة، فمش بتشتغل).
set -e
cd "$APP"
tar -xzf "$BK/code.tgz" -C "$APP"
php artisan optimize:clear
echo "الكود رجع."
RB
chmod +x "$BK/rollback.sh"
green "اتاخدت: code.tgz + rollback.sh"

restore() {
  red "حصل خطأ — برجّع الكود من النسخة الاحتياطية…"
  bash "$BK/rollback.sh" || true
}
trap restore ERR

# ── 3. Files ─────────────────────────────────────────────────────────────────
step "3/5 نسخ الملفات"
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
php artisan route:list --path=api/v1/notifications --no-ansi | grep -c notifications | sed 's/^/  مسارات الإشعارات: /'
trap - ERR

# ── 5. Smoke tests ───────────────────────────────────────────────────────────
step "5/5 تجربة"
ok=1
code() { curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' "$@"; }
c=$(code "$API_URL/programs");                          echo "  GET programs → $c (200)"; [[ $c == 200 ]] || ok=0
c=$(code "$API_URL/notifications?types=new_volunteer"); echo "  GET notifications بدون دخول → $c (401)"; [[ $c == 401 ]] || ok=0
APP="$APP" php "$HERE/selftest.php" || ok=0
echo
if (( ok )); then green "✅ النشر خلص. النسخة الاحتياطية: $BK"; else red "⚠️  في تجربة مش زي المتوقع (فوق). للرجوع: bash $BK/rollback.sh"; fi
