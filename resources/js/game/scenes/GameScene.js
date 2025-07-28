import Phaser from 'phaser';
import Player from '../entities/Player';
import WindBreeze from '../entities/WindBreeze';
import Projectile from '../entities/Projectile';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        this.score = 0;
        this.windBreezes = null;
        this.projectiles = null;
        this.bugReports = null;
        this.lastWindSpawn = 0;
        this.lastBugSpawn = 0;
    }

    create() {
        // Create tiled ocean background with scrolling effect
        this.oceanBackground = this.add.tileSprite(0, 0, 2560, 1440, 'ocean').setOrigin(0, 0);
        this.oceanBackground.setScrollFactor(0.5); // Parallax effect
        
        // Create player
        this.player = new Player(this, 640, 360);
        
        // Create groups
        this.windBreezes = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.bugReports = this.physics.add.group();
        
        // Set up collisions
        this.physics.add.overlap(this.player.sprite, this.windBreezes, this.collectWind, null, this);
        this.physics.add.overlap(this.player.sprite, this.bugReports, this.hitBugReport, null, this);
        this.physics.add.overlap(this.projectiles, this.bugReports, this.destroyBugReport, null, this);
        
        // Set up input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Camera follow player
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setBounds(0, 0, 2560, 1440);
        
        // World bounds
        this.physics.world.setBounds(0, 0, 2560, 1440);
        
        // UI update timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateUI,
            callbackScope: this,
            loop: true
        });
    }

    update(time, delta) {
        // Animate ocean background
        this.oceanBackground.tilePositionX += 0.5;
        this.oceanBackground.tilePositionY += 0.2;
        
        // Update player
        this.player.update(this.cursors);
        
        // Handle shooting
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.shoot();
        }
        
        // Spawn wind breezes
        if (time - this.lastWindSpawn > 3000) {
            this.spawnWindBreeze();
            this.lastWindSpawn = time;
        }
        
        // Spawn bug reports
        if (time - this.lastBugSpawn > 5000) {
            this.spawnBugReport();
            this.lastBugSpawn = time;
        }
        
        // Update wind breezes
        this.windBreezes.children.entries.forEach(breeze => {
            breeze.update();
        });
        
        // Update projectiles
        this.projectiles.children.entries.forEach(projectile => {
            // Only call update if it's our custom Projectile class
            if (projectile.update && typeof projectile.update === 'function') {
                projectile.update();
            }
            
            // Remove projectiles that are out of bounds
            if (projectile.x < 0 || projectile.x > 2560 || projectile.y < 0 || projectile.y > 1440) {
                projectile.destroy();
            }
        });
        
        // Update bug reports (simple movement)
        this.bugReports.children.entries.forEach(bug => {
            // Simple wandering behavior
            if (!bug.getData('moveTime') || time > bug.getData('moveTime')) {
                bug.setVelocity(
                    Phaser.Math.Between(-50, 50),
                    Phaser.Math.Between(-50, 50)
                );
                bug.setData('moveTime', time + Phaser.Math.Between(2000, 4000));
            }
        });
    }
    
    spawnWindBreeze() {
        const x = Phaser.Math.Between(100, 2460);
        const y = Phaser.Math.Between(100, 1340);
        const breeze = new WindBreeze(this, x, y);
        this.windBreezes.add(breeze);
    }
    
    spawnBugReport() {
        const x = Phaser.Math.Between(100, 2460);
        const y = Phaser.Math.Between(100, 1340);
        
        const bug = this.physics.add.sprite(x, y, 'bugReport');
        bug.setScale(1.5);
        this.bugReports.add(bug);
    }
    
    shoot() {
        // Calculate spawn position at the top of the boat
        const direction = this.player.facingDirection;
        const spawnX = this.player.sprite.x;
        const spawnY = this.player.sprite.y - 50; // Spawn well above the boat sprite
        
        const projectile = new Projectile(
            this,
            spawnX,
            spawnY,
            direction
        );
        
        // Add to group and ensure velocity is maintained
        this.projectiles.add(projectile);
        
        // Re-apply velocity after adding to group (in case it gets reset)
        const speed = 500;
        const velocityX = Math.cos(direction) * speed;
        const velocityY = Math.sin(direction) * speed;
        projectile.body.setVelocity(velocityX, velocityY);
        
        projectile.body.setSize(20, 10); // Set physics body size
    }
    
    collectWind(player, windBreeze) {
        // Boost player speed
        this.player.boost();
        
        // Update score
        this.score += 10;
        
        // Remove wind breeze
        windBreeze.destroy();
        
        // Spawn a new one
        this.spawnWindBreeze();
    }
    
    hitBugReport(player, bugReport) {
        // Damage player
        this.player.takeDamage(10);
        
        // Knock back player
        const angle = Phaser.Math.Angle.Between(
            bugReport.x, bugReport.y,
            player.x, player.y
        );
        this.player.knockback(angle);
        
        // Flash effect
        this.cameras.main.flash(250, 255, 0, 0);
    }
    
    destroyBugReport(projectile, bugReport) {
        // Update score
        this.score += 25;
        
        // Destroy both
        projectile.destroy();
        bugReport.destroy();
        
        // Particle effect
        const particles = this.add.particles(bugReport.x, bugReport.y, 'bugReport', {
            scale: { start: 0.5, end: 0 },
            speed: { min: 100, max: 200 },
            lifespan: 300,
            quantity: 5
        });
        
        this.time.delayedCall(300, () => particles.destroy());
    }
    
    updateUI() {
        // Update UI elements
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = Math.max(0, this.player.health);
        document.getElementById('speed').textContent = Math.round(this.player.currentSpeed);
    }
}