<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;
use Illuminate\Support\Facades\Broadcast;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/play', [GameController::class, 'index'])->name('game.play');

// Game API Routes
Route::prefix('api/game')->group(function () {
    Route::post('/shoot', [GameController::class, 'shoot']);
    Route::post('/damage', [GameController::class, 'damage']);
});

// Broadcasting routes with custom middleware
Broadcast::routes(['middleware' => ['web', \App\Http\Middleware\AllowGuestBroadcasting::class]]);
