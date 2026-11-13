#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Turn on real email for api.elyusr.org (today MAIL_MAILER=log: every email — the
#  confirmation code, password reset, welcome — is written to the log and never sent).
#  Mailbox roles: support@elyusr.org SENDS every email from the system (codes, account activation,
#  receipts, automations, newsletter); info@elyusr.org is the public contact address and only RECEIVES
#  (every email carries Reply-To: info@). YOU type support@'s password here (it is not shown and
#  not saved anywhere except the server's .env). Then a test email goes to the address you give.
#    ssh -t -p 65002 u389354171@195.35.26.214 "bash ~/mail-setup.sh"
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"
FROM="${FROM:-support@elyusr.org}"
cd "$APP"
cp .env "$HOME/backups/env-before-mail-$(date +%Y%m%d-%H%M%S)" 2>/dev/null || { mkdir -p "$HOME/backups"; cp .env "$HOME/backups/env-before-mail-$(date +%Y%m%d-%H%M%S)"; }

echo "البريد اللي هيبعت: $FROM (smtp.hostinger.com:465) — والردود بتروح لـ info@elyusr.org"
read -rsp "اكتب كلمة مرور صندوق $FROM (مش هتظهر): " PASS; echo
[[ -n "$PASS" ]] || { echo "مفيش كلمة مرور. مفيش حاجة اتغيرت."; exit 1; }
read -rp "ابعت رسالة تجربة لأي بريد (مثلاً بريدك الشخصي): " TO

setenv() {  # key value — single-quoted in .env (literal: no ${…} expansion); replaces the line or appends it
  K="$1" V="$2" php -r '
    $f = ".env"; $k = getenv("K"); $v = "\x27" . str_replace(["\\", "\x27"], ["\\\\", "\\\x27"], getenv("V")) . "\x27";
    $lines = file($f); $done = false;
    foreach ($lines as &$l) { if (strpos($l, $k . "=") === 0) { $l = $k . "=" . $v . "\n"; $done = true; } }
    if (! $done) { $lines[] = $k . "=" . $v . "\n"; }
    file_put_contents($f, implode("", $lines));'
}
setenv MAIL_MAILER smtp
setenv MAIL_SCHEME smtps
setenv MAIL_HOST smtp.hostinger.com
setenv MAIL_PORT 465
setenv MAIL_USERNAME "$FROM"
setenv MAIL_PASSWORD "$PASS"
setenv MAIL_FROM_ADDRESS "$FROM"
setenv MAIL_FROM_NAME "مؤسسة اليسر الخيرية"
unset PASS
php artisan config:clear --no-ansi >/dev/null

echo "ببعت رسالة تجربة لـ $TO …"
if TO="$TO" php artisan tinker --execute='try { Illuminate\Support\Facades\Mail::raw("دي رسالة تجربة من موقع مؤسسة اليسر الخيرية. لو وصلتك، يبقى رموز التأكيد ورسائل الموقع بقت شغالة.", fn($m) => $m->to(getenv("TO"))->subject("تجربة البريد — مؤسسة اليسر الخيرية")); echo "SENT\n"; } catch (\Throwable $e) { echo "FAILED: ".$e->getMessage()."\n"; }' 2>&1 | tee /tmp/mailtest.txt | grep -q SENT; then
  echo "✅ السيرفر بعت الرسالة. شوف صندوق $TO (والسبام)."
else
  echo "⚠️ الإرسال فشل:"; tail -3 /tmp/mailtest.txt
  echo "اتأكد من كلمة المرور، وإن الصندوق $FROM معمول في Hostinger (Emails ← Email Accounts)."
  echo "الإعدادات القديمة محفوظة في ~/backups/env-before-mail-*"
fi
rm -f /tmp/mailtest.txt
