# اليسر — Laravel / PHP Backend

يستخدم نفس الـ schema (`backend/sql/schema.sql`) ونفس مسارات الـ API.

## 1) إعداد Laravel
```bash
composer create-project laravel/laravel alyusr-api
cd alyusr-api
cp ../.env.example .env
php artisan key:generate
```

## 2) ENV
استخدم نفس مفاتيح `backend/.env.example` + ضِف:
```
DB_CONNECTION=mysql
DB_HOST=${MYSQL_HOST}
DB_PORT=${MYSQL_PORT}
DB_DATABASE=${MYSQL_DB}
DB_USERNAME=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
```

## 3) شغّل الـ Migrations
```bash
mysql -u$DB_USERNAME -p$DB_PASSWORD < ../sql/schema.sql
mysql -u$DB_USERNAME -p$DB_PASSWORD < ../sql/seed.sql
```

## 4) Routes (في `routes/api.php`)
تجد التطبيق المرجعي في `backend/php/public/index.php` (نسخة PHP خفيفة بدون فريموورك تشتغل
بنفس الـ schema، مفيدة كاختبار سريع أو للنشر على Shared Hosting).

## 5) MongoDB في Laravel
استخدم [`mongodb/laravel-mongodb`](https://github.com/mongodb/laravel-mongodb):
```bash
composer require mongodb/laravel-mongodb
```
ثم في `.env`:
```
DB_CONNECTION=mongodb
MONGODB_URI=${MONGO_URI}
MONGODB_DATABASE=${MONGO_DB}
```