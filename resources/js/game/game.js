import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';

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
    const game = new Phaser.Game(config);
    
    // Hide loading screen once game starts
    game.events.on('ready', () => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('game-ui').style.display = 'block';
    });
});

// Export game instance for global access
window.game = null;