import Phaser from 'phaser';

export default class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        
        // Create sprite
        this.sprite = scene.physics.add.sprite(x, y, 'boat');
        this.sprite.setScale(0.15);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setDrag(50);
        this.sprite.setMaxVelocity(300);
        
        // Player stats
        this.health = 100;
        this.maxHealth = 100;
        this.maxSpeed = 150;
        this.currentSpeed = 0;
        this.acceleration = 5;
        this.rotationSpeed = 2;
        this.boostTime = 0;
        this.boostMultiplier = 2;
        
        // Shooting mechanics
        this.reloadTime = 0;
        this.reloadDuration = 1000; // 1 second reload time
        
        // Movement physics
        this.momentum = { x: 0, y: 0 };
        
        // Facing direction (in radians, 0 = right, PI = left)
        this.facingDirection = Math.PI; // Start facing left
        
        // Health bar
        this.createHealthBar();
        
        // Smoke particles for low health
        this.smokeEmitter = null;
        this.lastSmokeTime = 0;
    }
    
    update(cursors, mobileInput = { x: 0, y: 0 }) {
        // Direct movement with arrow keys or mobile input
        let velocityX = 0;
        let velocityY = 0;
        const speed = this.getMaxSpeed();
        
        // Combine keyboard and mobile input
        // Horizontal movement
        if (cursors.left.isDown || mobileInput.x < -0.2) {
            velocityX = -speed * (cursors.left.isDown ? 1 : Math.abs(mobileInput.x));
            this.sprite.setFlipX(false); // Sprite faces left by default
            this.facingDirection = Math.PI; // Facing left
        } else if (cursors.right.isDown || mobileInput.x > 0.2) {
            velocityX = speed * (cursors.right.isDown ? 1 : Math.abs(mobileInput.x));
            this.sprite.setFlipX(true); // Flip sprite to face right
            this.facingDirection = 0; // Facing right
        }
        
        // Vertical movement
        if (cursors.up.isDown || mobileInput.y < -0.2) {
            velocityY = -speed * (cursors.up.isDown ? 1 : Math.abs(mobileInput.y));
        } else if (cursors.down.isDown || mobileInput.y > 0.2) {
            velocityY = speed * (cursors.down.isDown ? 1 : Math.abs(mobileInput.y));
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            velocityX = (velocityX / magnitude) * speed;
            velocityY = (velocityY / magnitude) * speed;
        }
        
        // Apply velocity with some smoothing
        const currentVelX = this.sprite.body.velocity.x;
        const currentVelY = this.sprite.body.velocity.y;
        const smoothing = 0.2;
        
        this.sprite.setVelocity(
            currentVelX + (velocityX - currentVelX) * smoothing,
            currentVelY + (velocityY - currentVelY) * smoothing
        );
        
        // Update currentSpeed for UI display
        this.currentSpeed = Math.sqrt(
            this.sprite.body.velocity.x * this.sprite.body.velocity.x + 
            this.sprite.body.velocity.y * this.sprite.body.velocity.y
        );
        
        // Update boost timer
        if (this.boostTime > 0) {
            this.boostTime -= this.scene.game.loop.delta;
        }
        
        // Update reload timer
        if (this.reloadTime > 0) {
            this.reloadTime -= this.scene.game.loop.delta;
        }
        
        // Always add particle trail effect when moving
        if (this.currentSpeed > 10) { // Only show particles when actually moving
            const particleChance = Math.min(50, this.currentSpeed / 3); // More particles at higher speeds
            if (Phaser.Math.Between(0, 100) < particleChance) {
                this.createBoostParticle();
            }
        }
        
        // Update health bar position
        this.updateHealthBar();
        
        // Update low health effects
        this.updateLowHealthEffects();
    }
    
    boost() {
        this.boostTime = 3000; // 3 seconds boost
        this.currentSpeed = this.getMaxSpeed();
        
        // Visual feedback
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0.18,
            scaleY: 0.18,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Flash red
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.updateHealthTint();
        });
        
        // Check if dead
        if (this.health <= 0) {
            this.die();
        }
    }
    
    knockback(angle) {
        const force = 200;
        const knockbackX = Math.cos(angle) * force;
        const knockbackY = Math.sin(angle) * force;
        
        this.sprite.setVelocity(knockbackX, knockbackY);
        this.currentSpeed = 0;
    }
    
    die() {
        // Hide health bar
        this.healthBarBg.setVisible(false);
        this.healthBarFill.setVisible(false);
        
        // Death animation
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scale: 0,
            rotation: this.sprite.rotation + Math.PI * 2,
            duration: 1000,
            onComplete: () => {
                // Show game over screen
                this.scene.showGameOver();
            }
        });
    }
    
    getMaxSpeed() {
        return this.boostTime > 0 ? this.maxSpeed * this.boostMultiplier : this.maxSpeed;
    }
    
    canShoot() {
        return this.reloadTime <= 0;
    }
    
    startReload() {
        this.reloadTime = this.reloadDuration;
    }
    
    createBoostParticle() {
        // Create a simple particle behind the boat based on movement direction
        const velocity = this.sprite.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed > 0) {
            // Calculate opposite direction of movement
            const moveAngle = Math.atan2(velocity.y, velocity.x);
            const offsetX = Math.cos(moveAngle + Math.PI) * 30;
            const offsetY = Math.sin(moveAngle + Math.PI) * 30;
            
            // Vary particle size based on speed
            const particleSize = 2 + (speed / 100);
            
            const particle = this.scene.add.circle(
                this.sprite.x + offsetX,
                this.sprite.y + offsetY,
                particleSize,
                0x87CEEB
            );
            
            // Add some randomness to make it look more natural
            particle.x += Phaser.Math.Between(-5, 5);
            particle.y += Phaser.Math.Between(-5, 5);
            
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 600 + Phaser.Math.Between(-100, 100),
                onComplete: () => particle.destroy()
            });
        }
    }
    
    createHealthBar() {
        // Health bar background
        this.healthBarBg = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y + 40,
            60,
            8,
            0x333333
        );
        this.healthBarBg.setStrokeStyle(2, 0x000000);
        
        // Health bar fill
        this.healthBarFill = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y + 40,
            60,
            8,
            0x00ff00
        );
        
        // Make health bar follow player
        this.healthBarBg.setDepth(10);
        this.healthBarFill.setDepth(11);
    }
    
    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        const barWidth = 60 * healthPercent;
        
        // Update position
        this.healthBarBg.x = this.sprite.x;
        this.healthBarBg.y = this.sprite.y + 40;
        this.healthBarFill.x = this.sprite.x - (60 - barWidth) / 2;
        this.healthBarFill.y = this.sprite.y + 40;
        
        // Update width
        this.healthBarFill.width = barWidth;
        
        // Update color based on health
        if (healthPercent > 0.6) {
            this.healthBarFill.setFillStyle(0x00ff00); // Green
        } else if (healthPercent > 0.3) {
            this.healthBarFill.setFillStyle(0xffff00); // Yellow
        } else {
            this.healthBarFill.setFillStyle(0xff0000); // Red
        }
    }
    
    updateHealthTint() {
        const healthPercent = this.health / this.maxHealth;
        
        if (healthPercent < 0.3) {
            // Low health - red tint
            this.sprite.setTint(0xff8888);
        } else if (healthPercent < 0.5) {
            // Medium health - slight red tint
            this.sprite.setTint(0xffcccc);
        } else {
            // Good health - no tint
            this.sprite.clearTint();
        }
    }
    
    updateLowHealthEffects() {
        const healthPercent = this.health / this.maxHealth;
        const currentTime = this.scene.time.now;
        
        // Create smoke particles when health is low
        if (healthPercent < 0.3 && currentTime - this.lastSmokeTime > 200) {
            this.createSmokeParticle();
            this.lastSmokeTime = currentTime;
        }
    }
    
    createSmokeParticle() {
        // Create smoke particle at random position near the ship
        const offsetX = Phaser.Math.Between(-20, 20);
        const offsetY = Phaser.Math.Between(-20, 20);
        
        const smoke = this.scene.add.circle(
            this.sprite.x + offsetX,
            this.sprite.y + offsetY,
            Phaser.Math.Between(5, 10),
            0x666666
        );
        smoke.setAlpha(0.7);
        
        // Animate smoke rising and fading
        this.scene.tweens.add({
            targets: smoke,
            y: smoke.y - 30,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            onComplete: () => smoke.destroy()
        });
    }
}