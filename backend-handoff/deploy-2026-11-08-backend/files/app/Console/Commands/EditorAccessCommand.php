<?php

namespace App\Console\Commands;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Console\Command;

/**
 * php artisan yusr:editor-access                 → shows what the Editor role can do
 * php artisan yusr:editor-access --blog-only     → Editor = blog only (+ the media library for
 *                                                  article images); saves the old list first
 * php artisan yusr:editor-access --restore=FILE  → puts a saved list back
 *
 * Also makes sure the add-on role «محرر حالات» (case-editor) exists: the super admin gives it to an
 * editor from the user's page to let them add and edit cases. Everything an editor submits still
 * goes through «مراجعة واعتماد التعديلات» (editor.approval middleware) before it is published.
 */
class EditorAccessCommand extends Command
{
    protected $signature = 'yusr:editor-access {--blog-only} {--restore=} {--backup-dir=}';

    protected $description = 'Editor role: show, set to blog-only, or restore its permissions';

    private const BLOG_ONLY = [
        'blog_seo.view', 'blog_seo.create', 'blog_seo.update', 'blog_seo.delete',
        'media.view', 'media.upload',
    ];

    private const CASE_EDITOR = [
        'cases.view', 'cases.create', 'cases.update',
        'case_categories.view',
        'media.view', 'media.upload',
    ];

    public function handle(): int
    {
        $editor = Role::where('slug', 'editor')->first();
        if (! $editor) {
            $this->error('مفيش دور بالـ slug «editor».');

            return self::FAILURE;
        }

        if ($file = $this->option('restore')) {
            $slugs = json_decode((string) @file_get_contents($file), true);
            if (! is_array($slugs)) {
                $this->error("الملف مش مقروء: {$file}");

                return self::FAILURE;
            }
            $this->sync($editor, $slugs);
            $this->info('رجعت صلاحيات المحرر من ' . $file);

            return self::SUCCESS;
        }

        $current = $editor->permissions()->pluck('slug')->sort()->values()->all();
        $this->line('صلاحيات المحرر دلوقتي (' . count($current) . '): ' . (implode(', ', $current) ?: '—'));

        if (! $this->option('blog-only')) {
            return self::SUCCESS;
        }

        $dir = rtrim((string) ($this->option('backup-dir') ?: storage_path('app')), '/');
        @mkdir($dir, 0775, true);
        $backup = $dir . '/editor-permissions-before-' . now()->format('Ymd-His') . '.json';
        file_put_contents($backup, json_encode($current, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $this->sync($editor, self::BLOG_ONLY);
        $after = $editor->permissions()->pluck('slug')->sort()->values()->all();
        $this->info('المحرر بقى للمدونة بس (' . count($after) . '): ' . implode(', ', $after));
        $this->line("النسخة القديمة: {$backup}");
        $this->line("للرجوع: php artisan yusr:editor-access --restore={$backup}");

        $caseEditor = Role::firstOrCreate(
            ['slug' => 'case-editor'],
            ['name' => 'محرر حالات', 'description' => 'إضافة: إضافة الحالات وتعديلها (بموافقة المدير). يُعطى مع دور المحرر.']
        );
        if ($caseEditor->wasRecentlyCreated || $caseEditor->permissions()->count() === 0) {
            $this->sync($caseEditor, self::CASE_EDITOR);
        }
        $this->line('دور «' . $caseEditor->name . '» (case-editor): ' . implode(', ', $caseEditor->permissions()->pluck('slug')->sort()->all()));

        return self::SUCCESS;
    }

    /** Sync a role to the permissions with these slugs; slugs missing on the server are listed. */
    private function sync(Role $role, array $slugs): void
    {
        $found = Permission::whereIn('slug', $slugs)->pluck('id', 'slug');
        $missing = array_values(array_diff($slugs, $found->keys()->all()));
        if ($missing) {
            $this->warn('صلاحيات مش موجودة على السيرفر (اتسابت): ' . implode(', ', $missing));
        }
        $role->permissions()->sync($found->values()->all());
    }
}
