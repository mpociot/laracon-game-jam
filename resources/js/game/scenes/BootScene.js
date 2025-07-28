import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Running migrations...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        // Update progress bar
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        
        // Load assets
        this.load.image('boat', '/assets/boat_left.png');
        
        // Create simple sprites for other assets
        this.createWindBreezeSprite();
        this.createProjectileSprite();
        this.createBugReportSprite();
        this.createOceanTile();
    }

    create() {
        // Start the game scene
        this.scene.start('GameScene');
    }
    
    createWindBreezeSprite() {
        // Create a simple wind breeze sprite
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x87CEEB, 0.3);
        graphics.fillCircle(32, 32, 30);
        graphics.fillStyle(0xFFFFFF, 0.5);
        graphics.fillCircle(32, 32, 20);
        graphics.generateTexture('windBreeze', 64, 64);
        graphics.destroy();
    }
    
    createProjectileSprite() {
        // Create PHP Array projectile sprite
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xFF6B6B);
        graphics.fillRect(0, 0, 20, 10);
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(2, 2, 16, 6);
        graphics.generateTexture('projectile', 20, 10);
        graphics.destroy();
    }
    
    createBugReportSprite() {
        // Create bug report obstacle sprite
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xFF0000);
        graphics.fillRect(0, 0, 40, 40);
        graphics.fillStyle(0xFFFFFF);
        graphics.fillRect(5, 5, 30, 30);
        graphics.fillStyle(0x000000);
        // Draw bug icon
        graphics.fillCircle(20, 15, 5);
        graphics.fillRect(18, 20, 4, 10);
        graphics.fillRect(12, 18, 16, 2);
        graphics.generateTexture('bugReport', 40, 40);
        graphics.destroy();
    }
    
    createOceanTile() {
        // Create a more realistic ocean background with waves
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        const tileSize = 256;
        
        // Base ocean gradient
        const gradient = this.add.graphics({ x: 0, y: 0 });
        for (let y = 0; y < tileSize; y++) {
            const lightness = 0.7 + (Math.sin(y * 0.02) * 0.1) + (Math.random() * 0.05);
            const color = Phaser.Display.Color.HSLToColor(0.58, 0.6, lightness).color;
            graphics.fillStyle(color);
            graphics.fillRect(0, y, tileSize, 1);
        }
        
        // Add wave patterns
        graphics.lineStyle(2, 0xffffff, 0.2);
        for (let i = 0; i < 5; i++) {
            const waveY = Math.random() * tileSize;
            const amplitude = 10 + Math.random() * 20;
            graphics.beginPath();
            graphics.moveTo(0, waveY);
            
            for (let x = 0; x <= tileSize; x += 5) {
                const y = waveY + Math.sin((x * 0.02) + (i * 1.5)) * amplitude;
                graphics.lineTo(x, y);
            }
            graphics.strokePath();
        }
        
        // Add some foam/highlight spots
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * tileSize;
            const y = Math.random() * tileSize;
            const radius = 2 + Math.random() * 4;
            graphics.fillStyle(0xffffff, 0.1 + Math.random() * 0.2);
            graphics.fillCircle(x, y, radius);
        }
        
        graphics.generateTexture('ocean', tileSize, tileSize);
        graphics.destroy();
        gradient.destroy();
    }
}