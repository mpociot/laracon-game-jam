<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerDamaged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $playerId;
    public int $health;
    public int $damage;

    public function __construct(string $playerId, int $health, int $damage)
    {
        $this->playerId = $playerId;
        $this->health = $health;
        $this->damage = $damage;
    }

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('game'),
        ];
    }

    public function broadcastWith()
    {
        return [
            'playerId' => $this->playerId,
            'health' => $this->health,
            'damage' => $this->damage,
        ];
    }
}