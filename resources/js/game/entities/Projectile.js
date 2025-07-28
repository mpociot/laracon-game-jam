import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Container {
    constructor(scene, x, y, rotation) {
        super(scene, x, y);
        
        // Store scene reference
        this.gameScene = scene;
        
        // Create text object for dd("Sink")
        this.text = scene.add.text(0, 0, 'dd("Sink")', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ff6b6b',
            stroke: '#ffffff',
            strokeThickness: 3
        });
        this.text.setOrigin(0.5);
        this.add(this.text);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Setup projectile properties
        this.setRotation(rotation);
        this.speed = 500;
        
        // Configure physics body
        this.body.setCollideWorldBounds(false);
        this.body.setDrag(0);
        this.body.setFriction(0);
        
        // Calculate velocity based on rotation
        const velocityX = Math.cos(rotation) * this.speed;
        const velocityY = Math.sin(rotation) * this.speed;
        
        this.body.setVelocity(velocityX, velocityY);
        
        // Add slight scale animation for effect
        scene.tweens.add({
            targets: this,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            repeat: -1
        });
        
        // Lifetime
        this.lifespan = 3000; // 3 seconds
        this.createdAt = Date.now();
        
        // Add particle trail
        this.lastParticleTime = 0;
    }
    
    update() {
        // Check if projectile should be destroyed
        const currentTime = Date.now();
        if (currentTime - this.createdAt > this.lifespan) {
            this.destroy();
            return;
        }
        
        // Keep text upright by counter-rotating it
        this.text.setRotation(-this.rotation);
        
        // Create particle trail
        if (currentTime - this.lastParticleTime > 50) {
            this.createTrailParticle();
            this.lastParticleTime = currentTime;
        }
    }
    
    createTrailParticle() {
        if (!this.gameScene || !this.active) return;
        
        const particle = this.gameScene.add.circle(
            this.x,
            this.y,
            2,
            0xFF6B6B
        );
        
        this.gameScene.tweens.add({
            targets: particle,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => particle.destroy()
        });
    }
}