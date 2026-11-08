<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Support\EmailCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

/**
 * Confirming the signed-in user's email with a 6-digit code (same rules as the password code).
 *   POST /email/verification-code        → sends the code (nothing to do when already confirmed)
 *   POST /email/verify {code}            → sets users.email_verified_at
 */
class EmailVerificationController extends Controller
{
    private const PURPOSE = 'verify';

    public function send(Request $request)
    {
        $user = $request->user();
        if ($this->isVerified($user)) {
            return response()->json(['message' => 'بريدك مؤكَّد بالفعل.', 'verified' => true]);
        }

        $email = EmailCode::normalize((string) $user->email);
        if (! EmailCode::maySend(self::PURPOSE, $email)) {
            return response()->json(['message' => 'طلبت رموزًا كثيرة. حاول مرة أخرى بعد ساعة.'], 429);
        }

        $code = EmailCode::issue(self::PURPOSE, $email);
        $hello = trim((string) $user->name) !== '' ? "أهلًا {$user->name}،" : 'أهلًا،';
        EmailCode::mail(
            $email,
            'رمز تأكيد البريد — مؤسسة اليسر الخيرية',
            "{$hello}\n\nرمز تأكيد بريدك في موقع مؤسسة اليسر الخيرية:\n\n    {$code}\n\n"
            . 'الرمز صالح لمدة ' . EmailCode::TTL_MINUTES . " دقيقة.\n\nمؤسسة اليسر الخيرية\nhttps://elyusr.org"
        );

        return response()->json(['message' => 'أرسلنا رمز التأكيد إلى بريدك.', 'verified' => false]);
    }

    public function verify(Request $request)
    {
        $data = $request->validate(['code' => ['required', 'digits:6']]);
        $user = $request->user();
        if ($this->isVerified($user)) {
            return response()->json(['message' => 'بريدك مؤكَّد بالفعل.', 'verified' => true]);
        }

        if (! EmailCode::check(self::PURPOSE, EmailCode::normalize((string) $user->email), $data['code'])) {
            return response()->json(['message' => 'الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا.'], 422);
        }

        if (Schema::hasColumn($user->getTable(), 'email_verified_at')) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return response()->json(['message' => 'تم تأكيد بريدك الإلكتروني.', 'verified' => true]);
    }

    private function isVerified($user): bool
    {
        return ! empty($user->email_verified_at);
    }
}
