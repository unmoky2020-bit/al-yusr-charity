<?php

namespace App\Http\Requests\VolunteerCampaign;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    'invited',
                    'pending',
                    'approved',
                    'rejected',
                    'withdrawn',
                    'waitlist',
                    'attended',
                    'noshow',
                ]),
            ],
            'notes' => ['nullable', 'string'],
        ];
    }
}
