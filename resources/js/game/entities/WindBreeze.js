import Phaser from 'phaser';

export default class WindBreeze extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'windBreeze');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Setup wind breeze properties
        this.setScale(1.5);
        this.setAlpha(0.7);
        
        // Floating animation
        this.floatTween = scene.tweens.add({
            targets: this,
            y: y - 20,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Rotation animation
        this.rotationTween = scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 4000,
            repeat: -1
        });
        
        // Pulsing effect
        this.pulseTween = scene.tweens.add({
            targets: this,
            scale: 2,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Lifetime
        this.lifespan = 15000; // 15 seconds
        this.createdAt = scene.time.now;
    }
    
    update() {
        // Check if wind breeze should disappear
        if (this.scene.time.now - this.createdAt > this.lifespan) {
            this.fadeOut();
        }
    }
    
    fadeOut() {
        // Stop all tweens
        this.floatTween.stop();
        this.rotationTween.stop();
        this.pulseTween.stop();
        
        // Fade out and destroy
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0,
            duration: 500,
            onComplete: () => {
                this.destroy();
            }
        });
    }
    
    destroy() {
        // Clean up tweens
        if (this.floatTween) this.floatTween.stop();
        if (this.rotationTween) this.rotationTween.stop();
        if (this.pulseTween) this.pulseTween.stop();
        
        super.destroy();
    }
}