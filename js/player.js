/**
 * CANARY: The Collapse - FPS Player Controller
 * Features:
 * - Dramatic Rockslide Tumble: Player slips and rolls 720 degrees down the steep chute into the lower flooded rift.
 * - Dynamic route switch after tumbling.
 * - Critical Oxygen Leak Climax: Unassisted high-tension oxygen depletion in the final stretch towards the surface hatch.
 * - Solid non-slippery foot friction & responsive camera controls.
 */

class PlayerController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Position & Movement
        this.position = new THREE.Vector3(0, 1.7, 0);
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 3.4;
        this.sprintMultiplier = 1.75;
        this.isSprinting = false;
        this.isMoving = false;
        this.stepTimer = 0;

        // Camera Look Pitch/Yaw/Roll
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0; // Roll angle used for dramatic tumbling
        this.isLocked = false;
        this.sensitivity = 0.0016;

        // Oxygen & Vitals
        this.oxygen = 100.0;
        this.isDead = false;
        this.isRespiratorLeaking = false;

        // Cinematic Tumble & Roll Event
        this.hasTumbled = false;
        this.isTumbling = false;
        this.tumbleTimer = 0;
        this.tumbleDuration = 2.2;
        this.tumbleStartZ = -140;
        this.tumbleEndZ = -162;

        // Flashlight (Helmet Headlamp)
        this.flashlight = null;
        this.flashlightTarget = null;
        this.isFlashlightOn = true;
        this.isFlashlightMalfunctioning = false;
        this.tapsRequired = 0;
        this.nextMalfunctionCheck = 28.0;

        // Physical Tripping Hazard
        this.isStumbled = false;
        this.stumblePitchOffset = 0;
        this.stumbleRecoveryTimer = 0;

        // Head Bobbing & Elevation
        this.bobCycle = 0;
        this.cameraBaseY = 1.7;

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
        this.flashlight = new THREE.SpotLight(0xfffae0, 3.6, 54, Math.PI / 3.2, 0.45, 1.2);
        this.flashlight.position.copy(this.camera.position);

        this.flashlightTarget = new THREE.Object3D();
        this.flashlightTarget.position.set(0, 1.7, -5);
        this.flashlight.target = this.flashlightTarget;

        window.gameScene.add(this.flashlight);
        window.gameScene.add(this.flashlightTarget);

        this.ambientBulb = new THREE.PointLight(0xffeedd, 0.6, 8.5, 2);
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
            if (!this.isLocked || this.isDead || this.isTumbling) return;
            this.yaw -= e.movementX * this.sensitivity;
            this.pitch -= e.movementY * this.sensitivity;
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
        });

        window.addEventListener('keydown', (e) => {
            if (this.isDead || this.isTumbling) return;
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
            this.flashlight.intensity = 1.4;
            setTimeout(() => {
                if (this.isFlashlightMalfunctioning) this.flashlight.intensity = 0;
            }, 60);
        }

        if (this.tapsRequired <= 0) {
            this.isFlashlightMalfunctioning = false;
            if (this.flashlight) this.flashlight.intensity = 3.6;
            const tapAlert = document.getElementById('helmet-tap-alert');
            if (tapAlert) tapAlert.classList.remove('active');
            if (window.eventManager) window.eventManager.showNotification("Helmet headlamp contacts restored!");
        }
    }

    triggerFlashlightMalfunction() {
        if (this.isFlashlightMalfunctioning || this.isTumbling) return;
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
                if (window.gameState) window.gameState.triggerMonologue("headlamp");
            }
        }, 110);
    }

    // -------------------------------------------------------------
    // CINEMATIC ROCKSLIDE TUMBLE & ROUTE SWITCH
    // -------------------------------------------------------------
    triggerRockslideTumble() {
        if (this.hasTumbled || this.isTumbling) return;
        this.hasTumbled = true;
        this.isTumbling = true;
        this.tumbleTimer = 0;

        // Play heavy tumbling earthquake & rock shatter sound
        if (window.soundEngine) {
            window.soundEngine.playEarthquake(3.5);
            window.soundEngine.playWaterSplash(true);
            window.soundEngine.setTinnitus(0.25);
            setTimeout(() => {
                if (window.soundEngine) window.soundEngine.setTinnitus(0.0001);
            }, 3000);
        }

        if (window.eventManager) {
            window.eventManager.triggerScreenShake(2.2, 18);
            window.eventManager.showNotification("PRECIPICE COLLAPSE! SLIDING AND TUMBLING DOWN THE SHAFT!");
        }

        // Damage respirator seal -> starts high tension unassisted oxygen leak
        this.isRespiratorLeaking = true;
        this.oxygen = Math.max(12, this.oxygen - 18.0); // Loses burst of air in the fall
    }

    updateTumble(delta, world) {
        this.tumbleTimer += delta;
        const progress = Math.min(1.0, this.tumbleTimer / this.tumbleDuration);

        // Smooth cubic plunge along the steep chute
        const easeT = progress * progress * (3 - 2 * progress);
        this.position.z = THREE.MathUtils.lerp(this.tumbleStartZ, this.tumbleEndZ, easeT);
        this.position.x = world.getPathX(this.position.z);
        this.position.y = world.getPathY(this.position.z);

        // Violent tumbling camera roll: 720 degrees (2 full barrel rolls)
        this.roll = progress * Math.PI * 4;
        this.pitch = Math.sin(progress * Math.PI * 6) * 0.45;

        // Flashlight flickers violently during the tumble
        if (this.flashlight) {
            this.flashlight.intensity = Math.random() > 0.4 ? 2.5 : 0.2;
        }

        if (progress >= 1.0) {
            // Landed into the flooded drainage rift pool!
            this.isTumbling = false;
            this.roll = 0;
            this.pitch = 0;

            if (this.flashlight) this.flashlight.intensity = 3.6;
            if (window.soundEngine) window.soundEngine.playWaterSplash(true);

            // Trigger dramatic post-tumble monologue
            if (window.gameState) {
                window.gameState.triggerMonologue("tumbleLanded");
            }

            if (window.eventManager) {
                window.eventManager.showNotification("CRITICAL RESPIRATOR DAMAGE! VALVE COMPROMISED - OXYGEN LEAKING!");
            }
        }
    }

    triggerStumble() {
        if (this.isStumbled || this.isTumbling) return;
        this.isStumbled = true;
        this.stumbleRecoveryTimer = 1.4;
        if (window.soundEngine) {
            window.soundEngine.playWaterSplash(true);
            window.soundEngine.playFootstep(true);
        }
        if (window.eventManager) {
            window.eventManager.showNotification("Slipped in deep flooded puddle! Lost breath!");
        }
        this.oxygen = Math.max(0, this.oxygen - 3.0);
    }

    update(delta, world) {
        if (this.isDead || (window.gameState && window.gameState.state !== 'PLAYING')) return;

        // Handle Active Tumble Event
        if (this.isTumbling) {
            this.updateTumble(delta, world);

            // Update Camera Transformations during tumble
            this.camera.position.set(this.position.x, this.position.y + 1.2, this.position.z);
            this.camera.rotation.set(0, 0, 0);
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
            this.camera.rotation.z = this.roll; // Tumbling roll!

            if (this.flashlight && this.flashlightTarget) {
                this.flashlight.position.copy(this.camera.position);
                const lookDir = new THREE.Vector3();
                this.camera.getWorldDirection(lookDir);
                this.flashlightTarget.position.copy(this.camera.position).add(lookDir.multiplyScalar(6));
            }
            return;
        }

        // 1. Oxygen Depletion & High-Tension Climax Calculation
        let drainRate = 0.48;
        this.isSprinting = this.keys.shift && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right);

        if (this.isSprinting) {
            drainRate *= 3.0;
        }

        // After the tumble and entering the final canyon (z < -162), respirator leak accelerates tension!
        if (this.isRespiratorLeaking) {
            drainRate += 0.85; // Faster leak
        }

        // Final desperate stretch (z < -215): tightly calibrated so player arrives with ~5% - 10% O2!
        if (this.position.z < -215) {
            drainRate += 1.15; // Lungs burning, tank gasping
        }

        this.oxygen = Math.max(0, this.oxygen - drainRate * delta);
        if (this.oxygen <= 0) {
            this.dieOfHypoxia();
            return;
        }

        // 2. Check Trigger for Dramatic Rockslide Tumble (at z = -139)
        if (!this.hasTumbled && this.position.z <= -139 && this.position.z >= -144) {
            this.triggerRockslideTumble();
            return;
        }

        // 3. Headlamp Malfunction Random Check
        this.nextMalfunctionCheck -= delta;
        if (this.nextMalfunctionCheck <= 0) {
            this.nextMalfunctionCheck = 28.0 + Math.random() * 25.0;
            if (Math.random() < 0.45) {
                this.triggerFlashlightMalfunction();
            }
        }

        // 4. Flooded Puddle Check & Tripping Hazard
        let inWater = false;
        world.puddles.forEach(p => {
            if (Math.hypot(this.position.x - p.position.x, this.position.z - p.position.z) < 1.8) {
                inWater = true;
                if (this.isSprinting && !this.isStumbled && Math.random() < 0.04) {
                    this.triggerStumble();
                }
            }
        });

        if (this.isStumbled) {
            this.stumbleRecoveryTimer -= delta;
            this.stumblePitchOffset = Math.sin(this.stumbleRecoveryTimer * 3.5) * -0.3;
            if (this.stumbleRecoveryTimer <= 0) {
                this.isStumbled = false;
                this.stumblePitchOffset = 0;
            }
        }

        // 5. Movement Calculation with Solid Footing
        const speed = (this.isSprinting ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed) * (this.isStumbled ? 0.35 : 1.0);
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        const moveDir = new THREE.Vector3();
        if (this.keys.forward) moveDir.add(forward);
        if (this.keys.backward) moveDir.sub(forward);
        if (this.keys.right) moveDir.add(right);
        if (this.keys.left) moveDir.sub(right);

        this.isMoving = moveDir.lengthSq() > 0.001;

        if (this.isMoving) {
            moveDir.normalize();
            this.velocity.copy(moveDir).multiplyScalar(speed * delta);

            const nextZ = this.position.z + this.velocity.z;
            const nextPathX = world.getPathX(nextZ);
            let nextX = this.position.x + this.velocity.x;

            // Clamped strictly within the cavern walls (+/- 1.85m)
            nextX = Math.max(nextPathX - 1.85, Math.min(nextPathX + 1.85, nextX));

            let blockedByRubble = false;

            // Rubble Obstacle Collision
            world.rubbleObjects.forEach(r => {
                if (!r.cleared) {
                    const distToRubble = Math.hypot(nextX - r.x, nextZ - r.z);
                    if (distToRubble < 2.5) {
                        blockedByRubble = true;
                    }
                }
            });

            // Surface Hatch bunker collision at z = -262
            if (nextZ <= -261.5) {
                blockedByRubble = true;
            }

            if (!blockedByRubble) {
                this.position.x = nextX;
                if (nextZ < 6.5) {
                    this.position.z = nextZ;
                }
            }

            // Footstep sounds
            this.stepTimer -= delta * (this.isSprinting ? 1.6 : 1.0);
            if (this.stepTimer <= 0) {
                if (inWater && window.soundEngine) {
                    window.soundEngine.playWaterSplash(this.isSprinting);
                } else if (window.soundEngine) {
                    window.soundEngine.playFootstep(this.isSprinting);
                }
                this.stepTimer = 0.45;
            }

            this.bobCycle += delta * (this.isSprinting ? 12 : 8.0);
        } else {
            this.velocity.set(0, 0, 0);
        }

        // Height follows the undulating terrain
        const currentGroundY = world.getPathY(this.position.z);
        const bobOffset = this.isMoving ? Math.sin(this.bobCycle) * (this.isSprinting ? 0.08 : 0.04) : 0;
        this.cameraBaseY = currentGroundY + 1.7 + bobOffset;
        this.position.y = currentGroundY;

        // Apply Camera Transformations
        this.camera.position.set(this.position.x, this.cameraBaseY, this.position.z);
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch + this.stumblePitchOffset;
        this.camera.rotation.z = 0; // Reset roll when not tumbling

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
