/**
 * CANARY: The Collapse - FPS Player Controller, Oxygen & Helmet Mechanics
 */

class PlayerController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Position & Movement
        this.position = new THREE.Vector3(0, 1.7, 0);
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 3.6;
        this.sprintMultiplier = 1.95;
        this.isSprinting = false;
        this.isMoving = false;
        this.stepTimer = 0;

        // Camera Look Pitch/Yaw
        this.yaw = 0;
        this.pitch = 0;
        this.isLocked = false;

        // Oxygen & Vitals
        this.oxygen = 100.0;
        this.isDead = false;

        // Flashlight (Headlamp)
        this.flashlight = null;
        this.flashlightTarget = null;
        this.isFlashlightOn = true;
        this.isFlashlightMalfunctioning = false;
        this.tapsRequired = 0;
        this.nextMalfunctionCheck = 18.0; // Seconds until next check

        // Physical Tripping Hazard
        this.isStumbled = false;
        this.stumblePitchOffset = 0;
        this.stumbleRecoveryTimer = 0;

        // Head Bobbing
        this.bobCycle = 0;
        this.cameraBaseY = 1.7;

        // Input states
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shift: false
        };

        this.initFlashlight();
        this.initInputListeners();
    }

    initFlashlight() {
        // Spotlight attached to player's helmet
        this.flashlight = new THREE.SpotLight(0xfffae0, 2.8, 42, Math.PI / 4.2, 0.45, 1.4);
        this.flashlight.position.copy(this.camera.position);

        this.flashlightTarget = new THREE.Object3D();
        this.flashlightTarget.position.set(0, 1.7, -5);
        this.flashlight.target = this.flashlightTarget;

        window.gameScene.add(this.flashlight);
        window.gameScene.add(this.flashlightTarget);

        // Subtle ambient player glow (eyes adjust in dark)
        this.ambientBulb = new THREE.PointLight(0xffeedd, 0.25, 4, 2);
        window.gameScene.add(this.ambientBulb);
    }

    initInputListeners() {
        // Pointer Lock for mouse look
        this.domElement.addEventListener('click', () => {
            if (!this.isLocked && !this.isDead && window.gameState && window.gameState.state === 'PLAYING') {
                this.domElement.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = (document.pointerLockElement === this.domElement);
            const lockPrompt = document.getElementById('lock-prompt');
            if (lockPrompt) {
                lockPrompt.style.display = this.isLocked ? 'none' : 'flex';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isLocked || this.isDead) return;
            const sensitivity = 0.0022;
            this.yaw -= e.movementX * sensitivity;
            this.pitch -= e.movementY * sensitivity;
            // Limit vertical pitch (-85 to +85 degrees)
            this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
        });

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (this.isDead) return;
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.shift = true;
                    break;
                case 'KeyF':
                    this.handleHelmetTap();
                    break;
                case 'KeyT':
                    if (window.polaroidSystem && window.gameState && (window.gameState.state === 'PLAYING' || window.gameState.state === 'INSPECTING')) {
                        window.polaroidSystem.toggleInspect();
                        if (window.polaroidSystem.isInspecting) {
                            window.gameState.state = 'INSPECTING';
                            document.exitPointerLock();
                        } else {
                            window.gameState.state = 'PLAYING';
                            this.domElement.requestPointerLock();
                        }
                    }
                    break;
                case 'Escape':
                    if (window.polaroidSystem && window.polaroidSystem.isInspecting) {
                        window.polaroidSystem.toggleInspect();
                        if (window.gameState) window.gameState.state = 'PLAYING';
                    }
                    break;
                case 'KeyE':
                    if (window.eventManager) {
                        window.eventManager.handleInteraction();
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.keys.forward = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.keys.backward = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.keys.shift = false;
                    break;
            }
        });
    }

    handleHelmetTap() {
        if (!this.isFlashlightMalfunctioning) {
            // Player taps helmet anyway
            if (window.soundEngine) window.soundEngine.playHelmetTap();
            return;
        }

        if (window.soundEngine) window.soundEngine.playHelmetTap();
        this.tapsRequired--;

        // Visual spark flicker
        if (this.flashlight) {
            this.flashlight.intensity = 1.2;
            setTimeout(() => {
                if (this.isFlashlightMalfunctioning) this.flashlight.intensity = 0;
            }, 60);
        }

        if (this.tapsRequired <= 0) {
            // Repaired!
            this.isFlashlightMalfunctioning = false;
            if (this.flashlight) this.flashlight.intensity = 2.8;
            const tapAlert = document.getElementById('helmet-tap-alert');
            if (tapAlert) tapAlert.classList.remove('active');
            if (window.eventManager) window.eventManager.showNotification("Senter helm kembali berfungsi!");
        }
    }

    triggerFlashlightMalfunction() {
        if (this.isFlashlightMalfunctioning) return;
        this.isFlashlightMalfunctioning = true;
        this.tapsRequired = Math.floor(1 + Math.random() * 2); // 1 or 2 taps needed

        // Flicker to black
        let flickers = 0;
        const flickInterval = setInterval(() => {
            flickers++;
            if (this.flashlight) {
                this.flashlight.intensity = (flickers % 2 === 0) ? 0.3 : 0;
            }
            if (flickers > 5) {
                clearInterval(flickInterval);
                if (this.flashlight) this.flashlight.intensity = 0;
                const tapAlert = document.getElementById('helmet-tap-alert');
                if (tapAlert) tapAlert.classList.add('active');
                if (window.soundEngine) window.soundEngine.playHelmetTap();
            }
        }, 110);
    }

    triggerStumble() {
        if (this.isStumbled) return;
        this.isStumbled = true;
        this.stumbleRecoveryTimer = 1.6;
        if (window.soundEngine) {
            window.soundEngine.playFootstep(true);
            window.soundEngine.playFootstep(true);
        }
        if (window.eventManager) {
            window.eventManager.showNotification("Tersandung bebatuan licin! Napas terengah-engah!");
        }
        // Lose small burst of O2
        this.oxygen = Math.max(0, this.oxygen - 3.5);
    }

    update(delta, world) {
        if (this.isDead || (window.gameState && window.gameState.state !== 'PLAYING')) return;

        // 1. Oxygen Depletion
        let drainRate = 0.55; // 0.55% per second base
        this.isSprinting = this.keys.shift && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right);

        if (this.isSprinting) {
            drainRate *= 3.0; // 3x faster consumption when sprinting!
        }

        this.oxygen = Math.max(0, this.oxygen - drainRate * delta);
        if (this.oxygen <= 0) {
            this.dieOfHypoxia();
            return;
        }

        // 2. Flashlight Malfunction Random Event Check
        this.nextMalfunctionCheck -= delta;
        if (this.nextMalfunctionCheck <= 0) {
            this.nextMalfunctionCheck = 22.0 + Math.random() * 20.0;
            // 45% chance to malfunction
            if (Math.random() < 0.45) {
                this.triggerFlashlightMalfunction();
            }
        }

        // 3. Tripping Hazard Check when sprinting near puddles/rocks
        if (this.isSprinting && !this.isStumbled) {
            // Check proximity to wet puddles
            world.puddles.forEach(p => {
                if (Math.abs(this.position.z - p.position.z) < 2.0 && Math.abs(this.position.x - p.position.x) < 1.4) {
                    if (Math.random() < 0.04) {
                        this.triggerStumble();
                    }
                }
            });
        }

        // Handle Stumble Recovery
        if (this.isStumbled) {
            this.stumbleRecoveryTimer -= delta;
            // Camera dip shock
            this.stumblePitchOffset = Math.sin(this.stumbleRecoveryTimer * 3.5) * -0.35;
            if (this.stumbleRecoveryTimer <= 0) {
                this.isStumbled = false;
                this.stumblePitchOffset = 0;
            }
        }

        // 4. Movement Calculation
        const speed = (this.isSprinting ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed) * (this.isStumbled ? 0.35 : 1.0);
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        this.velocity.set(0, 0, 0);
        if (this.keys.forward) this.velocity.add(forward);
        if (this.keys.backward) this.velocity.sub(forward);
        if (this.keys.right) this.velocity.add(right);
        if (this.keys.left) this.velocity.sub(right);

        this.isMoving = this.velocity.lengthSq() > 0.001;

        if (this.isMoving) {
            this.velocity.normalize().multiplyScalar(speed * delta);
            const nextX = this.position.x + this.velocity.x;
            const nextZ = this.position.z + this.velocity.z;

            // Tunnel Wall Boundary Collision (-2.2 to +2.2)
            if (Math.abs(nextX) < 2.2) {
                this.position.x = nextX;
            }

            // Rubble Obstacle Collision
            let blockedByRubble = false;
            world.rubbleObjects.forEach(r => {
                if (!r.cleared) {
                    // Check if player trying to walk through rubble
                    const distZ = Math.abs(nextZ - r.z);
                    if (distZ < 2.8 && this.position.z > r.z && nextZ <= r.z + 2.8) {
                        blockedByRubble = true;
                    }
                }
            });

            // Escape Hatch Wall Collision at end
            if (nextZ <= -264) {
                blockedByRubble = true;
            }

            if (!blockedByRubble && nextZ < 8) {
                this.position.z = nextZ;
            }

            // Footsteps sound loop
            this.stepTimer -= delta * (this.isSprinting ? 1.6 : 1.0);
            if (this.stepTimer <= 0) {
                if (window.soundEngine) window.soundEngine.playFootstep(this.isSprinting);
                this.stepTimer = 0.45;
            }

            // Head Bobbing calculation
            this.bobCycle += delta * (this.isSprinting ? 13 : 8.5);
            this.cameraBaseY = 1.7 + Math.sin(this.bobCycle) * (this.isSprinting ? 0.09 : 0.045);
        } else {
            this.cameraBaseY = 1.7;
        }

        // Apply Camera Transformations
        this.camera.position.set(this.position.x, this.cameraBaseY, this.position.z);
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch + this.stumblePitchOffset;

        // Update Flashlight position & direction
        if (this.flashlight && this.flashlightTarget) {
            this.flashlight.position.copy(this.camera.position);
            const lookDir = new THREE.Vector3();
            this.camera.getWorldDirection(lookDir);
            this.flashlightTarget.position.copy(this.camera.position).add(lookDir.multiplyScalar(6));
            if (this.ambientBulb) {
                this.ambientBulb.position.copy(this.camera.position);
            }
        }
    }

    dieOfHypoxia() {
        this.isDead = true;
        if (window.gameState) {
            window.gameState.triggerGameOver("Oksigen habis. Tubuhmu lemas dan pandanganmu menggelap selamanya di kedalaman 780 meter...");
        }
    }
}

window.PlayerController = PlayerController;
