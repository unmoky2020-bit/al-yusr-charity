<?php

namespace App\Http\Controllers\Api\V1\Gallery;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gallery\StoreGalleryImageRequest;
use App\Http\Requests\Gallery\UpdateGalleryImageRequest;
use App\Http\Resources\GalleryImageResource;
use App\Models\GalleryImage;
use Illuminate\Http\Request;

class GalleryImageController extends Controller
{
    public function index(Request $request)
    {
        $query = GalleryImage::latest('sort_order')->latest();

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        if ($request->filled('program')) {
            $query->where('program', $request->program);
        }

        if ($request->filled('is_public')) {
            $query->where('is_public', filter_var($request->is_public, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('title_ar', 'like', "%{$search}%")
                    ->orWhere('title_en', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('program', 'like', "%{$search}%");
            });
        }

        return GalleryImageResource::collection(
            $query->paginate(\App\Support\PerPage::from(request(), 15))
        );
    }

    public function store(StoreGalleryImageRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('gallery', 'public');
        }

        $data['created_by'] = $request->user()->id;

        return new GalleryImageResource(
            GalleryImage::create($data)
        );
    }

    // The route parameter is {gallery} (apiResource('gallery')): the variable must be $gallery for
    // Laravel to load the row. With another name every call got an empty model and did nothing.
    public function show(GalleryImage $gallery)
    {
        return new GalleryImageResource($gallery);
    }

    public function update(
        UpdateGalleryImageRequest $request,
        GalleryImage $gallery
    ) {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            // The old file stays: pages and the media library may use it (the library cleans unused files).
            $data['image'] = $request->file('image')->store('gallery', 'public');
        }

        $gallery->update($data);

        return new GalleryImageResource(
            $gallery->fresh()
        );
    }

    /** Removes the photo from the gallery; the stored file stays in the media library. */
    public function destroy(GalleryImage $gallery)
    {
        $gallery->delete();

        return response()->json([
            'message' => 'Gallery image deleted successfully',
        ]);
    }

    public function statistics()
    {
        return response()->json([
            'total' => GalleryImage::count(),
            'published' => GalleryImage::where('is_public', true)->count(),
            'hidden' => GalleryImage::where('is_public', false)->count(),
            'featured' => GalleryImage::where('is_featured', true)->count(),
        ]);
    }
}
