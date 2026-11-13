#!/bin/bash
# Branded emails: BrandMail + views, EmailCode sends through them. Usage: bash deploy.sh [--check]
set -e
API="$HOME/domains/api.elyusr.org/public_html"
HERE="$(cd "$(dirname "$0")" && pwd)"
EXPECT_EMAILCODE="d8d9baf524eb75233a2eaec3c38dffe3"
now=$(md5sum "$API/app/Support/EmailCode.php" | cut -d' ' -f1)
if [ "$now" != "$EXPECT_EMAILCODE" ]; then echo "STOP: EmailCode.php changed on the server since 8 Nov ($now)"; exit 1; fi
for f in app/Support/BrandMail.php resources/views/emails/brand.blade.php resources/views/emails/brand-text.blade.php; do
  [ -e "$API/$f" ] && { echo "STOP: $f already exists on the server"; exit 1; }
done
for f in $(cd "$HERE/files" && find . -name '*.php' -path './app/*'); do php -l "$HERE/files/$f" >/dev/null || { echo "STOP: syntax $f"; exit 1; }; done
echo "checks ok"
[ "$1" = "--check" ] && exit 0
BK="$HOME/backups/mail-brand-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$BK/app/Support"
cp "$API/app/Support/EmailCode.php" "$BK/app/Support/"
cat > "$BK/rollback.sh" <<R
#!/bin/bash
cp "$BK/app/Support/EmailCode.php" "$API/app/Support/EmailCode.php"
rm -f "$API/app/Support/BrandMail.php" "$API/resources/views/emails/brand.blade.php" "$API/resources/views/emails/brand-text.blade.php"
cd "$API" && php artisan view:clear >/dev/null && echo "rolled back"
R
mkdir -p "$API/resources/views/emails"
cp "$HERE/files/app/Support/BrandMail.php" "$HERE/files/app/Support/EmailCode.php" "$API/app/Support/"
cp "$HERE/files/resources/views/emails/"*.blade.php "$API/resources/views/emails/"
cd "$API" && php artisan view:clear >/dev/null
echo "deployed; backup $BK"
