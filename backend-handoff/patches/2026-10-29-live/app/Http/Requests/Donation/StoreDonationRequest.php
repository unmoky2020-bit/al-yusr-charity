<?php

namespace App\Http\Requests\Donation;

use App\Models\Program;
use App\Models\Project;
use App\Models\DonationCampaign;
use App\Models\CaseModel;
use App\Models\ProgramDonationPackage;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDonationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Name is optional (empty = «فاعل خير»); a guest must leave a phone number so the
            // foundation can confirm the donation. The donor is resolved server-side (DonorResolver).
            'name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'phone' => [
                Rule::requiredIf(fn () => ! $this->user('sanctum')),
                'nullable',
                'string',
                'regex:/^\+?[0-9٠-٩\s\-()]{8,20}$/u',
            ],

            'address' => [
                'nullable',
                'string',
                'max:500',
            ],

            'program_id' => [
                'nullable',
                'integer',
                'exists:programs,id',
            ],

            'project_id' => [
                'nullable',
                'integer',
                'exists:projects,id',
            ],

            'donation_campaign_id' => [
                'nullable',
                'integer',
                'exists:donation_campaigns,id',
            ],

            'case_id' => [
                'nullable',
                'integer',
                'exists:case_models,id',
            ],

            'donation_package_id' => [
                'nullable',
                'integer',
                'exists:program_donation_packages,id',
            ],

            'payment_method_id' => [
                'required',
                'integer',
                'exists:payment_methods,id',
            ],

            'payment_reference' => [
                'nullable',
                'string',
                'max:255',
            ],

            'payment_receipt' => [
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp,pdf',
                'max:5120',
            ],

            'payment_details' => [
                'nullable',
                'array',
            ],

            'amount' => [
                'required',
                'numeric',
                'min:1',
            ],

            'pickup_governorate' => [
                'nullable',
                'string',
                'max:255',
            ],

            'pickup_city' => [
                'nullable',
                'string',
                'max:255',
            ],

            'pickup_address' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'pickup_preferred_time' => [
                'nullable',
                'string',
                'max:255',
            ],

            'payment_method' => [
                'nullable',
                'in:cash,visa,bank',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'رقم الهاتف مطلوب عشان نقدر نأكد تبرعك.',
            'phone.regex' => 'رقم الهاتف غير صحيح.',
            'email.email' => 'البريد الإلكتروني غير صحيح.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            /*
            |--------------------------------------------------------------------------
            | Validate the donation target
            |--------------------------------------------------------------------------
            | Allowed:
            | 1. Program only
            | 2. Project only
            | 3. Donation campaign only
            | 4. Case only (including a general case)
            | 5. A case together with its matching parent target
            */

            $topLevelTargets = collect([
                'program_id' => $this->input('program_id'),
                'project_id' => $this->input('project_id'),
                'donation_campaign_id' => $this->input(
                    'donation_campaign_id'
                ),
            ])->filter(
                fn ($value) => filled($value)
            );

            $hasCase = $this->filled('case_id');

            // Reject requests with no target at all.
            if (
                $topLevelTargets->isEmpty() &&
                !$hasCase
            ) {
                $validator->errors()->add(
                    'donation_target',
                    'يجب اختيار حالة أو برنامج أو مشروع أو حملة تبرع.'
                );

                return;
            }

            // Only one top-level target may be selected.
            if ($topLevelTargets->count() > 1) {
                $validator->errors()->add(
                    'donation_target',
                    'يجب اختيار برنامج أو مشروع أو حملة تبرع واحدة فقط.'
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Validate program availability
            |--------------------------------------------------------------------------
            */

            if ($this->filled('program_id')) {
                $program = Program::with('seasons')
                    ->find($this->input('program_id'));

                if (
                    !$program ||
                    !$program->is_active ||
                    !$program->donation_available
                ) {
                    $validator->errors()->add(
                        'program_id',
                        'هذا البرنامج غير متاح للتبرع حاليًا.'
                    );
                } else {
                    // If the program has seasons, at least one must be available.
                    if (
                        $program->seasons->isNotEmpty() &&
                        !$program->seasons->contains(
                            fn ($season) =>
                                $season->is_active &&
                                $season->donation_available
                        )
                    ) {
                        $validator->errors()->add(
                            'program_id',
                            'موسم هذا البرنامج غير متاح للتبرع حاليًا.'
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Validate project availability and remaining target
            |--------------------------------------------------------------------------
            */

            if ($this->filled('project_id')) {
                $project = Project::find(
                    $this->input('project_id')
                );

                if (!$project || !$project->is_active) {
                    $validator->errors()->add(
                        'project_id',
                        'هذا المشروع غير متاح للتبرع حاليًا.'
                    );
                } elseif (
                    (float) $project->target_amount > 0 && // 0 / empty = open project without a target
                    (float) $project->collected_amount >=
                        (float) $project->target_amount
                ) {
                    $validator->errors()->add(
                        'project_id',
                        'اكتمل المبلغ المستهدف لهذا المشروع ولا يستقبل تبرعات جديدة.'
                    );
                } elseif (
                    (float) $project->target_amount > 0 && // 0 / empty = open project without a target
                    (float) $this->input('amount', 0) >
                        (
                            (float) $project->target_amount -
                            (float) $project->collected_amount
                        )
                ) {
                    $validator->errors()->add(
                        'amount',
                        'مبلغ التبرع أكبر من المبلغ المتبقي لتحقيق هدف المشروع.'
                    );
                }
            }
            
            /*
|--------------------------------------------------------------------------
| Validate Donation Campaign Availability and Remaining Target
|--------------------------------------------------------------------------
*/

if ($this->filled('donation_campaign_id')) {
    $campaign = DonationCampaign::find(
        $this->input('donation_campaign_id')
    );

    if (!$campaign) {
        $validator->errors()->add(
            'donation_campaign_id',
            'حملة التبرع غير موجودة.'
        );
    } elseif (
        !$campaign->is_active ||
        !$campaign->donation_available
    ) {
        $validator->errors()->add(
            'donation_campaign_id',
            'حملة التبرع غير متاحة حاليًا.'
        );
    } else {
        // إجمالي التبرعات المدفوعة للحملة.
        $collectedAmount = (float) $campaign->donations()
            ->where('status', 'paid')
            ->sum('amount');

        $targetAmount = (float) $campaign->target_amount;

        // رفض التبرع لو الحملة وصلت للهدف.
        if (
            $targetAmount > 0 &&
            $collectedAmount >= $targetAmount
        ) {
            $validator->errors()->add(
                'donation_campaign_id',
                'اكتمل المبلغ المستهدف لهذه الحملة.'
            );
        } elseif (
            $targetAmount > 0 &&
            (float) $this->input('amount', 0) >
                ($targetAmount - $collectedAmount)
        ) {
            $validator->errors()->add(
                'amount',
                'مبلغ التبرع أكبر من المبلغ المتبقي للحملة.'
            );
        }
    }
}
            /*
            |--------------------------------------------------------------------------
            | Validate case availability and remaining target
            |--------------------------------------------------------------------------
            */

            if ($hasCase) {
                $case = CaseModel::find(
                    $this->input('case_id')
                );

                if (!$case) {
                    $validator->errors()->add(
                        'case_id',
                        'الحالة المختارة غير موجودة.'
                    );

                    return;
                }

                // If a parent target was also supplied, verify the relationship.
                if (
                    $this->filled('program_id') &&
                    (int) $case->program_id !==
                        (int) $this->input('program_id')
                ) {
                    $validator->errors()->add(
                        'case_id',
                        'الحالة المختارة لا تتبع البرنامج المحدد.'
                    );
                }

                if (
                    $this->filled('project_id') &&
                    (int) $case->project_id !==
                        (int) $this->input('project_id')
                ) {
                    $validator->errors()->add(
                        'case_id',
                        'الحالة المختارة لا تتبع المشروع المحدد.'
                    );
                }

                if (
                    $this->filled('donation_campaign_id') &&
                    (int) $case->donation_campaign_id !==
                        (int) $this->input('donation_campaign_id')
                ) {
                    $validator->errors()->add(
                        'case_id',
                        'الحالة المختارة لا تتبع حملة التبرع المحددة.'
                    );
                }

                // Only approved cases may receive donations.
                if ($case->status !== 'approved') {
                    $validator->errors()->add(
                        'case_id',
                        'هذه الحالة غير متاحة للتبرع حاليًا.'
                    );
                }

                // Calculate successful donations for this case.
                $collectedAmount = (float) $case->donations()
                    ->where('status', 'paid')
                    ->sum('amount');

                $targetAmount = (float) $case->target_amount;

                // Reject donations if the target has already been reached.
                if (
                    $targetAmount > 0 &&
                    $collectedAmount >= $targetAmount
                ) {
                    $validator->errors()->add(
                        'case_id',
                        'اكتمل المبلغ المستهدف لهذه الحالة.'
                    );
                } elseif (
                    $targetAmount > 0 &&
                    (float) $this->input('amount', 0) >
                        ($targetAmount - $collectedAmount)
                ) {
                    $validator->errors()->add(
                        'amount',
                        'مبلغ التبرع أكبر من المبلغ المتبقي للحالة.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Validate donation package
            |--------------------------------------------------------------------------
            */

            if ($this->filled('donation_package_id')) {
                $package = ProgramDonationPackage::find(
                    $this->input('donation_package_id')
                );

                if (!$package) {
                    $validator->errors()->add(
                        'donation_package_id',
                        'الباقة المختارة غير موجودة.'
                    );

                    return;
                }

                if (
                    $this->filled('program_id') &&
                    (int) $package->program_id !==
                        (int) $this->input('program_id')
                ) {
                    $validator->errors()->add(
                        'donation_package_id',
                        'الباقة المختارة لا تتبع البرنامج المحدد.'
                    );
                }

                if (
                    $this->filled('project_id') &&
                    (int) $package->project_id !==
                        (int) $this->input('project_id')
                ) {
                    $validator->errors()->add(
                        'donation_package_id',
                        'الباقة المختارة لا تتبع المشروع المحدد.'
                    );
                }

                if (
                    $this->filled('donation_campaign_id') &&
                    (int) $package->donation_campaign_id !==
                        (int) $this->input('donation_campaign_id')
                ) {
                    $validator->errors()->add(
                        'donation_package_id',
                        'الباقة المختارة لا تتبع حملة التبرع المحددة.'
                    );
                }

                if (
                    $package->amount !== null &&
                    (float) $this->input('amount') !==
                        (float) $package->amount
                ) {
                    $validator->errors()->add(
                        'amount',
                        'مبلغ التبرع يجب أن يطابق مبلغ الباقة المختارة.'
                    );
                }

                if (!$package->is_active) {
                    $validator->errors()->add(
                        'donation_package_id',
                        'الباقة المختارة غير متاحة حاليًا.'
                    );
                }
            }
        });
    }
}