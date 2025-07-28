<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Artisan Armada - Laravel Naval Battle Game</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <style>
        .pixelated {
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
        }
        
        @keyframes sail {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        .boat-float {
            animation: sail 3s ease-in-out infinite;
        }
        
        @keyframes waves {
            0% { transform: translateX(0); }
            100% { transform: translateX(80px); }
        }
        
        .ocean-waves {
            animation: waves 10s linear infinite;
        }
    </style>
</head>
<body class="bg-gradient-to-b from-sky-400 via-blue-700 to-blue-950 min-h-screen text-white overflow-x-hidden">
    <!-- Animated ocean background -->
    <div class="absolute inset-0 opacity-10">
        <div class="ocean-waves h-full w-[200%] bg-repeat-x" style="background-image: repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255, 255, 255, 0.03) 40px, rgba(255, 255, 255, 0.03) 80px);"></div>
    </div>
    
    <div class="relative z-10">
        <div class="container mx-auto px-4 py-8">
            <!-- Header -->
            <header class="text-center mb-16 animate-fade-in">
                <h1 class="text-5xl md:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500" style="font-family: 'Press Start 2P', cursive; text-shadow: 3px 3px 0 rgba(0,0,0,0.3);">
                    The Artisan Armada
                </h1>
                <p class="text-xl text-yellow-300" style="font-family: 'Press Start 2P', cursive; text-shadow: 2px 2px 0 rgba(0,0,0,0.3);">
                    Set sail in the ultimate Laravel naval battle!
                </p>
            </header>
            
            <!-- Hero Section -->
            <div class="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
                <div class="flex-1 max-w-lg animate-slide-in-left">
                    <h2 class="text-3xl font-bold mb-4 text-yellow-300" style="font-family: 'Press Start 2P', cursive;">
                        Battle for the Seven Seas!
                    </h2>
                    <p class="text-lg mb-6 leading-relaxed">
                        Command your vessel in this multiplayer naval combat game. 
                        Harness the power of wind breezes, dodge bug reports, 
                        and deploy your features before your opponents!
                    </p>
                    <p class="text-sm text-sky-200">
                        Powered by Laravel, WebSockets, and pure PHP magic!
                    </p>
                </div>
                <div class="animate-slide-in-right">
                    <div class="boat-float">
                        <img src="/assets/boat_left.png" alt="Artisan Armada Sailboat" class="w-48 md:w-64 pixelated drop-shadow-2xl">
                    </div>
                </div>
            </div>
            
            <!-- Features Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <div class="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style="animation-delay: 0.1s;">
                    <h3 class="text-xl font-bold mb-3 text-yellow-300" style="font-family: 'Press Start 2P', cursive;">
                        Dynamic Wind System
                    </h3>
                    <p class="text-sm">
                        Navigate strategic wind breezes to outmaneuver your opponents and control the battlefield!
                    </p>
                </div>
                <div class="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style="animation-delay: 0.2s;">
                    <h3 class="text-xl font-bold mb-3 text-yellow-300" style="font-family: 'Press Start 2P', cursive;">
                        Laravel-Themed Combat
                    </h3>
                    <p class="text-sm">
                        Fire PHP Arrays, launch Eloquent Queries, and unleash Artisan Commands upon your foes!
                    </p>
                </div>
                <div class="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style="animation-delay: 0.3s;">
                    <h3 class="text-xl font-bold mb-3 text-yellow-300" style="font-family: 'Press Start 2P', cursive;">
                        Power-ups & Obstacles
                    </h3>
                    <p class="text-sm">
                        Collect Telescope, Horizon, Vapor, and more while avoiding Merge Conflicts and N+1 Queries!
                    </p>
                </div>
                <div class="bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-lg p-6 hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style="animation-delay: 0.4s;">
                    <h3 class="text-xl font-bold mb-3 text-yellow-300" style="font-family: 'Press Start 2P', cursive;">
                        Battle Royale Action
                    </h3>
                    <p class="text-sm">
                        Last boat sailing wins! The safe zone shrinks, forcing epic naval showdowns!
                    </p>
                </div>
            </div>
            
            
            <!-- Battle Royale Mode -->
            <div class="text-center mb-16">
                <h2 class="text-3xl font-bold mb-8 text-yellow-300" style="font-family: 'Press Start 2P', cursive; text-shadow: 2px 2px 0 rgba(0,0,0,0.3);">
                    Battle Royale Mode
                </h2>
                <div class="max-w-2xl mx-auto bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-lg shadow-xl">
                    <h3 class="text-2xl font-bold mb-4" style="font-family: 'Press Start 2P', cursive;">
                        Last Boat Sailing Wins!
                    </h3>
                    <p class="text-lg mb-4">
                        Navigate the shrinking safe zone while battling other ships. 
                        Master the wind, dodge obstacles, and be the last captain standing!
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div class="bg-black/20 p-4 rounded">
                            <h4 class="font-bold text-yellow-300 mb-2">Quick Matches</h4>
                            <p class="text-sm">3-5 minute rounds for fast-paced action</p>
                        </div>
                        <div class="bg-black/20 p-4 rounded">
                            <h4 class="font-bold text-yellow-300 mb-2">Strategic Combat</h4>
                            <p class="text-sm">Use Laravel-themed weapons and power-ups</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- CTA -->
            <div class="text-center py-16">
                <a href="{{ route('game.play') }}" class="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold px-12 py-4 rounded-full shadow-2xl hover:transform hover:scale-110 hover:shadow-3xl transition-all duration-300 animate-pulse" style="font-family: 'Press Start 2P', cursive;">
                    Set Sail Now!
                </a>
            </div>
        </div>
    </div>
    
    <!-- Tailwind Animations -->
    <style>
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slide-in-left {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slide-in-right {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
            animation: fade-in 1s ease-out;
        }
        
        .animate-slide-in-left {
            animation: slide-in-left 1s ease-out;
        }
        
        .animate-slide-in-right {
            animation: slide-in-right 1s ease-out;
        }
        
        .animate-fade-in-up {
            animation: fade-in-up 1s ease-out both;
        }
    </style>
</body>
</html>