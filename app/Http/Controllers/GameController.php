<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Events\PlayerShot;
use App\Events\PlayerDamaged;

class GameController extends Controller
{
    public function index()
    {
        return view('game');
    }
    
    public function shoot(Request $request)
    {
        $validated = $request->validate([
            'playerId' => 'required|string',
            'x' => 'required|numeric',
            'y' => 'required|numeric',
            'direction' => 'required|numeric',
        ]);
        
        broadcast(new PlayerShot(
            $validated['playerId'],
            $validated['x'],
            $validated['y'],
            $validated['direction']
        ))->toOthers();
        
        return response()->json(['success' => true]);
    }
    
    public function damage(Request $request)
    {
        $validated = $request->validate([
            'playerId' => 'required|string',
            'health' => 'required|integer',
            'damage' => 'required|integer',
        ]);
        
        broadcast(new PlayerDamaged(
            $validated['playerId'],
            $validated['health'],
            $validated['damage']
        ))->toOthers();
        
        return response()->json(['success' => true]);
    }
}