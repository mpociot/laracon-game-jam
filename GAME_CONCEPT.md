# The Artisan Armada - Battle Royale

## Overview
A multiplayer naval battle royale game for Laracon, where players control sailboats powered by wind breezes and engage in Laravel-themed combat. Last boat sailing wins!

## Core Mechanics

### Movement System
- Players control sailboats using arrow keys
- Movement speed depends on catching wind breezes that appear randomly
- Wind breezes create dynamic "highways" across the map
- Strategic positioning is key to maintaining speed

### Combat System
- Players shoot projectiles at each other
- Projectile types with Laravel/PHP themes:
  - "PHP Arrays" - standard shots
  - "Eloquent Queries" - seeking missiles
  - "Artisan Commands" - special abilities

### Power-ups & Collectibles
- **Telescope**: See through fog/extended vision
- **Horizon**: Speed boost
- **Vapor**: Cloud cover/stealth mode
- **Forge**: Armor/defense boost
- **Nova**: Rapid fire mode

### Obstacles
- "Bug Reports" - floating obstacles that damage ships
- "Merge Conflicts" - whirlpools that slow movement
- "N+1 Queries" - areas that drain speed
- "Failed Deployments" - mines that explode on contact

## Battle Royale Mode
- Players spawn at random locations on the map
- Safe zone shrinks over time, forcing players together
- Ships take damage outside the safe zone
- Last boat sailing wins the match
- Quick respawn for next round

## Visual Assets
- Sailboat sprite (provided)
- Wind breeze sprite (provided)
- Laravel-themed UI elements
- Ocean/water background
- Shrinking safe zone indicator

## Technical Stack
- Frontend: HTML5 Canvas, JavaScript
- Multiplayer: WebSockets for real-time communication
- Backend: Node.js WebSocket server (or Laravel with Pusher/Soketi)

## Laravel/PHP References
- Ship names: "SS Eloquent", "HMS Migration", "USS Tinker"
- Sound effects: "php artisan" voice clips
- Loading screen: "Running migrations..."
- Victory screen: "Deployment successful!"
- Death message: "500 Server Error - Ship Not Found"

## Game Jam Scope
- Focus on core Battle Royale mechanics
- Simple but engaging wind-based movement
- Quick matches (3-5 minutes)
- Easy to learn, hard to master
- Laravel community inside jokes and references