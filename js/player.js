/**
 * CANARY: The Collapse - FPS Player Controller
 * Handles movement along winding ascending tunnel, oxygen drain, headlamp malfunction & physical tripping.
 * Standardized in full English.
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

        // Flashlight (Helmet Headlamp)
        this.flashlight = null;
        this.flashlightTarget = null;
        this.isFlashlightOn = true;
        this.isFlashlightMalfunctioning = false;
        this.tapsRequired = 0;
        this.nextMalfunctionCheck = 18.0;

        // Physical Tripping Hazard
        this.isStumbled = false;
        this.stumblePitchOffset = 0;
        this.stumbleRecoveryTimer = 0;

        // Head Bobbing & Elevation
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
        this.flashlight = new THREE.SpotLight(0xfffae0, 2.9, 44, Math.PI / 4.2, 0.45, 1.4);
        this.flashlight.position.copy(this.camera.position);

        this.flashlightTarget = new THREE.Object3D();
        this.flashlightTarget.position.set(0, 1.7, -5);
        this.flashlight.target = this.flashlightTarget;

        window.gameScene.add(this.flashlight);
        window.gameScene.add(this.flashlightTarget);

        this.ambientBulb = new THREE.PointLight(0xffeedd, 0.25, 4.5, 2);
        window.gameScene.add(this.ambientBulb);
    }

    initInputListeners() {
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
            this.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.pitch));
        });

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
            if (window.soundEngine) window.soundEngine.playHelmetTap();
            return;
        }

        if (window.soundEngine) window.soundEngine.playHelmetTap();
        this.tapsRequired--;

        if (this.flashlight) {
            this.flashlight.intensity = 1.2;
            setTimeout(() => {
                if (this.isFlashlightMalfunctioning) this.flashlight.intensity = 0;
            }, 60);
        }

        if (this.tapsRequired <= 0) {
            this.isFlashlightMalfunctioning = false;
            if (this.flashlight) this.flashlight.intensity = 2.9;
            const tapAlert = document.getElementById('helmet-tap-alert');
            if (tapAlert) tapAlert.classList.remove('active');
            if (window.eventManager) window.eventManager.showNotification("Helmet headlamp contacts restored!");
        }
    }

    triggerFlashlightMalfunction() {
        if (this.isFlashlightMalfunctioning) return;
        this.isFlashlightMalfunctioning = true;
        this.tapsRequired = Math.floor(1 + Math.random() * 2);

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
            window.eventManager.showNotification("Slipped on wet mine rocks! Lost stamina and breath!");
        }
        this.oxygen = Math.max(0, this.oxygen - 3.5);
    }

    update(delta, world) {
        if (this.isDead || (window.gameState && window.gameState.state !== 'PLAYING')) return;

        // 1. Oxygen Depletion
        let drainRate = 0.52;
        this.isSprinting = this.keys.shift && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right);

        if (this.isSprinting) {
            drainRate *= 3.0; // 3x faster consumption when sprinting
        }

        this.oxygen = Math.max(0, this.oxygen - drainRate * delta);
        if (this.oxygen <= 0) {
            this.dieOfHypoxia();
            return;
        }

        // 2. Headlamp Malfunction Random Check
        this.nextMalfunctionCheck -= delta;
        if (this.nextMalfunctionCheck <= 0) {
            this.nextMalfunctionCheck = 22.0 + Math.random() * 20.0;
            if (Math.random() < 0.45) {
                this.triggerFlashlightMalfunction();
            }
        }

        // 3. Tripping Hazard Check on wet mud / puddles
        if (this.isSprinting && !this.isStumbled) {
            world.puddles.forEach(p => {
                if (Math.hypot(this.position.x - p.position.x, this.position.z - p.position.z) < 1.6) {
                    if (Math.random() < 0.05) {
                        this.triggerStumble();
                    }
                }
            });
        }

        if (this.isStumbled) {
            this.stumbleRecoveryTimer -= delta;
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

            // Follow curved tunnel centerline X_center(z) with boundary width 2.3m
            const pathCenter = world.getPathX(nextZ);
            const distFromCenter = Math.abs(nextX - pathCenter);

            let canMoveX = distFromCenter < 2.3;
            let blockedByRubble = false;

            // Rubble Obstacle Collision
            world.rubbleObjects.forEach(r => {
                if (!r.cleared) {
                    const distToRubble = Math.hypot(nextX - r.x, nextZ - r.z);
                    if (distToRubble < 2.8) {
                        blockedByRubble = true;
                    }
                }
            });

            // Surface Hatch bunker collision at z = -262
            if (nextZ <= -261.5) {
                blockedByRubble = true;
            }

            if (canMoveX && !blockedByRubble) {
                this.position.x = nextX;
            }

            if (!blockedByRubble && nextZ < 6.5) {
                this.position.z = nextZ;
            }

            // Footstep sounds
            this.stepTimer -= delta * (this.isSprinting ? 1.6 : 1.0);
            if (this.stepTimer <= 0) {
                if (window.soundEngine) window.soundEngine.playFootstep(this.isSprinting);
                this.stepTimer = 0.45;
            }

            // Head Bobbing
            this.bobCycle += delta * (this.isSprinting ? 13 : 8.5);
        }

        // Natural Climbing Elevation Y along the ascending path
        const currentGroundY = world.getPathY(this.position.z);
        const bobOffset = this.isMoving ? Math.sin(this.bobCycle) * (this.isSprinting ? 0.09 : 0.045) : 0;
        this.cameraBaseY = currentGroundY + 1.7 + bobOffset;
        this.position.y = currentGroundY;

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
            window.gameState.triggerGameOver("Oxygen depleted. Your vision fades into eternal darkness at 780 meters below the surface...");
        }
    }
}

window.PlayerController = PlayerController;
