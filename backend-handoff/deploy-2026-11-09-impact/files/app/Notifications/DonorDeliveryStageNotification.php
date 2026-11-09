<?php

namespace App\Notifications;

/** To the donor: their paid donation reached a delivery step (family chosen, being prepared, delivered, paused). */
class DonorDeliveryStageNotification extends AppNotification
{
    private const TEXT = [
        'family_identified' => [
            'title' => 'حددنا الأسرة المستحقة لتبرعك',
            'message' => 'فريقنا الميداني اختار الأسرة اللي هيوصلها تبرعك{for} بعد البحث والتأكد من احتياجها.',
        ],
        'preparing' => [
            'title' => 'بنجهّز تبرعك للأسرة',
            'message' => 'تبرعك{for} بيتجهّز دلوقتي علشان يتسلّم للأسرة. هنبعتلك أول ما يوصل.',
        ],
        'delivered' => [
            'title' => 'تم تسليم تبرعك، جزاك الله خيرًا',
            'message' => 'تبرعك{for} وصل للأسرة المستحقة. ربنا يتقبل منك ويجعله في ميزان حسناتك.',
        ],
        'on_hold' => [
            'title' => 'تسليم تبرعك اتأجل شوية',
            'message' => 'تبرعك{for} محفوظ، والتسليم اتأجل لسبب: {reason}. هنبلغك أول ما نكمّل.',
        ],
    ];

    public function __construct(
        public int $donationId,
        public string $stage,
        public string $amount,
        public ?string $target,
        public string $followUrl,
        public ?string $reason = null
    ) {
    }

    protected function type(): string
    {
        return 'donor_delivery_' . $this->stage;
    }

    protected function title(): string
    {
        return self::TEXT[$this->stage]['title'] ?? 'تحديث على تبرعك';
    }

    protected function message(): string
    {
        $for = $this->target ? " لـ«{$this->target}» ({$this->amount} ج.م)" : " ({$this->amount} ج.م)";
        $text = self::TEXT[$this->stage]['message'] ?? 'فيه خطوة جديدة في رحلة تبرعك{for}.';

        return str_replace(['{for}', '{reason}'], [$for, $this->reason ?: 'ظرف في الميدان'], $text);
    }

    protected function url(): ?string
    {
        return $this->followUrl;
    }

    protected function severity(): string
    {
        return match ($this->stage) {
            'delivered' => 'success',
            'on_hold' => 'warning',
            default => 'info',
        };
    }

    protected function extra(): array
    {
        return ['donation_id' => $this->donationId, 'stage' => $this->stage];
    }
}
