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
        
        // Mobile controls
        this.mobileInput = { x: 0, y: 0, shooting: false };
        this.joystickActive = false;
    }

    create() {
        // Get game dimensions
        const { width, height } = this.scale;
        
        // Create world size based on screen size but larger for exploration
        this.worldWidth = Math.max(width * 2, 2560);
        this.worldHeight = Math.max(height * 2, 1440);
        
        // Create tiled ocean background with scrolling effect
        this.oceanBackground = this.add.tileSprite(0, 0, this.worldWidth, this.worldHeight, 'ocean').setOrigin(0, 0);
        this.oceanBackground.setScrollFactor(0.5); // Parallax effect
        
        // Create player at center of screen
        this.player = new Player(this, width / 2, height / 2);
        
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
        
        // Set up mobile controls
        this.setupMobileControls();
        
        // Camera follow player
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // World bounds
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // UI update timer
        this.time.addEvent({
            delay: 100,
            callback: this.updateUI,
            callbackScope: this,
            loop: true
        });
        
        // Handle resize events
        this.scale.on('resize', this.resize, this);
    }

    update(time, delta) {
        // Animate ocean background
        this.oceanBackground.tilePositionX += 0.5;
        this.oceanBackground.tilePositionY += 0.2;
        
        // Update player with both keyboard and mobile input
        this.player.update(this.cursors, this.mobileInput);
        
        // Handle shooting
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.mobileInput.shooting) {
            if (this.player.canShoot()) {
                this.shoot();
                this.player.startReload();
            }
            this.mobileInput.shooting = false; // Reset after shooting
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
            if (projectile.x < 0 || projectile.x > this.worldWidth || projectile.y < 0 || projectile.y > this.worldHeight) {
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
        const x = Phaser.Math.Between(100, this.worldWidth - 100);
        const y = Phaser.Math.Between(100, this.worldHeight - 100);
        const breeze = new WindBreeze(this, x, y);
        this.windBreezes.add(breeze);
    }
    
    spawnBugReport() {
        const x = Phaser.Math.Between(100, this.worldWidth - 100);
        const y = Phaser.Math.Between(100, this.worldHeight - 100);
        
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
        
        // Update reload indicator
        const reloadIndicator = document.getElementById('reload-indicator');
        if (reloadIndicator) {
            if (this.player.reloadTime > 0) {
                reloadIndicator.style.display = 'block';
                const percentage = Math.ceil((this.player.reloadTime / this.player.reloadDuration) * 100);
                reloadIndicator.textContent = `Reloading... ${percentage}%`;
            } else {
                reloadIndicator.style.display = 'none';
            }
        }
    }
    
    setupMobileControls() {
        const joystick = document.getElementById('virtual-joystick');
        const knob = document.getElementById('joystick-knob');
        const shootButton = document.getElementById('shoot-button');
        
        if (!joystick || !knob || !shootButton) return;
        
        // Joystick controls
        const joystickRadius = 75;
        let joystickCenterX = 0;
        let joystickCenterY = 0;
        
        const updateJoystickPosition = (clientX, clientY) => {
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let deltaX = clientX - centerX;
            let deltaY = clientY - centerY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > joystickRadius) {
                deltaX = (deltaX / distance) * joystickRadius;
                deltaY = (deltaY / distance) * joystickRadius;
            }
            
            knob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
            
            // Normalize input values
            this.mobileInput.x = deltaX / joystickRadius;
            this.mobileInput.y = deltaY / joystickRadius;
        };
        
        const resetJoystick = () => {
            knob.style.transform = 'translate(-50%, -50%)';
            this.mobileInput.x = 0;
            this.mobileInput.y = 0;
            this.joystickActive = false;
        };
        
        // Touch events for joystick
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystickActive = true;
            const touch = e.touches[0];
            updateJoystickPosition(touch.clientX, touch.clientY);
        });
        
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.joystickActive) {
                const touch = e.touches[0];
                updateJoystickPosition(touch.clientX, touch.clientY);
            }
        });
        
        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            resetJoystick();
        });
        
        // Mouse events for testing on desktop
        joystick.addEventListener('mousedown', (e) => {
            this.joystickActive = true;
            updateJoystickPosition(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.joystickActive) {
                updateJoystickPosition(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            resetJoystick();
        });
        
        // Shoot button
        shootButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.player.canShoot()) {
                this.mobileInput.shooting = true;
            }
        });
        
        shootButton.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (this.player.canShoot()) {
                this.mobileInput.shooting = true;
            }
        });
        
        // Update shoot button visual state
        this.time.addEvent({
            delay: 100,
            callback: () => {
                if (this.player && shootButton) {
                    if (this.player.reloadTime > 0) {
                        shootButton.style.opacity = '0.5';
                        shootButton.style.background = 'rgba(100, 100, 100, 0.3)';
                        const percentage = Math.ceil((this.player.reloadTime / this.player.reloadDuration) * 100);
                        shootButton.textContent = `${percentage}%`;
                    } else {
                        shootButton.style.opacity = '1';
                        shootButton.style.background = 'rgba(255, 0, 0, 0.3)';
                        shootButton.textContent = 'FIRE!';
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    resize(gameSize) {
        const { width, height } = gameSize;
        
        // Update world size
        this.worldWidth = Math.max(width * 2, 2560);
        this.worldHeight = Math.max(height * 2, 1440);
        
        // Update ocean background
        this.oceanBackground.setSize(this.worldWidth, this.worldHeight);
        
        // Update camera bounds
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // Update physics world bounds
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    }
}