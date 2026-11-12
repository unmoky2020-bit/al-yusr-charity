<?php

namespace App\Http\Controllers\Api\V1\Extras;

use App\Http\Controllers\Controller;
use App\Models\Extras\PackageImage;
use App\Support\StaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Pictures of the donation packages (الأسهم / الباقات):
 *   GET    /package-images                      public map package_id → {image, alt_ar, alt_en}
 *   PUT    /admin/package-images/{package}      set / replace (body: image, alt_ar?, alt_en?)
 *   DELETE /admin/package-images/{package}      remove
 * Who may write: whoever may update the package's owner (programs / projects / donation_campaigns
 * .update); the super admin always. The packages table itself is never written.
 */
class PackageImageController extends Controller
{
    private const CACHE_KEY = 'extras.package_images.v1';

    private const OWNER_PERMISSION = [
        'donation_campaign_id' => 'donation_campaigns.update',
        'project_id' => 'projects.update',
        'program_id' => 'programs.update',
    ];

    public function index(): JsonResponse
    {
        $map = Cache::remember(self::CACHE_KEY, 300, function () {
            $active = DB::table('program_donation_packages')->pluck('id')->flip();

            return PackageImage::query()->get()
                ->filter(fn (PackageImage $p) => $active->has($p->package_id))
                ->mapWithKeys(fn (PackageImage $p) => [(string) $p->package_id => [
                    'image' => self::absolute($p->image),
                    'alt_ar' => $p->alt_ar,
                    'alt_en' => $p->alt_en,
                ]])->all();
        });

        return response()->json(['data' => (object) $map]);
    }

    public function update(Request $request, int $package): JsonResponse
    {
        $row = $this->packageOrFail($package);
        $this->authorizeOwner($request, $row);

        $data = $request->validate([
            'image' => ['required', 'string', 'max:2048', 'regex:#^(https://|/storage/)#'],
            'alt_ar' => ['nullable', 'string', 'max:300'],
            'alt_en' => ['nullable', 'string', 'max:300'],
        ], [
            'image.required' => 'اختار صورة.',
            'image.regex' => 'رابط الصورة لازم يكون من مكتبة الوسائط أو https.',
            'alt_ar.max' => 'الوصف أطول من 300 حرف.',
        ]);

        $img = PackageImage::updateOrCreate(
            ['package_id' => $package],
            [
                'image' => $data['image'],
                'alt_ar' => $data['alt_ar'] ?? ($row->name_ar ?? null),
                'alt_en' => $data['alt_en'] ?? ($row->name_en ?? null),
                'updated_by' => optional($request->user())->id,
            ],
        );
        Cache::forget(self::CACHE_KEY);

        return response()->json(['data' => [
            'package_id' => $package,
            'image' => self::absolute($img->image),
            'alt_ar' => $img->alt_ar,
            'alt_en' => $img->alt_en,
        ]]);
    }

    public function destroy(Request $request, int $package): JsonResponse
    {
        $row = $this->packageOrFail($package);
        $this->authorizeOwner($request, $row);
        PackageImage::where('package_id', $package)->delete();
        Cache::forget(self::CACHE_KEY);

        return response()->json(['data' => ['package_id' => $package, 'image' => null]]);
    }

    private function packageOrFail(int $id): object
    {
        $row = DB::table('program_donation_packages')->where('id', $id)->first();
        abort_if(! $row, 404, 'الباقة مش موجودة.');

        return $row;
    }

    private function authorizeOwner(Request $request, object $row): void
    {
        $user = $request->user();
        foreach (self::OWNER_PERMISSION as $column => $permission) {
            if (! empty($row->{$column}) && StaffAccess::has($user, $permission)) {
                return;
            }
        }
        // A package with no owner column set: only the program editors.
        $hasOwner = collect(array_keys(self::OWNER_PERMISSION))->contains(fn ($c) => ! empty($row->{$c}));
        if (! $hasOwner && StaffAccess::has($user, 'programs.update')) {
            return;
        }
        abort(403, 'مش عندك صلاحية تعديل الباقة دي.');
    }

    /** /storage/… → absolute URL on our public disk (avoids the old storage/storage double path). */
    private static function absolute(string $url): string
    {
        if (str_starts_with($url, '/storage/')) {
            return Storage::disk('public')->url(substr($url, strlen('/storage/')));
        }

        return $url;
    }
}
