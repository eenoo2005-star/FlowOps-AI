<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Services\LoginAttemptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly LoginAttemptService $loginAttempts
    ) {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $email = Str::lower(
            trim((string) $request->validated('email'))
        );

        $password = (string) $request->validated('password');

        $user = User::query()
            ->withoutGlobalScopes()
            ->with('company')
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if (
            ! $user
            || ! Hash::check($password, $user->password)
        ) {
            $this->loginAttempts->record(
                request: $request,
                email: $email,
                user: $user,
                wasSuccessful: false,
                failureReason: 'invalid_credentials'
            );

            throw ValidationException::withMessages([
                'email' => [
                    'The provided credentials are incorrect.',
                ],
            ]);
        }

        if (
            ! $user->company
            || ! $user->company->is_active
        ) {
            $this->loginAttempts->record(
                request: $request,
                email: $email,
                user: $user,
                wasSuccessful: false,
                failureReason: 'company_inactive'
            );

            throw ValidationException::withMessages([
                'email' => [
                    'The provided credentials are incorrect.',
                ],
            ]);
        }

        $deviceName = trim(
            (string) $request->input(
                'device_name',
                'flowops-web'
            )
        );

        if ($deviceName === '') {
            $deviceName = 'flowops-web';
        }

        $token = $user
            ->createToken($deviceName)
            ->plainTextToken;

        $this->loginAttempts->record(
            request: $request,
            email: $email,
            user: $user,
            wasSuccessful: true
        );

        return response()->json([
            'message' => 'Authentication successful.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->serializeUser($user),
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'data' => $this->serializeUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()
            ?->currentAccessToken()
            ?->delete();

        return response()->json([
            'message' => 'Signed out successfully.',
        ]);
    }

    private function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'company_id' => $user->company_id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user
                ->getRoleNames()
                ->values()
                ->all(),
            'permissions' => $user
                ->getAllPermissions()
                ->pluck('name')
                ->values()
                ->all(),
        ];
    }
}