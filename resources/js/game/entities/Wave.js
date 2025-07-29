import Phaser from 'phaser';

export default class Wave extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, waveId) {
        super(scene, x, y, 'wave');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.08);
        this.setDepth(3);
        
        // Unique ID for multiplayer synchronization
        this.waveId = waveId;
        
        // Speed boost properties
        this.speedBoostAmount = 1.5; // 50% speed increase
        this.speedBoostDuration = 5000; // 5 seconds
        
        // Visual effects
        this.floatTween = scene.tweens.add({
            targets: this,
            y: y - 10,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Rotation effect
        this.rotateTween = scene.tweens.add({
            targets: this,
            rotation: Math.PI * 2,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // Subtle pulsing effect
        this.pulseTween = scene.tweens.add({
            targets: this,
            scale: 0.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    collect() {
        // Stop all tweens
        if (this.floatTween) this.floatTween.stop();
        if (this.rotateTween) this.rotateTween.stop();
        if (this.pulseTween) this.pulseTween.stop();
        
        // Collection animation
        this.scene.tweens.add({
            targets: this,
            scale: 0.2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
        
        // Create particle effect
        for (let i = 0; i < 10; i++) {
            const particle = this.scene.add.circle(
                this.x + Phaser.Math.Between(-20, 20),
                this.y + Phaser.Math.Between(-20, 20),
                Phaser.Math.Between(3, 6),
                0x87CEEB
            );
            particle.setAlpha(0.7);
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Phaser.Math.Between(-50, 50),
                y: particle.y + Phaser.Math.Between(-50, 50),
                alpha: 0,
                scale: 0,
                duration: 800,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
    }
}