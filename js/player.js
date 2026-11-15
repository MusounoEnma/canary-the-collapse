/**
 * CANARY: The Collapse - FPS Player Controller
 * Features:
 * - Underwater Swimming Stage (z=-160 to -178) with murky water FX and muffled audio.
 * - Vertical Rescue Rope Climbing Stage (z=-180) to ascend the 7.5m cliff ledge.
 * - Dramatic Rockslide Tumble: Slips and rolls 720 degrees down the steep chute.
 * - High-Tension Oxygen Depletion Climax.
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
        this.roll = 0;
        this.isLocked = false;
        this.sensitivity = 0.0016;

        // Oxygen & Vitals
        this.oxygen = 100.0;
        this.isDead = false;
        this.isRespiratorLeaking = false;

        // Equipment progression
        this.hasBrokenPickaxe = false;
        this.hasCrowbar = false;

        // Cinematic Tumble & Roll Event (Side Bypass Chute)
        this.hasTumbled = false;
        this.isTumbling = false;
        this.tumbleTimer = 0;
        this.tumbleDuration = 2.2;
        this.tumbleStartZ = -137;
        this.tumbleEndZ = -162;

        // Underwater Swimming Stage & Smooth Water Transition
        this.isSwimming = false;
        this.swimStrokeTimer = 0;
        this.waterEntryTimer = 0;
        this.waterEntryDuration = 1.6;

        // Vertical Rescue Rope Climbing Stage
        this.isClimbingRope = false;
        this.ropeClimbProgress = 0; // 0 to 1
        this.ropeClimbSpeed = 0.35; // ~3 seconds climb
        this.ropeStartY = 0;
        this.ropeEndY = 0;
        this.hasClimbedRope = false;

        // Flashlight (Helmet Headlamp)
        this.flashlight = null;
        this.flashlightTarget = null;
        this.isFlashlightOn = true;
        this.isFlashlightWaterlogged = false;
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
            if (!this.isLocked || this.isDead || this.isTumbling || this.isClimbingRope) return;
            this.yaw -= e.movementX * this.sensitivity;
            this.pitch -= e.movementY * this.sensitivity;
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
        });

        window.addEventListener('keydown', (e) => {
            if (this.isDead || this.isTumbling) return;

            // While climbing rope, space / W climbs faster
            if (this.isClimbingRope) {
                if (e.code === 'KeyW' || e.code === 'Space') {
                    this.ropeClimbProgress += 0.08;
                    if (window.soundEngine) window.soundEngine.playRopeCreak();
                }
                return;
            }

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
        if (window.soundEngine) window.soundEngine.playHelmetTap();

        // Waterlogged headlamp from tumbling into flooded water
        if (this.isFlashlightWaterlogged) {
            this.tapsRequired = (this.tapsRequired || 2) - 1;
            if (this.flashlight) {
                this.flashlight.intensity = Math.random() < 0.5 ? 1.2 : 0.0;
            }
            if (this.tapsRequired <= 0) {
                this.isFlashlightWaterlogged = false;
                this.isFlashlightOn = true;
                if (this.flashlight) this.flashlight.intensity = 3.6;
                if (this.ambientBulb) this.ambientBulb.intensity = 0.6;
                const tapAlert = document.getElementById('helmet-tap-alert');
                if (tapAlert) tapAlert.classList.remove('active');
                if (window.eventManager) window.eventManager.showNotification("WATER DRAINED! HEADLAMP FULLY RESTORED!");
            }
            return;
        }

        if (!this.isFlashlightMalfunctioning) {
            return;
        }

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
        if (this.isFlashlightMalfunctioning || this.isTumbling || this.isClimbingRope) return;
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

        this.isRespiratorLeaking = true;
        this.oxygen = Math.max(12, this.oxygen - 18.0);
    }

    updateTumble(delta, world) {
        this.tumbleTimer += delta;
        const progress = Math.min(1.0, this.tumbleTimer / this.tumbleDuration);

        const easeT = progress * progress * (3 - 2 * progress);
        this.position.z = THREE.MathUtils.lerp(this.tumbleStartZ, this.tumbleEndZ, easeT);
        this.position.x = world.getPathX(this.position.z);
        this.position.y = world.getPathY(this.position.z);

        // 720 degree tumble roll
        this.roll = progress * Math.PI * 4;
        this.pitch = Math.sin(progress * Math.PI * 6) * 0.45;

        if (this.flashlight) {
            this.flashlight.intensity = Math.random() > 0.4 ? 2.5 : 0.2;
        }

        if (progress >= 1.0) {
            this.isTumbling = false;
            this.waterEntryTimer = this.waterEntryDuration;

            // Senter (headlamp) mati total setelah kecebur air!
            this.isFlashlightWaterlogged = true;
            this.isFlashlightOn = false;
            this.tapsRequired = 2;
            if (this.flashlight) this.flashlight.intensity = 0;
            if (this.ambientBulb) this.ambientBulb.intensity = 0;

            if (window.soundEngine) {
                window.soundEngine.playWaterSplash(true);
                window.soundEngine.playElectricalGlitch(); // Short-circuit fizzle
            }

            // Spawn the ethereal golden Lily scene in the pitch dark water
            if (window.gameWorld) {
                window.gameWorld.spawnWaterLilyScene();
            }

            // Trigger splash visual burst
            const splashVignette = document.getElementById('water-splash-vignette');
            if (splashVignette) {
                splashVignette.classList.remove('active');
                void splashVignette.offsetWidth;
                splashVignette.classList.add('active');
            }

            if (window.gameState) {
                window.gameState.triggerMonologue("waterLilyScene");
            }

            if (window.eventManager) {
                window.eventManager.showNotification("HEADLAMP SHORTED OUT IN WATER! FOLLOW LILY'S GOLDEN LIGHT ACROSS THE FLOODED SUMP!");
            }
        }
    }

    // -------------------------------------------------------------
    // VERTICAL RESCUE ROPE CLIMBING STAGE (z = -180)
    // -------------------------------------------------------------
    startRopeClimb(rescueRope) {
        if (this.isClimbingRope || this.hasClimbedRope) return;
        this.isClimbingRope = true;
        this.hasClimbedRope = true;
        this.ropeClimbProgress = 0;
        this.ropeStartY = rescueRope.lowerY;
        this.ropeEndY = rescueRope.upperY;

        // Position directly at rope
        this.position.x = rescueRope.x;
        this.position.z = rescueRope.z;

        if (window.soundEngine) window.soundEngine.playRopeCreak();
        if (window.eventManager) window.eventManager.showNotification("CLIMBING RESCUE ROPE! TAP [W] OR [SPACE] TO ASCEND FASTER!");
    }

    updateRopeClimb(delta) {
        // Continuous upward climb + player key taps
        this.ropeClimbProgress += delta * this.ropeClimbSpeed;
        const p = Math.min(1.0, this.ropeClimbProgress);

        // Vertically ascend camera and position
        const currentY = THREE.MathUtils.lerp(this.ropeStartY, this.ropeEndY, p);
        this.position.y = currentY;
        this.cameraBaseY = currentY + 1.6;

        // Camera looks up at anchor and rocks swaying slightly
        this.pitch = Math.PI / 4.5 + Math.sin(this.ropeClimbProgress * 15) * 0.08;
        this.roll = Math.cos(this.ropeClimbProgress * 15) * 0.06;

        // Sound creaks periodically
        if (Math.sin(this.ropeClimbProgress * 20) > 0.8) {
            if (window.soundEngine) window.soundEngine.playRopeCreak();
        }

        if (p >= 1.0) {
            // Reached upper canyon ledge!
            this.isClimbingRope = false;
            this.pitch = 0;
            this.roll = 0;

            // Step onto the solid rock of upper ledge
            this.position.z = -183;
            this.position.y = this.ropeEndY;

            if (window.soundEngine) window.soundEngine.playFootstep(true);
            if (window.eventManager) window.eventManager.showNotification("SUCCESS! REACHED UPPER CANYON LEDGE!");
            if (window.gameState) window.gameState.triggerMonologue("ropeClimbed");
        }
    }

    triggerStumble() {
        if (this.isStumbled || this.isTumbling || this.isClimbingRope || this.isSwimming) return;
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

        // 1. Handle Active Tumble Event
        if (this.isTumbling) {
            this.updateTumble(delta, world);
            this.camera.position.set(this.position.x, this.position.y + 1.2, this.position.z);
            this.camera.rotation.set(0, 0, 0);
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
            this.camera.rotation.z = this.roll;
            if (this.flashlight && this.flashlightTarget) {
                this.flashlight.position.copy(this.camera.position);
                const lookDir = new THREE.Vector3();
                this.camera.getWorldDirection(lookDir);
                this.flashlightTarget.position.copy(this.camera.position).add(lookDir.multiplyScalar(6));
            }
            return;
        }

        // 2. Handle Active Rope Climbing Event
        if (this.isClimbingRope) {
            this.updateRopeClimb(delta);
            this.camera.position.set(this.position.x, this.cameraBaseY, this.position.z);
            this.camera.rotation.set(0, 0, 0);
            this.camera.rotation.y = this.yaw;
            this.camera.rotation.x = this.pitch;
            this.camera.rotation.z = this.roll;
            if (this.flashlight && this.flashlightTarget) {
                this.flashlight.position.copy(this.camera.position);
                const lookDir = new THREE.Vector3();
                this.camera.getWorldDirection(lookDir);
                this.flashlightTarget.position.copy(this.camera.position).add(lookDir.multiplyScalar(6));
            }
            return;
        }

        // Smooth buoyant recovery bobbing after tumbling into water
        if (this.waterEntryTimer > 0) {
            this.waterEntryTimer -= delta;
            const t = 1.0 - Math.max(0, this.waterEntryTimer / this.waterEntryDuration);
            this.roll = (1.0 - t) * Math.sin(t * Math.PI * 4) * 0.16;
            this.pitch = (1.0 - t) * Math.sin(t * Math.PI * 3) * 0.14;
        }

        // 3. Underwater Swimming Stage Detection (z between -161 and -178)
        const inSwimmingZone = (this.position.z <= -161 && this.position.z >= -178);
        if (inSwimmingZone !== this.isSwimming) {
            this.isSwimming = inSwimmingZone;
            if (window.soundEngine) window.soundEngine.setUnderwater(this.isSwimming);

            const underOverlay = document.getElementById('underwater-overlay');
            if (underOverlay) {
                if (this.isSwimming) {
                    underOverlay.classList.add('active');
                } else {
                    underOverlay.classList.remove('active');
                }
            }

            if (this.isSwimming && window.gameState) {
                window.gameState.triggerMonologue("swimming");
            }
        }

        // 4. Oxygen Depletion & High-Tension Climax Calculation
        let drainRate = 0.48;
        this.isSprinting = this.keys.shift && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right);

        if (this.isSprinting) {
            drainRate *= 3.0;
        }

        if (this.isSwimming) {
            drainRate += 0.45; // Struggling in deep water
        }

        if (this.isRespiratorLeaking) {
            drainRate += 0.85;
        }

        // Final desperate stretch (z < -215): tightly calibrated so player arrives with ~5% - 10% O2!
        if (this.position.z < -215) {
            drainRate += 1.15;
        }

        this.oxygen = Math.max(0, this.oxygen - drainRate * delta);
        if (this.oxygen <= 0) {
            this.dieOfHypoxia();
            return;
        }

        // 5. Trigger Rockslide Tumble Check (in side bypass chute at z <= -136.5)
        if (!this.hasTumbled && this.position.z <= -136.5 && this.position.z >= -144) {
            this.triggerRockslideTumble();
            return;
        }

        // Headlamp waterlogged maintenance
        if (this.isFlashlightWaterlogged) {
            if (this.ambientBulb) this.ambientBulb.intensity = 0;
            if (this.position.z <= -176) {
                const tapAlert = document.getElementById('helmet-tap-alert');
                if (tapAlert) {
                    tapAlert.textContent = "⚠ HEADLAMP WATERLOGGED! PRESS [F] TO DRAIN & RESTORE!";
                    tapAlert.classList.add('active');
                }
            }
        }

        // 6. Headlamp Malfunction Random Check
        this.nextMalfunctionCheck -= delta;
        if (this.nextMalfunctionCheck <= 0 && !this.isFlashlightWaterlogged) {
            this.nextMalfunctionCheck = 28.0 + Math.random() * 25.0;
            if (Math.random() < 0.45) {
                this.triggerFlashlightMalfunction();
            }
        }

        // 7. Movement Calculation
        let speed = this.moveSpeed;
        if (this.isSwimming) {
            speed *= 0.75; // Slower viscous swimming speed
        } else if (this.isSprinting) {
            speed *= this.sprintMultiplier;
        }
        if (this.isStumbled) speed *= 0.35;

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

            // Prevent walking past cliff edge at z = -180 if rope has NOT been climbed!
            if (!this.hasClimbedRope && nextZ <= -180.2) {
                blockedByRubble = true;
            }

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

            // Audio: Swimming stroke vs footstep sounds
            this.stepTimer -= delta * (this.isSprinting ? 1.6 : 1.0);
            if (this.stepTimer <= 0) {
                if (this.isSwimming) {
                    if (window.soundEngine) window.soundEngine.playWaterStroke();
                    this.stepTimer = 0.65;
                } else {
                    if (window.soundEngine) window.soundEngine.playFootstep(this.isSprinting);
                    this.stepTimer = 0.45;
                }
            }

            this.bobCycle += delta * (this.isSwimming ? 5.5 : (this.isSprinting ? 12 : 8.0));
        } else {
            this.velocity.set(0, 0, 0);
        }

        // Height Calculation: swimming floats slightly higher
        const currentGroundY = world.getPathY(this.position.z);
        const swimBob = this.isSwimming ? Math.sin(this.bobCycle) * 0.15 : 0;
        const walkBob = !this.isSwimming && this.isMoving ? Math.sin(this.bobCycle) * (this.isSprinting ? 0.08 : 0.04) : 0;

        this.cameraBaseY = currentGroundY + (this.isSwimming ? 1.15 + swimBob : 1.7 + walkBob);
        this.position.y = currentGroundY;

        // Apply Camera Transformations
        this.camera.position.set(this.position.x, this.cameraBaseY, this.position.z);
        this.camera.rotation.set(0, 0, 0);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch + this.stumblePitchOffset;
        this.camera.rotation.z = 0;

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
