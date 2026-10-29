<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\CaseModel;

class Donation extends Model
{
    protected $fillable = [
        'donor_name',
        'donor_phone',
        'transaction_reference',
        'donor_id',
        'program_id',
        'donation_package_id',
        'payment_method_id',
        'project_id',
        'donation_campaign_id',
        'amount',
        'status',
        'case_id',
        'payment_reference',
        'payment_receipt',
        'payment_details',
        'tracking_data',
        'payment_method',
        'notes',

        // Pickup information
        'pickup_governorate',
        'pickup_city',
        'pickup_address',
        'pickup_preferred_time',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_details' => 'array',
        'tracking_data' => 'array',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function donationPackage(): BelongsTo
    {
        return $this->belongsTo(
            ProgramDonationPackage::class,
            'donation_package_id'
        );
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(
            PaymentMethod::class,
            'payment_method_id'
        );
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function donationCampaign(): BelongsTo
    {
        return $this->belongsTo(
            DonationCampaign::class,
            'donation_campaign_id'
        );
    }

    public function case(): BelongsTo
    {
        return $this->belongsTo(
            CaseModel::class,
            'case_id'
        );
    }
}