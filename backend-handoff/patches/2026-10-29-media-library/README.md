# باتش مكتبة الوسائط وصور المقالات — 29 أكتوبر 2026

الملفات دي نسخة كاملة من ملفات الباك إند بعد التعديل، بنفس مساراتها جوه مشروع Laravel.
اتجهزت على السيرفر في `~/stage`، واتعملها `php -l` ومفيهاش أخطاء. النسخة الأصلية قبل التعديل
محفوظة على السيرفر في `~/backups/2026-10-29-media/`.

**لو بترفع الكود على السيرفر من نسختك، ادمج التعديلات دي الأول، وإلا هتتمسح.**

## اللي اتغيّر

| الملف | التعديل |
|---|---|
| `app/Http/Controllers/Api/V1/Media/MediaController.php` | جديد. مكتبة وسائط على الـ public disk في `media/{collection}`، من غير جدول |
| `app/Http/Requests/Media/UploadMediaRequest.php` | جديد. صور بس (jpg, png, webp, gif, avif)، والحد الأقصى 5 ميجا. SVG ممنوع لأنه ممكن يشغّل سكربت |
| `database/seeders/MediaPermissionSeeder.php` | جديد. صلاحيات `media.view` و`media.upload` و`media.delete`، وبتتدي لدور المحرر |
| `routes/api.php` | `GET/POST/DELETE /media`، و`POST /upload` بنفس عمل `POST /media`، جوه `auth:sanctum` ومن غير `editor.approval` |
| `StoreBlogSeoRequest` / `UpdateBlogSeoRequest` | `cover_image` بقى يقبل ملف صورة **أو** رابط/مسار نصي |
| `BlogSeoController` | لو `cover_image` ملف بيتحفظ في `media/blog`. والقائمة بقت مترتبة بـ `seo_score` وبعده `id`، وبتحترم `per_page` لحد 100 |
| `BlogSeoResource` | `cover_image` بيرجع رابط كامل لو كان مسار. وإيميل الكاتب بيظهر للمستخدم المسجّل دخول بس |

## النشر

```bash
cd ~/stage && cp -r --parents $(find . -type f -name "*.php" | sed "s|^\./||") ~/domains/api.elyusr.org/public_html/
cd ~/domains/api.elyusr.org/public_html
php artisan db:seed --class=MediaPermissionSeeder --force
php artisan optimize:clear
php artisan route:list --path=api/v1/media
```

## الـ API

- `GET /media?collection=blog&search=` بيرجع `{ data: [{ path, url, name, collection, size, mime_type, last_modified }], total, collections }`
- `POST /media` (multipart: `file`, `collection`) بيرجع `201 { data, url, path }`
- `DELETE /media` بـ JSON `{ "path": "media/blog/x.jpg" }`
- `collection` لازم يكون واحد من: `blog, og, pages, programs, campaigns, general`. والقيمة `blog-media` بتتحوّل لـ `blog`.
- رفع صورة غلاف مع المقال: `POST /blog-seo` أو `POST /blog-seo/{id}` مع `_method=PUT` (multipart)، والحقل `cover_image` يكون ملف. PHP ما بيقراش ملفات multipart في طلب PUT الحقيقي.
