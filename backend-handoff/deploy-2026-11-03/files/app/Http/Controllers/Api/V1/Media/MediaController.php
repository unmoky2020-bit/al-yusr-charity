<?php

namespace App\Http\Controllers\Api\V1\Media;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\UploadMediaRequest;
use App\Support\MediaUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Media library = every image stored on the site (the public disk), with:
 *  - where each file is used (MediaUsage), so unused files can be cleaned safely;
 *  - duplicate detection (same size + same SHA-256), and uploads that reuse an identical file
 *    instead of storing it again;
 *  - "delete" = move to a private trash folder (storage/app/media-trash/…), never a hard delete,
 *    and never for a file the site still uses.
 * New uploads go to media/{collection}/. Older folders (cases/, gallery/, programs/…) are listed too.
 * The public photo gallery (gallery table) is separate: it is the curated list shown on the site,
 * and its rows can point at any file of this library.
 */
class MediaController extends Controller
{
    public const ROOT = 'media';

    public const COLLECTIONS = ['blog', 'og', 'pages', 'programs', 'campaigns', 'cases', 'gallery', 'general'];

    /** Folders of the public disk that hold site images (private uploads such as receipts are never listed). */
    private const LEGACY_FOLDERS = ['articles', 'axes', 'cases', 'contents', 'donation-campaigns', 'gallery', 'homepage', 'programs', 'projects', 'stories'];

    /** Tables whose files are private (IDs, receipts…): those files are never listed or moved. */
    private const PRIVATE_TABLES_RE = '/(document|receipt|donation(?!_campaign)|attachment|case_media|identity)/i';

    private const IMAGE_RE = '/\.(jpe?g|png|webp|gif|avif)$/i';

    private const HASH_CACHE = 'media-hash-index-v1';

    private function disk()
    {
        return Storage::disk('public');
    }

    private function isPrivate(array $uses): bool
    {
        foreach ($uses as $ref) {
            if (preg_match(self::PRIVATE_TABLES_RE, explode('#', $ref)[0])) {
                return true;
            }
        }

        return false;
    }

    private function folderOf(string $path): string
    {
        $parts = explode('/', $path);

        return $parts[0] === self::ROOT ? (self::ROOT . '/' . ($parts[1] ?? 'general')) : $parts[0];
    }

    private function present(string $path, ?array $uses = null): array
    {
        $disk = $this->disk();
        $uses ??= MediaUsage::usesOf($path);
        $parts = explode('/', $path);

        return [
            'path' => $path,
            'url' => $disk->url($path),
            'name' => basename($path),
            'collection' => $parts[0] === self::ROOT ? ($parts[1] ?? 'general') : $parts[0],
            'folder' => $this->folderOf($path),
            'size' => $disk->size($path),
            'mime_type' => $disk->mimeType($path),
            'last_modified' => date(DATE_ATOM, $disk->lastModified($path)),
            'in_use' => count($uses) > 0,
            'used_in' => $uses,
        ];
    }

    /** Every listable image path. */
    private function allPaths(bool $all): array
    {
        $disk = $this->disk();
        $dirs = $all ? array_merge([self::ROOT], self::LEGACY_FOLDERS) : [self::ROOT];
        $paths = [];
        foreach ($dirs as $dir) {
            if ($disk->exists($dir)) {
                foreach ($disk->allFiles($dir) as $p) {
                    if (preg_match(self::IMAGE_RE, $p)) {
                        $paths[] = $p;
                    }
                }
            }
        }

        return array_values(array_unique($paths));
    }

    /** size => [path, …] for every listable image (cached; cleared on upload / delete). */
    private function sizeIndex(): array
    {
        return Cache::remember(self::HASH_CACHE, 3600, function () {
            $index = [];
            foreach ($this->allPaths(true) as $p) {
                $index[(string) $this->disk()->size($p)][] = $p;
            }

            return $index;
        });
    }

    private function forgetIndexes(): void
    {
        Cache::forget(self::HASH_CACHE);
        MediaUsage::forget();
    }

    /** An existing file with exactly this content, or null. */
    private function findIdentical(int $size, string $sha256): ?string
    {
        foreach ($this->sizeIndex()[(string) $size] ?? [] as $p) {
            $full = $this->disk()->path($p);
            if (is_file($full) && hash_file('sha256', $full) === $sha256) {
                return $p;
            }
        }

        return null;
    }

