<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class DonationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return array_filter([
            'id' => $this->id,

            /*
            |--------------------------------------------------------------------------
            | Transaction
            |--------------------------------------------------------------------------
            */

            'transaction_reference' =>
                $this->transaction_reference,

            'status' =>
                $this->status,

            /*
            |--------------------------------------------------------------------------
            | Donor
            |--------------------------------------------------------------------------
            */

            // The name / phone typed for this donation win over the donor record (older rows have none).
            'donor_name' => $this->donor_name ?? $this->donor?->name,
            'donor_phone' => $this->donor_phone ?? $this->donor?->phone,

            'donor' => $this->whenLoaded(
                'donor',
                fn () => $this->donor
                    ? [
                        'id' => $this->donor->id,
                        'name' => $this->donor_name ?? $this->donor->name,
                        'email' => $this->donor->email,
                        'phone' => $this->donor_phone ?? $this->donor->phone,
                    ]
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Program
            |--------------------------------------------------------------------------
            */

            'program_id' =>
                $this->when(
                    $this->program_id !== null,
                    $this->program_id
                ),

            'program' => $this->whenLoaded(
                'program',
                fn () => $this->program
                    ? [
                        'id' => $this->program->id,
                        'name' => $this->program->name,
                        'name_ar' => $this->program->name_ar,
                        'name_en' => $this->program->name_en,
                    ]
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Project
            |--------------------------------------------------------------------------
            */

            'project_id' =>
                $this->when(
                    $this->project_id !== null,
                    $this->project_id
                ),

            'project' => $this->whenLoaded(
                'project',
                fn () => $this->project
                    ? [
                        'id' => $this->project->id,
                        'name' => $this->project->name,
                        'name_ar' => $this->project->name_ar,
                        'name_en' => $this->project->name_en,
                    ]
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Donation Campaign
            |--------------------------------------------------------------------------
            */

            'donation_campaign_id' =>
                $this->when(
                    $this->donation_campaign_id !== null,
                    $this->donation_campaign_id
                ),

            'donation_campaign' => $this->whenLoaded(
                'donationCampaign',
                fn () => $this->donationCampaign
                    ? [
                        'id' => $this->donationCampaign->id,
                        'name_ar' =>
                            $this->donationCampaign->name_ar,
                        'name_en' =>
                            $this->donationCampaign->name_en,
                        'slug' =>
                            $this->donationCampaign->slug,
                    ]
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Case
            |--------------------------------------------------------------------------
            */

            'case_id' =>
                $this->when(
                    $this->case_id !== null,
                    $this->case_id
                ),

            'case' => $this->whenLoaded(
                'case',
                fn () => $this->case
                    ? [
                        'id' => $this->case->id,
                        'code' => $this->case->code,
                        'title' => $this->case->title,
                        'program_id' =>
                            $this->case->program_id,
                        'project_id' =>
                            $this->case->project_id,
                        'donation_campaign_id' =>
                            $this->case->donation_campaign_id,
                        'beneficiary_name' =>
                            $this->case->beneficiary_name,
                        'target_amount' =>
                            $this->case->target_amount,
                        'status' =>
                            $this->case->status,
                    ]
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Donation Package
            |--------------------------------------------------------------------------
            */

            'donation_package_id' =>
                $this->when(
                    $this->donation_package_id !== null,
                    $this->donation_package_id
                ),

            'donation_package' => $this->whenLoaded(
                'donationPackage',
                fn () => $this->donationPackage
                    ? array_filter([
                        'id' =>
                            $this->donationPackage->id,

                        'program_id' =>
                            $this->donationPackage->program_id,

                        'project_id' =>
                            $this->donationPackage->project_id,

                        'donation_campaign_id' =>
                            $this->donationPackage
                                ->donation_campaign_id,

                        'name_ar' =>
                            $this->donationPackage->name_ar,

                        'name_en' =>
                            $this->donationPackage->name_en,

                        'amount' =>
                            $this->donationPackage->amount,
                    ], fn ($value) => $value !== null)
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Amount
            |--------------------------------------------------------------------------
            */

            'amount' => $this->amount,

            /*
            |--------------------------------------------------------------------------
            | Payment
            |--------------------------------------------------------------------------
            */

            'payment_method' =>
                $this->payment_method,

            'payment_method_id' =>
                $this->payment_method_id,

            // Card payments are confirmed by the gateway; anything else waits for the team.
            'is_gateway' => \App\Support\PaymentMethodKind::isGateway($this->resource),

            'payment_method_type' => $this->whenLoaded(
                'paymentMethod',
                fn () => $this->paymentMethod?->type
            ),

            'payment_method_details' => $this->whenLoaded(
                'paymentMethod',
                fn () => new PaymentMethodResource(
                    $this->paymentMethod
                )
            ),

            'payment_reference' =>
                $this->payment_reference,

            'payment_receipt' =>
                $this->payment_receipt
                    ? Storage::disk('public')->url(
                        $this->payment_receipt
                    )
                    : null,

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT:
            | Do not expose raw payment_details.
            |--------------------------------------------------------------------------
            */

            /*
            |--------------------------------------------------------------------------
            | Home Pickup
            |--------------------------------------------------------------------------
            */

            'pickup' => array_filter([
                'governorate' =>
                    $this->pickup_governorate,

                'city' =>
                    $this->pickup_city,

                'address' =>
                    $this->pickup_address,

                'preferred_time' =>
                    $this->pickup_preferred_time,
            ], fn ($value) => $value !== null),

            /*
            |--------------------------------------------------------------------------
            | Tracking
            |--------------------------------------------------------------------------
            */

            /*
             * Internal tracking data must not be exposed
             * through the public donation resource.
             */

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            'notes' =>
                $this->notes,

            'created_at' =>
                $this->created_at,

        ], function ($value) {
            /*
             * Remove null / empty values from the final response.
             */
            return $value !== null;
        });
    }
}