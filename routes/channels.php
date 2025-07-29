<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Game presence channel - allows anyone to join
Broadcast::channel('game', function ($user) {
    // The user object is set by AllowGuestBroadcasting middleware
    return [
        'id' => $user->id,
        'name' => $user->name
    ];
});
