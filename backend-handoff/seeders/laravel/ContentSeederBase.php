<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Shared logic for the content seeders generated from the frontend static data.
 *
 * Rules (حماية بيانات الأدمن):
 *  - A row is matched by a natural key (slug, or parent id + key, ...).
 *  - Missing row  -> inserted.
 *  - Existing row -> ONLY columns that are currently NULL / '' / [] / {} are filled. Nothing the admin edited is overwritten.
 *  - Columns that do not exist in the table are skipped silently, so the seeders run before or after the
 *    "new columns" migrations. Keys under `extra` in the JSON are used when a column with the same name exists.
 *  - Tables that do not exist yet are skipped with a warning.
 *  - Image values in the JSON are frontend file paths (e.g. "src/assets/poster-meat.png"). If the file exists in
 *    database/seeders/assets/<basename> it is copied to the public disk under <folder>/<basename> and that path is stored;
 *    otherwise the image column is left untouched.
 */
abstract class ContentSeederBase extends Seeder
{
    /** Directory holding the exported JSON files. */
    protected string $dataDir;

    /** Directory holding the image files copied from the frontend's src/assets (optional). */
    protected string $assetsDir;

    /** @var array<string, string[]> */
    private static array $columnCache = [];

    public function __construct()
    {
        $this->dataDir = database_path('seeders/data');
        $this->assetsDir = database_path('seeders/assets');
    }

    /** @return array<int, array<string, mixed>>|array<string, mixed> */
    protected function json(string $name): array
    {
        $file = $this->dataDir . DIRECTORY_SEPARATOR . $name . '.json';
        if (! File::exists($file)) {
            $this->warn("missing data file {$name}.json — skipped");

            return [];
        }

        return json_decode(File::get($file), true, 512, JSON_THROW_ON_ERROR);
    }

    protected function tableReady(string $table): bool
    {
        if (Schema::hasTable($table)) {
            return true;
        }
        $this->warn("table `{$table}` does not exist — skipped (راجع 03-seeders.md: جدول جديد مطلوب)");

        return false;
    }

    /** @return string[] */
    protected function columns(string $table): array
    {
        return self::$columnCache[$table] ??= Schema::getColumnListing($table);
    }

    protected function hasColumn(string $table, string $column): bool
    {
        return in_array($column, $this->columns($table), true);
    }

    protected function isEmptyValue(mixed $v): bool
    {
        if ($v === null) {
            return true;
        }
        if (is_string($v)) {
            $t = trim($v);

            return $t === '' || $t === '[]' || $t === '{}' || $t === 'null';
        }
        if (is_array($v)) {
            return count($v) === 0;
        }

        return false;
    }

