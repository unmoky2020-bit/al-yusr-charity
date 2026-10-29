<?php

namespace App\Http\Requests\Case;

use Illuminate\Foundation\Http\FormRequest;

class StoreCaseModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Optional: the server generates CASE-xxxxx when it is missing.
            'code' => [
                'nullable',
                'string',
                'max:255',
                'unique:case_models,code',
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'category_id' => [
                'required',
                'integer',
                'exists:case_categories,id',
            ],

            // المحور
            'axis_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:axes,id',
            ],

            // البرنامج
            'program_id' => [
                'nullable',
                'integer',
                'exists:programs,id',
            ],

            // المشروع
            'project_id' => [
                'nullable',
                'integer',
                'exists:projects,id',
            ],

            // حملة التبرع
            'donation_campaign_id' => [
                'nullable',
                'integer',
                'exists:donation_campaigns,id',
            ],

            'beneficiary_name' => [
                'required',
                'string',
                'max:255',
            ],

            'age' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'governorate' => [
                'required',
                'string',
                'max:255',
            ],

            'city' => [
                'nullable',
                'string',
                'max:255',
            ],

            'target_amount' => [
                'required',
                'numeric',
                'min:0',
            ],

            'deadline' => [
                'nullable',
                'date',
            ],

            'priority' => [
                'required',
                'in:low,medium,high',
            ],

            // An uploaded image, or a URL / storage path (media library).
            'cover_image' => $this->hasFile('cover_image')
                ? ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120']
                : ['nullable', 'string', 'max:2048'],

            'description' => [
                'required',
                'string',
            ],

            'status' => [
                'nullable',
                'in:pending_review,approved,completed,closed,rejected',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            $targets = collect([
                $this->input('program_id'),
                $this->input('project_id'),
                $this->input('donation_campaign_id'),
            ])->filter(fn ($value) => filled($value));

if ($targets->count() > 1) {
    $validator->errors()->add(
        'donation_target',
        'يمكن ربط الحالة ببرنامج أو مشروع أو حملة تبرع واحدة فقط.'
    );
}

        });
    }
}