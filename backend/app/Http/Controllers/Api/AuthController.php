<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required_without:full_name|string|max:255',
            'full_name' => 'required_without:name|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $name = $validated['name'] ?? $validated['full_name'];

        User::create([
            'name' => $name,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'viewer',
            'is_approved' => false,
        ]);

        return response()->json([
            'message' => 'Registration successful. Your account is pending admin approval.',
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        if (! $user->is_approved) {
            return response()->json([
                'message' => 'Your account is pending admin approval. You will be able to log in once an administrator approves your account.',
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'user' => $user->toApiArray(),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->toApiArray());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If an account exists with that email, you will receive a password reset link shortly.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => 'Password has been reset.']);
    }
}
