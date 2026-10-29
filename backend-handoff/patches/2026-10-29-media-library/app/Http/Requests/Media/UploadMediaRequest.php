<?php

namespace App\Http\Requests\Media;

use App\Http\Controllers\Api\V1\Media\MediaController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // The admin's blog editor sends "blog-media"; keep it working.
        $aliases = ['blog-media' => 'blog', 'og-images' => 'og'];
        if ($this->filled('collection') && isset($aliases[$this->collection])) {
            $this->merge(['collection' => $aliases[$this->collection]]);
        }
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif,avif', 'max:5120'],
            'collection' => ['nullable', 'string', Rule::in(MediaController::COLLECTIONS)],
        ];
    }
}
