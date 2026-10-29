<?php

namespace App\Http\Requests\BlogSeo;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBlogSeoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['sometimes','string','max:255'],
            'title_ar' => ['sometimes','string','max:255'],
            'title_en' => ['sometimes','nullable','string','max:255'],
            'summary_ar' => ['sometimes','nullable','string'],
            'summary_en' => ['sometimes','nullable','string'],
            'content_ar' => ['sometimes','string'],
            'content_en' => ['sometimes','nullable','string'],
            // An uploaded image file, or a URL / storage path string.
            'cover_image' => $this->hasFile('cover_image')
                ? ['sometimes','nullable','image','mimes:jpg,jpeg,png,webp,gif,avif','max:5120']
                : ['sometimes','nullable','string','max:2048'],
            'svg' => ['sometimes','nullable','string'],
            'author_id' => ['sometimes','nullable','integer','exists:users,id'],
            'primary_keyword' => ['sometimes','nullable','string','max:255'],
            'category_ar' => ['sometimes','nullable','string','max:255'],
            'category_en' => ['sometimes','nullable','string','max:255'],
            'tags_ar' => ['sometimes','nullable','array'],
            'tags_en' => ['sometimes','nullable','array'],
            'og_image' => ['sometimes','nullable','string','max:2048'],
            'og_image_url' => ['sometimes','nullable','string','max:2048'],
            'schema_type' => ['sometimes','nullable','string','max:100'],
            'schema_data' => ['sometimes','nullable','array'],
            'og_data' => ['sometimes','nullable','array'],
            'workflow_status' => ['sometimes','in:draft,review,published,scheduled,archived'],
            'scheduled_at' => ['sometimes','nullable','date'],
        ];
    }
}
