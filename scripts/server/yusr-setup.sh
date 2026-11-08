#!/usr/bin/env bash
# Al-Yusr API — e-mail (password codes) and Google/Facebook sign-in keys, typed here once.
# Secrets are read hidden and written only to .env (a backup of .env is kept in ~/backups).
#   bash ~/yusr-setup.sh --status    → what is set (never prints a secret)
#   bash ~/yusr-setup.sh             → asks step by step; Enter skips a step
set -euo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
ENV="$APP/.env"
cd "$APP"
has() { grep -qE "^$1=.+" "$ENV"; }
mark() { for k in "$@"; do if has "$k"; then echo "  ✓ $k"; else echo "  ✗ $k"; fi; done; }
status() {
  echo "البريد (MAIL_MAILER): $(grep -E '^MAIL_MAILER=' "$ENV" | cut -d= -f2- || true)"
  mark MAIL_HOST MAIL_PORT MAIL_USERNAME MAIL_PASSWORD MAIL_FROM_ADDRESS
  echo "الدخول بجوجل وفيسبوك:"; mark GOOGLE_CLIENT_ID FACEBOOK_APP_ID FACEBOOK_APP_SECRET
  echo "الأزرار على الموقع: $(curl -s -H 'Accept: application/json' https://api.elyusr.org/api/v1/auth/providers | sed 's/"client_id":"[^"]*"/"client_id":"✓"/g; s/"app_id":"[^"]*"/"app_id":"✓"/g')"
}
[[ "${1:-}" == "--status" ]] && { status; exit 0; }

quote() { # .env value: single quotes (taken literally) unless the value has one
  local v="$1"
  if [[ "$v" != *"'"* ]]; then printf "'%s'" "$v"; else v="${v//\\/\\\\}"; v="${v//\"/\\\"}"; printf '"%s"' "$v"; fi
}
setkey() { # replace KEY=... or append it
  local line; line="$1=$(quote "$2")"
  if grep -qE "^$1=" "$ENV"; then
    awk -v k="$1" -v line="$line" 'index($0, k"=")==1 {print line; next} {print}' "$ENV" > "$ENV.yusr-tmp"
    cat "$ENV.yusr-tmp" > "$ENV"; rm -f "$ENV.yusr-tmp"
  else
    printf '%s\n' "$line" >> "$ENV"
  fi
}

mkdir -p "$HOME/backups"; BK="$HOME/backups/env-before-setup-$(date +%Y%m%d-%H%M%S)"
cp "$ENV" "$BK"; chmod 600 "$BK"; echo "نسخة من .env: $BK"
changed=0

echo; echo "1) البريد اللي بيبعت رموز «نسيت كلمة السر» وتأكيد الإيميل"
echo "   اعمل الأول صندوق بريد من hPanel ← Emails (مثلًا no-reply@elyusr.org)."
read -r -p "   عنوان صندوق البريد (Enter = تخطي): " MAILBOX
if [[ -n "$MAILBOX" ]]; then
  read -r -s -p "   كلمة سر الصندوق (مش هتظهر): " MAILPASS; echo
  setkey MAIL_MAILER smtp; setkey MAIL_HOST smtp.hostinger.com; setkey MAIL_PORT 465
  setkey MAIL_SCHEME smtps; setkey MAIL_ENCRYPTION ssl
  setkey MAIL_USERNAME "$MAILBOX"; setkey MAIL_PASSWORD "$MAILPASS"
  setkey MAIL_FROM_ADDRESS "$MAILBOX"; setkey MAIL_FROM_NAME "مؤسسة اليسر الخيرية"
  unset MAILPASS; changed=1
fi

echo; echo "2) الدخول بجوجل (Google Cloud ← Credentials ← OAuth client ID ← Web)"
read -r -p "   Google Client ID (Enter = تخطي): " GID
[[ -n "$GID" ]] && { setkey GOOGLE_CLIENT_ID "$GID"; changed=1; }

echo; echo "3) الدخول بفيسبوك (developers.facebook.com ← App ← Facebook Login)"
read -r -p "   Facebook App ID (Enter = تخطي): " FID
if [[ -n "$FID" ]]; then
  read -r -s -p "   Facebook App Secret (مش هيظهر): " FSEC; echo
  setkey FACEBOOK_APP_ID "$FID"; setkey FACEBOOK_APP_SECRET "$FSEC"; unset FSEC; changed=1
fi

if (( changed )); then
  php artisan optimize:clear >/dev/null && echo; echo "✓ اتحفظ واتمسح الكاش."
  if [[ -n "${MAILBOX:-}" ]]; then
    read -r -p "   ابعت رسالة تجربة لإيميل (Enter = تخطي): " TO
    if [[ -n "$TO" ]]; then
      T=$(mktemp --suffix=.php)
      cat > "$T" <<'PHP'
<?php
require getenv('APP').'/vendor/autoload.php';
$app = require getenv('APP').'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
try {
  Illuminate\Support\Facades\Mail::raw("رسالة تجربة من موقع مؤسسة اليسر الخيرية: البريد شغال، ورموز كلمة السر هتوصل.", fn ($m) => $m->to($argv[1])->subject('تجربة البريد — مؤسسة اليسر'));
  echo "   ✓ اتبعتت. شوف الوارد (والـ Spam).\n";
} catch (Throwable $e) { echo "   ✗ ما اتبعتتش: ".$e->getMessage()."\n"; exit(1); }
PHP
      APP="$APP" php "$T" "$TO" || true; rm -f "$T"
    fi
  fi
fi
echo; status
