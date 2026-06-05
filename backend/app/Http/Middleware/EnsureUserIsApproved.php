<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_approved) {
            return response()->json([
                'message' => 'Your account is pending admin approval.',
            ], 403);
        }

        return $next($request);
    }
}
