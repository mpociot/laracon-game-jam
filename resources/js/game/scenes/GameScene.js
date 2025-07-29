import Phaser from 'phaser';
import Player from '../entities/Player';
import Projectile from '../entities/Projectile';
import Wave from '../entities/Wave';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.score = 0;
        this.projectiles = null;

        // Mobile controls
        this.mobileInput = { x: 0, y: 0, shooting: false };
        this.joystickActive = false;

        // Multiplayer
        this.players = new Map();
        this.localPlayerId = null;
        this.localPlayerName = null;
        this.echoChannel = null;
        this.lastMoveBroadcast = 0;
        this.lastPlayerPosition = { x: 0, y: 0, rotation: 0 };
        
        // Waves
        this.waves = new Map();
        this.nextWaveId = 1;
        this.lastWaveSpawnTime = 0;
        this.waveSpawnInterval = 15000; // Spawn a wave every 15 seconds
        
        // Leaderboard tracking
        this.playerScores = new Map();
        this.lastScoreBroadcast = 0;
    }

    create() {
        // Get game dimensions
        const { width, height } = this.scale;

        // Create world size based on screen size but larger for exploration
        this.worldWidth = Math.max(width * 2, 2560);
        this.worldHeight = Math.max(height * 2, 1440);

        // Create tiled ocean background with scrolling effect
        this.oceanBackground = this.add.tileSprite(0, 0, this.worldWidth, this.worldHeight, 'water-tile').setOrigin(0, 0);
        this.oceanBackground.setScrollFactor(0.5); // Parallax effect

        // Get multiplayer data
        if (window.gameData) {
            this.localPlayerId = window.gameData.playerId;
            this.localPlayerName = window.gameData.playerName;
            this.echoChannel = window.gameData.echoChannel;
            this.setupMultiplayer();
        }

        // Create player at center of screen
        this.player = new Player(this, width / 2, height / 2);
        this.player.playerId = this.localPlayerId;
        this.player.playerName = this.localPlayerName;
        
        // Initialize our score in the leaderboard
        this.playerScores.set(this.localPlayerId, {
            name: this.localPlayerName,
            score: 0
        });
        this.updateLeaderboard();

        // Initialize last position
        this.lastPlayerPosition = {
            x: this.player.sprite.x,
            y: this.player.sprite.y,
            rotation: this.player.sprite.rotation
        };

        // Add name label
        this.player.nameLabel = this.add.text(this.player.sprite.x, this.player.sprite.y - 40, this.localPlayerName, {
            fontFamily: 'Press Start 2P',
            fontSize: '12px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Create groups
        this.projectiles = this.physics.add.group();
        this.otherProjectiles = this.physics.add.group(); // For other players' projectiles
        this.wavesGroup = this.physics.add.group(); // For wave power-ups

        // Set up collisions - only player vs other players' projectiles
        this.physics.add.overlap(this.player.sprite, this.otherProjectiles, this.hitByProjectile, null, this);

        // Store reference to collision handler for other players
        this.otherPlayersGroup = this.physics.add.group();

        // Set up collision between our projectiles and other players
        this.physics.add.overlap(this.projectiles, this.otherPlayersGroup, this.projectileHitOtherPlayer, null, this);
        
        // Set up collision between player and waves
        this.physics.add.overlap(this.player.sprite, this.wavesGroup, this.collectWave, null, this);

        // No need to broadcast join - presence channel handles it

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
        
        // Broadcast score updates periodically (every 2 seconds)
        if (time - this.lastScoreBroadcast > 2000) {
            this.playerScores.set(this.localPlayerId, {
                name: this.localPlayerName,
                score: this.score
            });
            this.broadcastScore();
            this.updateLeaderboard();
            this.lastScoreBroadcast = time;
        }

        // Update player with both keyboard and mobile input
        this.player.update(this.cursors, this.mobileInput);

        // Update name label position
        if (this.player.nameLabel) {
            this.player.nameLabel.x = this.player.sprite.x;
            this.player.nameLabel.y = this.player.sprite.y - 40;
        }

        // Broadcast movement if changed (throttled)
        if (this.echoChannel && time - this.lastMoveBroadcast > 50) { // 20 times per second
            const hasPositionChanged =
                Math.abs(this.lastPlayerPosition.x - this.player.sprite.x) > 0.5 ||
                Math.abs(this.lastPlayerPosition.y - this.player.sprite.y) > 0.5 ||
                Math.abs(this.lastPlayerPosition.rotation - this.player.sprite.rotation) > 0.01;

            if (hasPositionChanged) {
                this.broadcastPlayerMoved();
                this.lastMoveBroadcast = time;

                // Update last known position
                this.lastPlayerPosition.x = this.player.sprite.x;
                this.lastPlayerPosition.y = this.player.sprite.y;
                this.lastPlayerPosition.rotation = this.player.sprite.rotation;
            }
        }

        // Handle shooting
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.mobileInput.shooting) {
            if (this.player.canShoot()) {
                this.shoot();
                this.player.startReload();
            }
            this.mobileInput.shooting = false; // Reset after shooting
        }

        // Update other players
        this.players.forEach((otherPlayer, playerId) => {
            if (otherPlayer.targetX !== undefined && otherPlayer.targetY !== undefined) {
                // Smooth interpolation
                otherPlayer.sprite.x = Phaser.Math.Linear(otherPlayer.sprite.x, otherPlayer.targetX, 0.15);
                otherPlayer.sprite.y = Phaser.Math.Linear(otherPlayer.sprite.y, otherPlayer.targetY, 0.15);
                otherPlayer.sprite.rotation = Phaser.Math.Angle.RotateTo(otherPlayer.sprite.rotation, otherPlayer.targetRotation, 0.15);

                // Update name label
                if (otherPlayer.nameLabel) {
                    otherPlayer.nameLabel.x = otherPlayer.sprite.x;
                    otherPlayer.nameLabel.y = otherPlayer.sprite.y - 40;
                }

                // Update health bar position
                if (otherPlayer.healthBarBg) {
                    otherPlayer.healthBarBg.x = otherPlayer.sprite.x;
                    otherPlayer.healthBarBg.y = otherPlayer.sprite.y + 40;
                }
                if (otherPlayer.healthBarFill) {
                    const healthPercent = otherPlayer.health / otherPlayer.maxHealth;
                    const barWidth = 60 * healthPercent;
                    otherPlayer.healthBarFill.x = otherPlayer.sprite.x - (60 - barWidth) / 2;
                    otherPlayer.healthBarFill.y = otherPlayer.sprite.y + 40;
                    otherPlayer.healthBarFill.width = barWidth;

                    // Update color based on health
                    if (healthPercent > 0.6) {
                        otherPlayer.healthBarFill.setFillStyle(0x00ff00); // Green
                    } else if (healthPercent > 0.3) {
                        otherPlayer.healthBarFill.setFillStyle(0xffff00); // Yellow
                    } else {
                        otherPlayer.healthBarFill.setFillStyle(0xff0000); // Red
                    }
                }

                // Create smoke particles for low health other players
                const healthPercent = otherPlayer.health / otherPlayer.maxHealth;
                const currentTime = this.time.now;
                
                if (healthPercent < 0.3 && currentTime - (otherPlayer.lastSmokeTime || 0) > 200) {
                    this.createSmokeParticleForOtherPlayer(otherPlayer);
                    otherPlayer.lastSmokeTime = currentTime;
                }
            }
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

        // Update other players' projectiles
        this.otherProjectiles.children.entries.forEach(projectile => {
            // Only call update if it's our custom Projectile class
            if (projectile.update && typeof projectile.update === 'function') {
                projectile.update();
            }

            // Remove projectiles that are out of bounds
            if (projectile.x < 0 || projectile.x > this.worldWidth || projectile.y < 0 || projectile.y > this.worldHeight) {
                projectile.destroy();
            }
        });
        
        // Spawn waves periodically
        if (time - this.lastWaveSpawnTime > this.waveSpawnInterval) {
            this.spawnWave();
            this.lastWaveSpawnTime = time;
        }
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
            direction,
            this.localPlayerId,
            this.localPlayerName
        );

        // Add to group and ensure velocity is maintained
        this.projectiles.add(projectile);

        // Re-apply velocity after adding to group (in case it gets reset)
        const speed = 500;
        const velocityX = Math.cos(direction) * speed;
        const velocityY = Math.sin(direction) * speed;
        projectile.body.setVelocity(velocityX, velocityY);

        projectile.body.setSize(20, 10); // Set physics body size

        // Broadcast shot
        if (this.echoChannel) {
            this.broadcastPlayerShot(spawnX, spawnY, direction);
        }
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

    setupMultiplayer() {
        if (!this.echoChannel) {
            this.echoChannel = window.Echo.join('game');
        }

        console.log('setupMultiplayer');

        // Handle presence channel events
        this.echoChannel
            .here((users) => {
                console.log('here', users);
                // Users already in the channel
                users.forEach(user => {
                    console.log('User in channel:', user);
                    if (user.id !== this.localPlayerId) {
                        this.addOtherPlayer({
                            playerId: user.id,
                            playerName: user.name || 'Unknown',
                            x: this.worldWidth / 2,
                            y: this.worldHeight / 2
                        });
                    }
                });

                // Broadcast our initial position and score to all existing players
                setTimeout(() => {
                    this.broadcastPlayerMoved();
                    this.broadcastScore();
                }, 100);
            })
            .joining((user) => {
                console.log('joining', user);
                // User joining the channel
                if (user.id !== this.localPlayerId) {
                    this.addOtherPlayer({
                        playerId: user.id,
                        playerName: user.name || 'Unknown',
                        x: this.worldWidth / 2,
                        y: this.worldHeight / 2
                    });

                    // When someone new joins, broadcast our current position and score to them
                    setTimeout(() => {
                        this.broadcastPlayerMoved();
                        this.broadcastScore();
                    }, 100);
                }
            })
            .leaving((user) => {
                console.log('leaving', user);
                // User leaving the channel
                this.removeOtherPlayer(user.id);
            })
            .error((error) => {
                console.error('Channel error:', error);
            });

        // Listen for whisper events (client-to-client)
        this.echoChannel.listenForWhisper('playerMoved', (data) => {
            if (data.playerId !== this.localPlayerId) {
                this.updateOtherPlayer(data);
            }
        });

        // Listen for whisper events instead of server events
        this.echoChannel.listenForWhisper('playerShot', (data) => {
            console.log('playerShot whisper received:', data);
            if (data.playerId !== this.localPlayerId) {
                this.createOtherPlayerProjectile(data);
            }
        });

        this.echoChannel.listenForWhisper('playerDamaged', (data) => {
            if (data.playerId !== this.localPlayerId) {
                this.updateOtherPlayerHealth(data);
            }
        });
        
        // Listen for wave events
        this.echoChannel.listenForWhisper('waveSpawned', (data) => {
            this.createOtherWave(data);
        });
        
        this.echoChannel.listenForWhisper('waveCollected', (data) => {
            this.removeWave(data.waveId);
        });

        // Listen for player death
        this.echoChannel.listenForWhisper('playerDied', (data) => {
            if (data.playerId !== this.localPlayerId) {
                this.removeOtherPlayer(data.playerId);
            }
        });
        
        // Listen for score updates
        this.echoChannel.listenForWhisper('scoreUpdate', (data) => {
            this.playerScores.set(data.playerId, {
                name: data.name,
                score: data.score
            });
            this.updateLeaderboard();
        });

        // Handle window close/refresh
        window.addEventListener('beforeunload', () => {
            this.echoChannel.unsubscribe();
        });
    }

    broadcastPlayerMoved() {
        // Use whisper for real-time movement (client-to-client)
        this.echoChannel.whisper('playerMoved', {
            playerId: this.localPlayerId,
            x: this.player.sprite.x,
            y: this.player.sprite.y,
            rotation: this.player.sprite.rotation,
            speed: this.player.currentSpeed,
            health: this.player.health,
            flipX: this.player.sprite.flipX,
            facingDirection: this.player.facingDirection
        });
    }

    broadcastPlayerShot(x, y, direction) {
        console.log('Broadcasting shot:', { playerId: this.localPlayerId, x, y, direction });
        // Use whisper for real-time shooting (client-to-client)
        this.echoChannel.whisper('playerShot', {
            playerId: this.localPlayerId,
            playerName: this.localPlayerName,
            x: x,
            y: y,
            direction: direction
        });
    }

    broadcastPlayerDamaged() {
        // Use whisper for real-time damage updates (client-to-client)
        this.echoChannel.whisper('playerDamaged', {
            playerId: this.localPlayerId,
            health: this.player.health,
            damage: 10
        });
    }

    addOtherPlayer(data) {
        const otherPlayer = {
            playerId: data.playerId,
            playerName: data.playerName,
            sprite: this.physics.add.sprite(data.x, data.y, 'boat'),
            nameLabel: null,
            healthBarBg: null,
            healthBarFill: null,
            health: 100,
            maxHealth: 100,
            targetX: data.x,
            targetY: data.y,
            targetRotation: 0,
            facingDirection: Math.PI
        };
        
        // Add to leaderboard with 0 score
        this.playerScores.set(data.playerId, {
            name: data.playerName,
            score: 0
        });
        this.updateLeaderboard();

        console.log('adding other player', otherPlayer);
        console.log('Player name:', data.playerName);
        otherPlayer.sprite.setScale(0.15);
        otherPlayer.sprite.setDepth(5);

        // Add to physics group for collision detection
        this.otherPlayersGroup.add(otherPlayer.sprite);

        // Add name label
        const displayName = data.playerName || 'Unknown Player';
        otherPlayer.nameLabel = this.add.text(data.x, data.y - 40, displayName, {
            fontFamily: 'Press Start 2P',
            fontSize: '12px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        otherPlayer.nameLabel.setDepth(12);

        // Add health bar
        otherPlayer.healthBarBg = this.add.rectangle(
            data.x,
            data.y + 40,
            60,
            8,
            0x333333
        );
        otherPlayer.healthBarBg.setStrokeStyle(2, 0x000000);
        otherPlayer.healthBarBg.setDepth(10);

        otherPlayer.healthBarFill = this.add.rectangle(
            data.x,
            data.y + 40,
            60,
            8,
            0x00ff00
        );
        otherPlayer.healthBarFill.setDepth(11);

        this.players.set(data.playerId, otherPlayer);
    }

    updateOtherPlayer(data) {
        const otherPlayer = this.players.get(data.playerId);
        if (otherPlayer) {
            otherPlayer.targetX = data.x;
            otherPlayer.targetY = data.y;
            otherPlayer.targetRotation = data.rotation;
            if (data.health !== undefined) {
                otherPlayer.health = data.health;
                // Apply health tint based on current health
                this.updateOtherPlayerHealthTint(otherPlayer);
            }
            if (data.flipX !== undefined) {
                otherPlayer.sprite.setFlipX(data.flipX);
            }
            if (data.facingDirection !== undefined) {
                otherPlayer.facingDirection = data.facingDirection;
            }
        }
    }

    createOtherPlayerProjectile(data) {
        const projectile = new Projectile(
            this,
            data.x,
            data.y,
            data.direction,
            data.playerId,
            data.playerName
        );

        this.otherProjectiles.add(projectile);

        const speed = 500;
        const velocityX = Math.cos(data.direction) * speed;
        const velocityY = Math.sin(data.direction) * speed;
        projectile.body.setVelocity(velocityX, velocityY);
        projectile.body.setSize(20, 10);
    }

    updateOtherPlayerHealth(data) {
        const otherPlayer = this.players.get(data.playerId);
        if (otherPlayer) {
            // Update health value
            otherPlayer.health = data.health;

            // Check if player died
            if (otherPlayer.health <= 0) {
                // Player died - remove them with death animation
                this.tweens.add({
                    targets: otherPlayer.sprite,
                    alpha: 0,
                    scale: 0,
                    rotation: otherPlayer.sprite.rotation + Math.PI * 2,
                    duration: 1000,
                    onComplete: () => {
                        this.removeOtherPlayer(data.playerId);
                    }
                });
                return;
            }

            // Flash red and apply damage tint
            otherPlayer.sprite.setTint(0xff0000);
            this.time.delayedCall(200, () => {
                this.updateOtherPlayerHealthTint(otherPlayer);
            });

            // Flash the other player's sprite
            this.tweens.add({
                targets: otherPlayer.sprite,
                alpha: 0.3,
                duration: 100,
                repeat: 3,
                yoyo: true
            });

            // Start smoke effect tracking for low health
            if (!otherPlayer.lastSmokeTime) {
                otherPlayer.lastSmokeTime = 0;
            }
        }
    }

    updateOtherPlayerHealthTint(otherPlayer) {
        const healthPercent = otherPlayer.health / otherPlayer.maxHealth;
        
        if (healthPercent < 0.3) {
            // Low health - red tint
            otherPlayer.sprite.setTint(0xff8888);
        } else if (healthPercent < 0.5) {
            // Medium health - slight red tint
            otherPlayer.sprite.setTint(0xffcccc);
        } else {
            // Good health - no tint
            otherPlayer.sprite.clearTint();
        }
    }

    createSmokeParticleForOtherPlayer(otherPlayer) {
        // Create smoke particle at random position near the ship
        const offsetX = Phaser.Math.Between(-20, 20);
        const offsetY = Phaser.Math.Between(-20, 20);
        
        const smoke = this.add.circle(
            otherPlayer.sprite.x + offsetX,
            otherPlayer.sprite.y + offsetY,
            Phaser.Math.Between(5, 10),
            0x666666
        );
        smoke.setAlpha(0.7);
        
        // Animate smoke rising and fading
        this.tweens.add({
            targets: smoke,
            y: smoke.y - 30,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            onComplete: () => smoke.destroy()
        });
    }

    removeOtherPlayer(playerId) {
        const otherPlayer = this.players.get(playerId);
        if (otherPlayer) {
            otherPlayer.sprite.destroy();
            if (otherPlayer.nameLabel) {
                otherPlayer.nameLabel.destroy();
            }
            if (otherPlayer.healthBarBg) {
                otherPlayer.healthBarBg.destroy();
            }
            if (otherPlayer.healthBarFill) {
                otherPlayer.healthBarFill.destroy();
            }
            this.players.delete(playerId);
        }
        
        // Remove from leaderboard
        this.playerScores.delete(playerId);
        this.updateLeaderboard();
    }

    hitByProjectile(player, projectile) {
        // Damage player with shooter's name
        this.player.takeDamage(15, projectile.shooterName);

        // Destroy projectile
        projectile.destroy();

        // Flash effect
        this.cameras.main.flash(250, 255, 0, 0);

        // Broadcast damage
        if (this.echoChannel) {
            this.broadcastPlayerDamaged();
        }
    }

    projectileHitOtherPlayer(projectile, otherPlayerSprite) {
        // Find which player was hit
        let hitPlayerId = null;
        this.players.forEach((player, playerId) => {
            if (player.sprite === otherPlayerSprite) {
                hitPlayerId = playerId;
            }
        });

        if (hitPlayerId) {
            // Update score for hitting another player
            this.score += 50;

            // Destroy projectile
            projectile.destroy();

            // Visual feedback - flash the hit player
            this.tweens.add({
                targets: otherPlayerSprite,
                alpha: 0.3,
                duration: 100,
                repeat: 3,
                yoyo: true
            });
        }
    }

    showGameOver(killerName = null) {
        // Don't pause the scene - just stop physics
        this.physics.pause();

        // Get camera dimensions
        const { width, height } = this.scale;

        // Create semi-transparent overlay that covers the entire screen
        const overlay = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.7
        );
        overlay.setScrollFactor(0);
        overlay.setDepth(1000);

        // Game over title
        const gameOverText = this.add.text(
            width / 2,
            height / 2 - 100,
            '500 Server Error',
            {
                fontFamily: 'monospace',
                fontSize: '48px',
                color: '#ff0000',
                align: 'center'
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(1001);

        // Subtitle with killer's name
        const killerMessage = killerName 
            ? `${killerName} ran "php artisan down" on your ship!`
            : 'Ship Not Found';
        const subtitleText = this.add.text(
            width / 2,
            height / 2 - 40,
            killerMessage,
            {
                fontFamily: 'monospace',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }
        );
        subtitleText.setOrigin(0.5);
        subtitleText.setScrollFactor(0);
        subtitleText.setDepth(1001);

        // Score text
        const scoreText = this.add.text(
            width / 2,
            height / 2 + 20,
            `Final Score: ${this.score}`,
            {
                fontFamily: 'monospace',
                fontSize: '32px',
                color: '#00ff00',
                align: 'center'
            }
        );
        scoreText.setOrigin(0.5);
        scoreText.setScrollFactor(0);
        scoreText.setDepth(1001);

        // Restart button background
        const buttonBg = this.add.rectangle(
            width / 2,
            height / 2 + 100,
            200,
            50,
            0x4CAF50
        );
        buttonBg.setScrollFactor(0);
        buttonBg.setDepth(1001);
        buttonBg.setInteractive({ useHandCursor: true });

        // Restart button text
        const restartText = this.add.text(
            width / 2,
            height / 2 + 100,
            'RESTART',
            {
                fontFamily: 'monospace',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center'
            }
        );
        restartText.setOrigin(0.5);
        restartText.setScrollFactor(0);
        restartText.setDepth(1002);

        // Button hover effect
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x45a049);
            restartText.setScale(1.1);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x4CAF50);
            restartText.setScale(1);
        });

        // Button click handler
        buttonBg.on('pointerdown', () => {
            location.reload();
        });

        // Add some animation to the texts
        this.tweens.add({
            targets: gameOverText,
            scale: { from: 0, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: subtitleText,
            scale: { from: 0, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            delay: 200,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: scoreText,
            scale: { from: 0, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            delay: 400,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: [buttonBg, restartText],
            scale: { from: 0, to: 1 },
            alpha: { from: 0, to: 1 },
            duration: 500,
            delay: 600,
            ease: 'Back.easeOut'
        });
    }
    
    spawnWave() {
        // Generate random position within world bounds
        const margin = 100;
        const x = Phaser.Math.Between(margin, this.worldWidth - margin);
        const y = Phaser.Math.Between(margin, this.worldHeight - margin);
        const waveId = `${this.localPlayerId}_${this.nextWaveId++}`;
        
        // Create the wave
        const wave = new Wave(this, x, y, waveId);
        this.wavesGroup.add(wave);
        this.waves.set(waveId, wave);
        
        // Broadcast wave spawn to other players
        if (this.echoChannel) {
            this.echoChannel.whisper('waveSpawned', {
                waveId: waveId,
                x: x,
                y: y
            });
        }
    }
    
    collectWave(playerSprite, wave) {
        // Apply speed boost to player
        this.player.applySpeedBoost(wave.speedBoostAmount, wave.speedBoostDuration);
        
        // Update score
        this.score += 25;
        
        // Collect the wave (plays animation and destroys it)
        wave.collect();
        
        // Remove from our tracking
        this.waves.delete(wave.waveId);
        
        // Broadcast wave collection
        if (this.echoChannel) {
            this.echoChannel.whisper('waveCollected', {
                playerId: this.localPlayerId,
                waveId: wave.waveId
            });
        }
    }
    
    createOtherWave(data) {
        // Don't create waves we already have
        if (this.waves.has(data.waveId)) {
            return;
        }
        
        const wave = new Wave(this, data.x, data.y, data.waveId);
        this.wavesGroup.add(wave);
        this.waves.set(data.waveId, wave);
    }
    
    removeWave(waveId) {
        const wave = this.waves.get(waveId);
        if (wave) {
            wave.destroy();
            this.waves.delete(waveId);
        }
    }
    
    updateLeaderboard() {
        // Sort players by score
        const sortedPlayers = Array.from(this.playerScores.entries())
            .sort((a, b) => b[1].score - a[1].score)
            .slice(0, 5); // Top 5 players
        
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) return;
        
        leaderboardList.innerHTML = '';
        
        sortedPlayers.forEach((entry, index) => {
            const [playerId, data] = entry;
            const entryDiv = document.createElement('div');
            entryDiv.className = 'flex justify-between items-center text-xs mb-2';
            
            const rankSpan = document.createElement('span');
            rankSpan.className = 'text-yellow-400 min-w-[20px]';
            rankSpan.textContent = `${index + 1}.`;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'flex-1 mx-2 whitespace-nowrap overflow-hidden text-ellipsis';
            nameSpan.textContent = data.name;
            
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'text-green-400 min-w-[60px] text-right';
            scoreSpan.textContent = data.score.toString();
            
            entryDiv.appendChild(rankSpan);
            entryDiv.appendChild(nameSpan);
            entryDiv.appendChild(scoreSpan);
            
            leaderboardList.appendChild(entryDiv);
        });
    }
    
    broadcastScore() {
        if (this.echoChannel) {
            this.echoChannel.whisper('scoreUpdate', {
                playerId: this.localPlayerId,
                name: this.localPlayerName,
                score: this.score
            });
        }
    }
}
