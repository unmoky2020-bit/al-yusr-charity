<?php

namespace App\Support;

use App\Models\Axis;
use App\Models\CaseModel;
use App\Models\Content;
use App\Models\Program;
use App\Models\Story;
use Illuminate\Database\Eloquent\Model;

/**
 * Where database content lives on the public website, and whether it is public at all.
 * One place for the rules used by the content sitemap and by IndexNow.
 */
final class PublicUrls
{
    /** Test cases created for QA are never indexed. */
    private const TEST_CASE_PREFIX = '[تجريبية]';

    public static function site(string $path = '/'): string
    {
        return config('seo.site_url') . '/' . ltrim($path, '/');
    }

    /** Public path of a record, or null when it is not public (draft, hidden, pending…). */
    public static function pathOf(Model $m): ?string
    {
        return match (true) {
            $m instanceof Program => $m->is_active && $m->slug ? '/programs/' . $m->slug : null,
            $m instanceof Axis => $m->is_active && $m->slug ? '/axes/' . $m->slug : null,
            $m instanceof Story => $m->status === 'published' && $m->slug ? '/stories/' . $m->slug : null,
            $m instanceof Content => $m->type === 'article' && $m->status === 'published' && $m->slug ? '/blog/' . $m->slug : null,
            $m instanceof CaseModel => self::caseIsPublic($m) ? '/cases/' . rawurlencode($m->code) : null,
            default => null,
        };
    }

    /**
     * Every public content URL: [path, lastmod (Y-m-d), changefreq, priority].
     *
     * @return array<int, array{path: string, lastmod: string, changefreq: string, priority: string}>
     */
    public static function all(): array
    {
        $rows = [];
        $add = function ($models, string $changefreq, string $priority) use (&$rows) {
            foreach ($models as $m) {
                $path = self::pathOf($m);
                if ($path) {
                    $rows[] = [
                        'path' => $path,
                        'lastmod' => optional($m->updated_at)->format('Y-m-d') ?? now()->format('Y-m-d'),
                        'changefreq' => $changefreq,
                        'priority' => $priority,
                    ];
                }
            }
        };

        $add(Program::query()->where('is_active', true)->get(), 'weekly', '0.85');
        $add(Axis::query()->where('is_active', true)->get(), 'weekly', '0.7');
        $add(CaseModel::query()->where('status', 'approved')->get(), 'weekly', '0.75');
        $add(Story::query()->where('status', 'published')->get(), 'monthly', '0.6');
        $add(Content::query()->where('type', 'article')->where('status', 'published')->get(), 'weekly', '0.7');

        return $rows;
    }

    private static function caseIsPublic(CaseModel $c): bool
    {
        return $c->status === 'approved'
            && filled($c->code)
            && ! str_starts_with((string) $c->title, self::TEST_CASE_PREFIX);
    }
}
