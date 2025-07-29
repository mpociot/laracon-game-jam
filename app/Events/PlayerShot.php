<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerShot implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $playerId;
    public float $x;
    public float $y;
    public float $direction;

    public function __construct(string $playerId, float $x, float $y, float $direction)
    {
        $this->playerId = $playerId;
        $this->x = $x;
        $this->y = $y;
        $this->direction = $direction;
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
            'x' => $this->x,
            'y' => $this->y,
            'direction' => $this->direction,
        ];
    }
}