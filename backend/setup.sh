#!/usr/bin/env bash
# اليسر — One-shot setup: migrations + seed + start API
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "📝 إنشاء .env من .env.example"
  cp .env.example .env
  echo "⚠️  حرّر backend/.env قبل الاستكمال."
fi

set -a; . ./.env; set +a
DRIVER="${DB_DRIVER:-mysql}"

echo "🔧 DB_DRIVER=$DRIVER"

if [ "$DRIVER" = "mysql" ]; then
  echo "🗄  تشغيل MySQL migrations + seed…"
  mysql -h"${MYSQL_HOST:-127.0.0.1}" -P"${MYSQL_PORT:-3306}" -u"${MYSQL_USER:-root}" \
        ${MYSQL_PASSWORD:+-p"$MYSQL_PASSWORD"} < sql/schema.sql
  mysql -h"${MYSQL_HOST:-127.0.0.1}" -P"${MYSQL_PORT:-3306}" -u"${MYSQL_USER:-root}" \
        ${MYSQL_PASSWORD:+-p"$MYSQL_PASSWORD"} < sql/seed.sql
elif [ "$DRIVER" = "mongo" ]; then
  echo "🗄  تجهيز Mongo (indexes + seed)…"
  mongosh "${MONGO_URI}/${MONGO_DB:-alyusr}" mongo/init.js
else
  echo "❌ DB_DRIVER غير مدعوم: $DRIVER"; exit 1
fi

echo "📦 تثبيت deps الـ Node…"
cd node && (npm i --silent || npm install)
echo "🚀 تشغيل API على :${APP_PORT:-8080}"
npm start