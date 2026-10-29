<?php

namespace App\Http\Requests\Case;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCaseModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $case = $this->route('case');
        $caseId = is_object($case) ? $case->id : $case;

        return [
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('case_models', 'code')->ignore($caseId),
                ],

            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'category_id' => [
                'sometimes',
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
                'sometimes',
                'nullable',
                'integer',
                'exists:programs,id',
            ],

            // المشروع
            'project_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:projects,id',
            ],

            // حملة التبرع
            'donation_campaign_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:donation_campaigns,id',
            ],

            'beneficiary_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'age' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],

            'governorate' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'city' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'target_amount' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],

            'deadline' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'priority' => [
                'sometimes',
                'required',
                'in:low,medium,high',
            ],

            // An uploaded image, or a URL / storage path (media library).
            'cover_image' => $this->hasFile('cover_image')
                ? ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120']
                : ['sometimes', 'nullable', 'string', 'max:2048'],

            'description' => [
                'sometimes',
                'required',
                'string',
            ],

            'status' => [
                'sometimes',
                'nullable',
                'in:pending_review,approved,completed,closed,rejected',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            // لو المستخدم بيغيّر الهدف، لازم يكون هدف واحد فقط
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