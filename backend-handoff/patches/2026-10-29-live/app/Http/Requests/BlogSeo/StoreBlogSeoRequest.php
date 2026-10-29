<?php

namespace App\Http\Requests\BlogSeo;

use Illuminate\Foundation\Http\FormRequest;

class StoreBlogSeoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required','string','max:255'],
            'title_ar' => ['required','string','max:255'],
            'title_en' => ['nullable','string','max:255'],
            'summary_ar' => ['nullable','string'],
            'summary_en' => ['nullable','string'],
            'content_ar' => ['required','string'],
            'content_en' => ['nullable','string'],
            // An uploaded image file, or a URL / storage path string.
            'cover_image' => $this->hasFile('cover_image')
                ? ['nullable','image','mimes:jpg,jpeg,png,webp,gif,avif','max:5120']
                : ['nullable','string','max:2048'],
            'svg' => ['nullable','string'],
            'author_id' => ['nullable','integer','exists:users,id'],
            'primary_keyword' => ['nullable','string','max:255'],
            'category_ar' => ['nullable','string','max:255'],
            'category_en' => ['nullable','string','max:255'],
            'tags_ar' => ['nullable','array'],
            'tags_en' => ['nullable','array'],
            'og_image' => ['nullable','string','max:2048'],
            'og_image_url' => ['nullable','string','max:2048'],
            'schema_type' => ['nullable','string','max:100'],
            'schema_data' => ['nullable','array'],
            'og_data' => ['nullable','array'],
            'workflow_status' => ['nullable','in:draft,review,published,scheduled,archived'],
            'scheduled_at' => ['nullable','date'],
        ];
    }
}
