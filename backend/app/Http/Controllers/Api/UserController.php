<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $direction = str_starts_with($request->query('sort', '-created_at'), '-') ? 'desc' : 'asc';
        $limit = (int) $request->query('limit', 100);

        $users = User::query()
            ->orderBy('created_at', $direction)
            ->limit($limit > 0 ? $limit : 100)
            ->get()
            ->map(fn (User $user) => $user->toApiArray());

        return response()->json($users);
    }

    public function approve(User $user): JsonResponse
    {
        if ($user->is_approved) {
            return response()->json(['message' => 'User is already approved.']);
        }

        $user->update(['is_approved' => true]);

        return response()->json($user->fresh()->toApiArray());
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'sometimes|in:admin,viewer',
            'is_approved' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        return response()->json($user->fresh()->toApiArray());
    }
}