    /**
     * GET /media?scope=all|media&collection=&folder=&search=&usage=used|unused|duplicates
     */
    public function index(Request $request)
    {
        $all = $request->query('scope') === 'all';
        $collection = $request->query('collection');
        $folder = (string) $request->query('folder', '');
        $usage = (string) $request->query('usage', '');

        $paths = $this->allPaths($all || $folder !== '');
        if (in_array($collection, self::COLLECTIONS, true)) {
            $paths = array_filter($paths, fn ($p) => Str::startsWith($p, self::ROOT . '/' . $collection . '/'));
        }
        if ($folder !== '') {
            $paths = array_filter($paths, fn ($p) => $this->folderOf($p) === $folder);
        }

        $map = MediaUsage::map();
        $files = collect($paths)
            ->map(function ($p) use ($map) {
                $uses = MediaUsage::lookup($map, $p);

                return $this->isPrivate($uses) ? null : $this->present($p, $uses);
            })
            ->filter()
            ->when($request->filled('search'), fn ($c) => $c->filter(
                fn ($f) => Str::contains(Str::lower($f['name']), Str::lower((string) $request->search))
            ))
            ->values();

        // Duplicates: same size, then same content. The oldest copy is the original.
        $dupOf = [];
        foreach ($files->groupBy('size') as $group) {
            if ($group->count() < 2) {
                continue;
            }
            $byHash = [];
            foreach ($group->sortBy('last_modified') as $f) {
                $full = $this->disk()->path($f['path']);
                $h = is_file($full) ? hash_file('sha256', $full) : null;
                if (! $h) {
                    continue;
                }
                if (isset($byHash[$h])) {
                    $dupOf[$f['path']] = $byHash[$h];
                } else {
                    $byHash[$h] = $f['path'];
                }
            }
        }
        $files = $files->map(fn ($f) => $f + ['duplicate_of' => $dupOf[$f['path']] ?? null]);

        if ($usage === 'used') {
            $files = $files->where('in_use', true);
        } elseif ($usage === 'unused') {
            $files = $files->where('in_use', false);
        } elseif ($usage === 'duplicates') {
            $files = $files->filter(fn ($f) => $f['duplicate_of'] !== null);
        }
        $files = $files->sortByDesc('last_modified')->values();

        $folders = collect($this->allPaths(true))->map(fn ($p) => $this->folderOf($p))->unique()->sort()->values();

        return response()->json([
            'data' => $files,
            'total' => $files->count(),
            'total_size' => $files->sum('size'),
            'collections' => self::COLLECTIONS,
            'folders' => $folders,
        ]);
    }

    /** GET /media/find?size=&sha256= → the identical file already stored, or 404. */
    public function find(Request $request)
    {
        $data = $request->validate([
            'size' => ['required', 'integer', 'min:1'],
            'sha256' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]+$/'],
        ]);
        $path = $this->findIdentical((int) $data['size'], $data['sha256']);

        return $path
            ? response()->json(['data' => $this->present($path), 'duplicate' => true])
            : response()->json(['message' => 'Not found', 'duplicate' => false], 404);
    }

    public function store(UploadMediaRequest $request)
    {
        $collection = $request->validated('collection') ?? 'general';
        $file = $request->file('file');

        // The same picture is stored once: an identical upload returns the existing file.
        $existing = $this->findIdentical((int) $file->getSize(), hash_file('sha256', $file->getRealPath()));
        if ($existing) {
            return response()->json([
                'message' => 'This image is already in the library',
                'duplicate' => true,
                'data' => $this->present($existing),
                'url' => $this->disk()->url($existing),
                'path' => $existing,
            ], 200);
        }

        $base = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'image';
        $name = now()->format('Ymd-His') . '-' . Str::limit($base, 60, '') . '-' . Str::lower(Str::random(5))
            . '.' . strtolower($file->getClientOriginalExtension() ?: $file->extension());

        $path = $file->storeAs(self::ROOT . '/' . $collection, $name, 'public');
        $this->forgetIndexes();

        return response()->json([
            'message' => 'File uploaded successfully',
            'duplicate' => false,
            'data' => $this->present($path, []),
            'url' => $this->disk()->url($path),
            'path' => $path,
        ], 201);
    }

    /**
     * DELETE /media  { path } or { paths: [] }
     * Moves unused files to storage/app/media-trash/<date>/… (restorable). Used / private files are skipped.
     */
    public function destroy(Request $request)
    {
        $paths = $request->input('paths');
        $paths = is_array($paths) ? $paths : [(string) $request->input('path', '')];
        $paths = array_slice(array_values(array_filter(array_map('strval', $paths))), 0, 200);
        if (! $paths) {
            return response()->json(['message' => 'Invalid path'], 422);
        }

        $allowed = array_merge([self::ROOT], self::LEGACY_FOLDERS);
        $trashed = [];
        $skipped = [];
        MediaUsage::forget(); // decide on fresh usage data
        foreach ($paths as $path) {
            $top = explode('/', $path)[0];
            if (Str::contains($path, '..') || ! in_array($top, $allowed, true) || ! preg_match(self::IMAGE_RE, $path)) {
                $skipped[] = ['path' => $path, 'reason' => 'invalid'];
                continue;
            }
            if (! $this->disk()->exists($path)) {
                $skipped[] = ['path' => $path, 'reason' => 'not_found'];
                continue;
            }
            $uses = MediaUsage::usesOf($path);
            if ($uses) {
                $skipped[] = ['path' => $path, 'reason' => 'in_use', 'used_in' => $uses];
                continue;
            }
            $target = 'media-trash/' . now()->format('Y-m-d') . '/' . $path;
            Storage::disk('local')->makeDirectory(dirname($target));
            if (@rename($this->disk()->path($path), Storage::disk('local')->path($target))) {
                $trashed[] = $path;
            } else {
                $skipped[] = ['path' => $path, 'reason' => 'move_failed'];
            }
        }
        $this->forgetIndexes();

        if (count($paths) === 1 && ! $trashed) {
            $reason = $skipped[0]['reason'] ?? 'invalid';
            $status = ['not_found' => 404, 'in_use' => 409][$reason] ?? 422;

            return response()->json([
                'message' => $reason === 'in_use' ? 'This image is used on the site' : 'Could not delete',
                'skipped' => $skipped,
            ], $status);
        }

        return response()->json([
            'message' => 'Moved to trash',
            'trashed' => $trashed,
            'skipped' => $skipped,
        ]);
    }
}
