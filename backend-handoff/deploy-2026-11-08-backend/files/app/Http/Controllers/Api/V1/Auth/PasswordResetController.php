<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\EmailCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Forgotten password with a 6-digit code sent by email (valid 15 minutes, 5 tries).
 *   POST /forgot-password {email}  → the same answer for every email, so nobody can probe accounts
 *   POST /reset-password  {email, code, password, password_confirmation}
 * A reset signs the account out on every device. Both routes are throttled per IP as well
 * (routes/api-2026-11-08.php); EmailCode limits codes and tries per address.
 */
class PasswordResetController extends Controller
{
    private const PURPOSE = 'password';

    public function send(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $email = EmailCode::normalize($data['email']);
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($user && EmailCode::maySend(self::PURPOSE, $email)) {
            $code = EmailCode::issue(self::PURPOSE, $email);
            EmailCode::mail($email, 'رمز استعادة كلمة المرور — مؤسسة اليسر الخيرية', $this->mailBody((string) $user->name, $code));
        }

        return response()->json([
            'message' => 'لو البريد مسجّل عندنا، هيوصلك رمز من 6 أرقام خلال دقائق، وصالح لمدة 15 دقيقة.',
        ]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ]);
        $email = EmailCode::normalize($data['email']);
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user || ! EmailCode::check(self::PURPOSE, $email, $data['code'])) {
            return response()->json(['message' => 'الرمز غير صحيح أو انتهت صلاحيته. اطلب رمزًا جديدًا.'], 422);
        }

        $user->forceFill(['password' => Hash::make($data['password'])])->save();
        $user->tokens()->delete();

        return response()->json(['message' => 'تم تغيير كلمة المرور. سجّل الدخول بكلمتك الجديدة.']);
    }

    private function mailBody(string $name, string $code): string
    {
        $hello = trim($name) !== '' ? "أهلًا {$name}،" : 'أهلًا،';

        return "{$hello}\n\n"
            . "رمز استعادة كلمة المرور في موقع مؤسسة اليسر الخيرية:\n\n"
            . "    {$code}\n\n"
            . "الرمز صالح لمدة " . EmailCode::TTL_MINUTES . " دقيقة. لو لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة وحسابك بأمان.\n\n"
            . "مؤسسة اليسر الخيرية\nhttps://elyusr.org";
    }
}