    /**
     * Flatten `extra` into the row, drop unknown columns, copy images, encode arrays as JSON.
     *
     * @param  array<string, mixed>  $row
     * @param  array<string, string>  $imageColumns  column => storage folder
     * @return array<string, mixed>
     */
    protected function prepare(string $table, array $row, array $imageColumns = []): array
    {
        $extra = $row['extra'] ?? [];
        unset($row['extra']);
        if (is_array($extra)) {
            foreach ($extra as $k => $v) {
                if (! array_key_exists($k, $row)) {
                    $row[$k] = $v;
                }
            }
            // keep the whole bag when the table has an `extra` JSON column
            if ($this->hasColumn($table, 'extra')) {
                $row['extra'] = $extra;
            }
        }

        $out = [];
        foreach ($row as $col => $value) {
            if (! $this->hasColumn($table, $col)) {
                continue;
            }
            if (isset($imageColumns[$col])) {
                $value = $this->storeImage($value, $imageColumns[$col]);
                if ($value === null) {
                    continue;
                }
            }
            if (is_bool($value)) {
                $value = $value ? 1 : 0;
            } elseif (is_array($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }
            $out[$col] = $value;
        }

        return $out;
    }

    /** Copy a frontend asset to the public disk. Returns the stored relative path or null. */
    protected function storeImage(mixed $file, string $folder): ?string
    {
        if (! is_string($file) || $file === '') {
            return null;
        }
        $base = basename($file);
        $src = $this->assetsDir . DIRECTORY_SEPARATOR . $base;
        if (! File::exists($src)) {
            return null;
        }
        $dest = trim($folder, '/') . '/' . $base;
        if (! Storage::disk('public')->exists($dest)) {
            Storage::disk('public')->put($dest, File::get($src));
        }

        return $dest;
    }

    protected function seedUserId(): ?int
    {
        static $id = false;
        if ($id === false) {
            $id = env('SEED_USER_ID') ? (int) env('SEED_USER_ID') : (Schema::hasTable('users') ? DB::table('users')->min('id') : null);
        }

        return $id;
    }

    /**
     * Insert, or fill only the empty columns of an existing row.
     *
     * @param  array<string, mixed>  $key  natural key (column => value), already in DB form
     * @param  array<string, mixed>  $row  JSON row (may contain `extra`)
     * @param  array<string, string>  $imageColumns
     * @return int|null id of the row
     */
    protected function upsertFillEmpty(string $table, array $key, array $row, array $imageColumns = []): ?int
    {
        $data = $this->prepare($table, $row, $imageColumns);
        foreach (array_keys($key) as $k) {
            unset($data[$k]);
        }
        $now = now();
        $existing = DB::table($table)->where($key)->first();

        if (! $existing) {
            $insert = $key + $data;
            foreach (['created_by', 'author_id'] as $owner) {
                if ($this->hasColumn($table, $owner) && ! isset($insert[$owner]) && $this->seedUserId()) {
                    $insert[$owner] = $this->seedUserId();
                }
            }
            if ($this->hasColumn($table, 'created_at')) {
                $insert['created_at'] = $now;
            }
            if ($this->hasColumn($table, 'updated_at')) {
                $insert['updated_at'] = $now;
            }
            $this->counter['inserted']++;

            return (int) DB::table($table)->insertGetId($insert);
        }

        $updates = [];
        foreach ($data as $col => $value) {
            if ($this->isEmptyValue($existing->{$col} ?? null) && ! $this->isEmptyValue($value)) {
                $updates[$col] = $value;
            }
        }
        if ($updates) {
            if ($this->hasColumn($table, 'updated_at')) {
                $updates['updated_at'] = $now;
            }
            DB::table($table)->where('id', $existing->id)->update($updates);
            $this->counter['filled']++;
        } else {
            $this->counter['unchanged']++;
        }

        return (int) $existing->id;
    }

    /** Resolve a parent id by slug, then by `landing_slug`, then inside an `aliases` JSON column. */
    protected function idBySlug(string $table, ?string $slug): ?int
    {
        if (! $slug || ! Schema::hasTable($table)) {
            return null;
        }
        $id = DB::table($table)->where('slug', $slug)->value('id');
        if (! $id && $this->hasColumn($table, 'landing_slug')) {
            $id = DB::table($table)->where('landing_slug', $slug)->value('id');
        }
        if (! $id && $this->hasColumn($table, 'aliases')) {
            $id = DB::table($table)->whereJsonContains('aliases', $slug)->value('id');
        }

        return $id ? (int) $id : null;
    }

    /** @var array<string, int> */
    protected array $counter = ['inserted' => 0, 'filled' => 0, 'unchanged' => 0];

    protected function report(string $table): void
    {
        $c = $this->counter;
        $this->command?->info(sprintf('%-34s inserted %d · filled-empty %d · unchanged %d', $table, $c['inserted'], $c['filled'], $c['unchanged']));
        $this->counter = ['inserted' => 0, 'filled' => 0, 'unchanged' => 0];
    }

    protected function warn(string $msg): void
    {
        $this->command?->warn('  ' . static::class . ': ' . $msg);
    }
}
