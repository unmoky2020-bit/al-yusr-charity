<?php

namespace App\Support;

use App\Models\ContentChangeRequest;

/**
 * Words for a content change request: which section it touches («المدونة»), what it does («تعديل»),
 * and the dashboard page of that section. The section comes from the route (api/v1/<section>/…):
 * the stored `module` is "v1" for most rows, so it can't be trusted on its own.
 */
class ChangeRequestLabel
{
    private const SECTIONS = [
        'blog-seo' => ['المدونة', '/admin/blog'],
        'blog' => ['المدونة', '/admin/blog'],
        'articles' => ['المدونة', '/admin/blog'],
        'cases' => ['الحالات', '/admin/cases'],
        'programs' => ['البرامج', '/admin/programs'],
        'projects' => ['المشاريع', '/admin/projects'],
        'donation-campaigns' => ['الحملات', '/admin/donation-campaigns'],
        'stories' => ['قصص الأثر', '/admin/stories'],
        'contents' => ['محتوى الموقع', '/admin/content'],
        'faqs' => ['الأسئلة الشائعة', '/admin/faqs'],
        'faq-categories' => ['الأسئلة الشائعة', '/admin/faqs'],
        'gallery' => ['معرض الصور', '/admin/gallery'],
        'axes' => ['محاور رسالتنا', '/admin/axes'],
        'about-us' => ['من نحن', '/admin/about-us'],
        'homepage' => ['الصفحة الرئيسية', '/admin/homepage-content'],
        'seasons' => ['المواسم', '/admin/seasons'],
        'media' => ['مكتبة الوسائط', '/admin/media'],
        'upload' => ['مكتبة الوسائط', '/admin/media'],
        'donors' => ['المتبرعين', '/admin/donors'],
    ];

    private const ACTIONS = ['create' => 'إضافة', 'update' => 'تعديل', 'delete' => 'حذف'];

    public static function isEditorSignUp(ContentChangeRequest $r): bool
    {
        return $r->module === 'editor-registration';
    }

    /** "blog-seo" from "api/v1/blog-seo/12" (or the stored module when the route is missing). */
    public static function key(ContentChangeRequest $r): string
    {
        $parts = array_values(array_filter(explode('/', (string) $r->route_uri)));
        $i = array_search('v1', $parts, true);
        $key = $i !== false ? ($parts[$i + 1] ?? '') : '';

        return $key !== '' ? $key : (string) $r->module;
    }

    /** «تعديل في المدونة» */
    public static function describe(ContentChangeRequest $r): string
    {
        $section = self::SECTIONS[self::key($r)][0] ?? str_replace(['-', '_'], ' ', self::key($r));
        $action = self::ACTIONS[$r->action] ?? 'تغيير';

        return "{$action} في {$section}";
    }

    /** The dashboard page of the section, or null. */
    public static function sectionUrl(ContentChangeRequest $r): ?string
    {
        return self::SECTIONS[self::key($r)][1] ?? null;
    }
}
