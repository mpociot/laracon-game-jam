import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import '../bootstrap';

let game = null;
let playerName = '';
let playerId = '';
let echoChannel = null;

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-game',
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'phaser-game',
        width: '100%',
        height: '100%'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, GameScene]
};

window.addEventListener('load', () => {
    // Handle name input
    const nameInput = document.getElementById('player-name');
    const startButton = document.getElementById('start-game');
    const nameModal = document.getElementById('name-modal');

    nameInput.addEventListener('input', (e) => {
        startButton.disabled = e.target.value.trim().length < 3;
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !startButton.disabled) {
            startButton.click();
        }
    });

    startButton.addEventListener('click', () => {
        playerName = nameInput.value.trim();
        playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Hide name modal and show loading
        nameModal.style.display = 'none';
        document.getElementById('loading').style.display = 'block';

        // Initialize game
        game = new Phaser.Game(config);

        // Set headers for channel authentication
        window.axios.defaults.headers.common['X-Player-Id'] = playerId;
        window.axios.defaults.headers.common['X-Player-Name'] = playerName;

        // Also set headers for Echo authentication
        window.Echo.options.auth.headers['X-Player-Id'] = playerId;
        window.Echo.options.auth.headers['X-Player-Name'] = playerName;

        // Join game presence channel
        echoChannel = null;

        // Store player info globally for GameScene
        window.gameData = {
            playerName,
            playerId,
            echoChannel
        };

        // Hide loading screen once game starts
        game.events.on('ready', () => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('game-ui').style.display = 'block';
            document.getElementById('leaderboard').style.display = 'block';
        });
    });

    // Focus on name input
    nameInput.focus();
});

// Export game instance for global access
window.game = null;
