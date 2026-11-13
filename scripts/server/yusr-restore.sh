#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Restore the API from a backup made by the dashboard / schedule (storage/app/backups/<name>).
#    bash ~/yusr-restore.sh                       → list the backups on the server
#    bash ~/yusr-restore.sh <name>                → database + uploaded files (if the backup has them)
#    bash ~/yusr-restore.sh <name> --db-only      → database only
#  A backup from Google Drive: download its folder into storage/app/backups/ first
#    (~/bin/rclone copy gdrive:ElyusrBackups/<name> ~/domains/api.elyusr.org/public_html/storage/app/backups/<name>).
#  Before touching anything it takes a fresh database backup (so the restore itself can be undone),
#  puts the API in maintenance mode, and brings it back up at the end even if something fails.
# ─────────────────────────────────────────────────────────────────────────────
set -Eeuo pipefail
APP="${APP:-$HOME/domains/api.elyusr.org/public_html}"; DIR="$APP/storage/app/backups"
cd "$APP"
if [[ $# -eq 0 ]]; then
  echo "النسخ الموجودة على السيرفر:"; ls -1 "$DIR" | grep -v -e drive-status.json -e .htaccess | sed 's/^/  /'; exit 0
fi
NAME="$1"; MODE="${2:-}"; SRC="$DIR/$NAME"
[[ "$NAME" =~ ^[A-Za-z0-9_.-]+$ && -f "$SRC/database.sql.gz" ]] || { echo "النسخة «$NAME» مش موجودة في $DIR"; exit 1; }
echo "النسخة: $NAME"; cat "$SRC/manifest.json" 2>/dev/null | head -12
gzip -t "$SRC/database.sql.gz" || { echo "ملف قاعدة البيانات بايظ. مفيش حاجة اتغيرت."; exit 1; }
if [[ -t 0 ]]; then
  read -rp "اكتب اسم النسخة تاني علشان تأكد الاسترجاع: " ok; [[ "$ok" == "$NAME" ]] || { echo "اتلغى."; exit 1; }
fi

echo "▶ نسخة أمان من الوضع الحالي قبل الاسترجاع"
php artisan backup:run --kind=db --no-ansi
php artisan down --retry=60 --no-ansi || true
trap 'php artisan up --no-ansi >/dev/null 2>&1 || true' EXIT

echo "▶ قاعدة البيانات"
eval "$(php -r 'require "vendor/autoload.php"; $a=require "bootstrap/app.php"; $a->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap(); $c=config("database.connections.mysql"); foreach(["DBH"=>$c["host"],"DBP"=>$c["port"],"DBU"=>$c["username"],"DBN"=>$c["database"],"MYSQL_PWD"=>$c["password"]] as $k=>$v) echo "export $k=".escapeshellarg((string)$v).";";')"
gunzip -c "$SRC/database.sql.gz" | mysql -h "$DBH" -P "$DBP" -u "$DBU" "$DBN"
unset MYSQL_PWD
echo "  ✓ اترجعت"

if [[ "$MODE" != "--db-only" && -f "$SRC/uploads.zip" ]]; then
  echo "▶ الصور والملفات المرفوعة"
  php -r '$z=new ZipArchive(); if($z->open($argv[1])!==true){fwrite(STDERR,"zip?\n");exit(1);} $z->extractTo($argv[2]); echo "  ✓ ".$z->numFiles." ملف\n"; $z->close();' "$SRC/uploads.zip" "$APP/storage/app/public"
fi
php artisan optimize:clear --no-ansi >/dev/null
echo "✅ الاسترجاع خلص. لو عايز ترجع زي ما كنت قبله: آخر نسخة اسمها فيه «-db-» اتعملت دلوقتي."
