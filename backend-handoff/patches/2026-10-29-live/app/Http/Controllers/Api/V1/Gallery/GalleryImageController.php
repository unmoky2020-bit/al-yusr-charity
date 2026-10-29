<?php

namespace App\Http\Controllers\Api\V1\Gallery;

use App\Http\Controllers\Controller;
use App\Http\Requests\Gallery\StoreGalleryImageRequest;
use App\Http\Requests\Gallery\UpdateGalleryImageRequest;
use App\Http\Resources\GalleryImageResource;
use App\Models\GalleryImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    public function show(GalleryImage $galleryImage)
    {
        return new GalleryImageResource($galleryImage);
    }

    public function update(
        UpdateGalleryImageRequest $request,
        GalleryImage $galleryImage
    ) {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            if ($galleryImage->image) {
                Storage::disk('public')->delete($galleryImage->image);
            }

            $data['image'] = $request->file('image')->store('gallery', 'public');
        }

        $galleryImage->update($data);

        return new GalleryImageResource(
            $galleryImage->fresh()
        );
    }

    public function destroy(GalleryImage $galleryImage)
    {
        if ($galleryImage->image) {
            Storage::disk('public')->delete($galleryImage->image);
        }

        $galleryImage->delete();

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
