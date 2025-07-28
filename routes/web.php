<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/play', [GameController::class, 'index'])->name('game.play');
