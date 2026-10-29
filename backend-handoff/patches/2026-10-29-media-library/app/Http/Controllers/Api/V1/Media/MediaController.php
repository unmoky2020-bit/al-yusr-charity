<?php

namespace App\Http\Controllers\Api\V1\Media;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\UploadMediaRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Media library: images uploaded for articles, pages and OG cards.
 * Files live on the public disk under media/{collection}/ — no database table,
 * the folder is the source of truth. The public gallery (gallery table) is separate.
 */
class MediaController extends Controller
{
    public const ROOT = 'media';

    public const COLLECTIONS = ['blog', 'og', 'pages', 'programs', 'campaigns', 'general'];

    private function disk()
    {
        return Storage::disk('public');
    }

    private function present(string $path): array
    {
        $disk = $this->disk();

        return [
            'path' => $path,
            'url' => $disk->url($path),
            'name' => basename($path),
            'collection' => explode('/', $path)[1] ?? 'general',
            'size' => $disk->size($path),
            'mime_type' => $disk->mimeType($path),
            'last_modified' => date(DATE_ATOM, $disk->lastModified($path)),
        ];
    }

    public function index(Request $request)
    {
        $collection = $request->query('collection');
        $dir = in_array($collection, self::COLLECTIONS, true)
            ? self::ROOT . '/' . $collection
            : self::ROOT;

        $files = collect($this->disk()->allFiles($dir))
            ->filter(fn ($p) => preg_match('/\.(jpe?g|png|webp|gif|avif)$/i', $p))
            ->map(fn ($p) => $this->present($p))
            ->when($request->filled('search'), fn ($c) => $c->filter(
                fn ($f) => Str::contains(Str::lower($f['name']), Str::lower($request->search))
            ))
            ->sortByDesc('last_modified')
            ->values();

        return response()->json([
            'data' => $files,
            'total' => $files->count(),
            'collections' => self::COLLECTIONS,
        ]);
    }

    public function store(UploadMediaRequest $request)
    {
        $collection = $request->validated('collection') ?? 'general';
        $file = $request->file('file');

        $base = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'image';
        $name = now()->format('Ymd-His') . '-' . Str::limit($base, 60, '') . '-' . Str::lower(Str::random(5))
            . '.' . strtolower($file->getClientOriginalExtension() ?: $file->extension());

        $path = $file->storeAs(self::ROOT . '/' . $collection, $name, 'public');

        return response()->json([
            'message' => 'File uploaded successfully',
            'data' => $this->present($path),
            'url' => $this->disk()->url($path),
            'path' => $path,
        ], 201);
    }

    public function destroy(Request $request)
    {
        $path = (string) $request->input('path', '');

        // Only files inside the media root, no traversal.
        if (!Str::startsWith($path, self::ROOT . '/') || Str::contains($path, '..')) {
            return response()->json(['message' => 'Invalid path'], 422);
        }

        if (!$this->disk()->exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $this->disk()->delete($path);

        return response()->json(['message' => 'Deleted Successfully']);
    }
}
