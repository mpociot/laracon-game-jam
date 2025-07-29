<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>The Artisan Armada - Play</title>
    @vite(['resources/css/app.css', 'resources/js/game/game.js'])
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100%;
            height: 100%;
        }
        
        html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }
        
        #game-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(to bottom, #87CEEB 0%, #1E90FF 50%, #000080 100%);
        }
        
        /* Name Input Modal */
        #name-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .name-modal-content {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            padding: 40px;
            border-radius: 10px;
            text-align: center;
            border: 3px solid #fff;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .name-modal-content h2 {
            color: white;
            font-family: 'Press Start 2P', cursive;
            font-size: 24px;
            margin-bottom: 20px;
            text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
        }
        
        .name-input {
            width: 300px;
            padding: 15px;
            font-family: 'Press Start 2P', cursive;
            font-size: 16px;
            border: 3px solid #fff;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.9);
            margin-bottom: 20px;
            text-align: center;
        }
        
        .name-submit {
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            font-family: 'Press Start 2P', cursive;
            font-size: 14px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 0 #2e7d32;
        }
        
        .name-submit:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 0 #2e7d32;
        }
        
        .name-submit:active:not(:disabled) {
            transform: translateY(2px);
            box-shadow: 0 2px 0 #2e7d32;
        }
        
        .name-submit:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        #phaser-game {
            width: 100%;
            height: 100%;
        }
        
        #phaser-game canvas {
            display: block;
            width: 100% !important;
            height: 100% !important;
        }
        
        .game-ui {
            position: absolute;
            top: 20px;
            left: 20px;
            color: white;
            font-family: 'Press Start 2P', cursive;
            text-shadow: 2px 2px 0 rgba(0,0,0,0.5);
            z-index: 100;
        }
        
        .score {
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        .health {
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .speed {
            font-size: 14px;
        }
        
        .reload {
            font-size: 14px;
            margin-top: 10px;
            color: #ff6b6b;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-family: 'Press Start 2P', cursive;
            font-size: 20px;
            text-align: center;
        }
        
        .back-button {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            padding: 10px 20px;
            font-family: 'Press Start 2P', cursive;
            font-size: 12px;
            text-decoration: none;
            border: 2px solid white;
            border-radius: 5px;
            transition: all 0.3s;
            z-index: 100;
        }
        
        .back-button:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
        }
        
        /* Mobile Controls */
        .mobile-controls {
            position: absolute;
            bottom: 20px;
            width: 100%;
            display: none;
            z-index: 100;
        }
        
        @media (max-width: 768px), (pointer: coarse) {
            .mobile-controls {
                display: block;
            }
        }
        
        .virtual-joystick {
            position: absolute;
            left: 20px;
            bottom: 20px;
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.1);
            border: 3px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            touch-action: none;
        }
        
        .joystick-knob {
            position: absolute;
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid white;
            border-radius: 50%;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }
        
        .shoot-button {
            position: absolute;
            right: 20px;
            bottom: 20px;
            width: 100px;
            height: 100px;
            background: rgba(255, 0, 0, 0.3);
            border: 3px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Press Start 2P', cursive;
            font-size: 14px;
            color: white;
            text-shadow: 2px 2px 0 rgba(0,0,0,0.8);
            touch-action: none;
            user-select: none;
        }
        
        .shoot-button:active {
            background: rgba(255, 0, 0, 0.6);
            transform: scale(0.95);
        }
    </style>
</head>
<body>
    <!-- Name Input Modal -->
    <div id="name-modal">
        <div class="name-modal-content">
            <h2>Enter Your Name</h2>
            <input type="text" id="player-name" class="name-input" placeholder="Captain..." maxlength="20" autocomplete="off">
            <button id="start-game" class="name-submit" disabled>Set Sail!</button>
        </div>
    </div>
    
    <div id="game-container">
        <div class="loading" id="loading" style="display: none;">
            <div>Running migrations...</div>
            <div style="font-size: 12px; margin-top: 20px;">Loading game assets</div>
        </div>
        
        <div class="game-ui" id="game-ui" style="display: none;">
            <div class="score">Score: <span id="score">0</span></div>
            <div class="health">Hull: <span id="health">100</span>%</div>
            <div class="speed">Speed: <span id="speed">0</span> knots</div>
            <div class="reload" id="reload-indicator" style="display: none;">Reloading...</div>
        </div>
        
        <a href="/" class="back-button">Exit Game</a>
        
        <!-- Leaderboard -->
        <div class="absolute top-20 right-5 bg-black/70 border-2 border-white rounded-lg p-4 font-['Press_Start_2P'] text-white shadow-lg z-50 min-w-[250px]" id="leaderboard" style="display: none; text-shadow: 2px 2px 0 rgba(0,0,0,0.5);">
            <h3 class="text-sm mb-3 text-center text-yellow-300">Leaderboard</h3>
            <div id="leaderboard-list">
                <!-- Populated by JavaScript -->
            </div>
        </div>
        
        <div id="phaser-game"></div>
        
        <!-- Mobile Controls -->
        <div class="mobile-controls" id="mobile-controls">
            <div class="virtual-joystick" id="virtual-joystick">
                <div class="joystick-knob" id="joystick-knob"></div>
            </div>
            <div class="shoot-button" id="shoot-button">FIRE!</div>
        </div>
    </div>
</body>
</html>