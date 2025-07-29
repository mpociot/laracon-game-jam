<?php

namespace App\Http\Middleware;

use App\Models\GuestUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowGuestBroadcasting
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // For the game channel, create a guest user
        if ($request->input('channel_name') === 'presence-game') {
            $playerId = $request->header('X-Player-Id') ?? session()->getId();
            $playerName = $request->header('X-Player-Name') ?? 'Anonymous';

            // Create a proper user object that Broadcasting expects
            $request->setUserResolver(function () use ($playerId, $playerName) {
                return new GuestUser($playerId, $playerName);
            });
        }

        return $next($request);
    }
}
