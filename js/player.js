/**
 * CANARY: The Collapse - FPS Player Controller
 * Features:
 * - 3x Extended Subterranean Expedition: 780m depth to 0m surface across 3 diverse sectors.
 * - Stage 1 (Vein): Realistic fatigue stumbling, mine cart pushing, and pickaxe swing integration.
 * - Stage 2 (Abyssal Chute & Grotto): 110m high-speed slide with steering + 225m swimming grotto with O2 geysers.
 * - Stage 3 (Ascent & Surface): 24m manual hand-over-hand rope climb, concussive tremor wobble, active boulder dodging, and desperate final crawl.
 */

class PlayerController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Position & Movement
        this.position = new THREE.Vector3(0, 1.7, 0);
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 3.2;
        this.sprintMultiplier = 1.7;
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
        this.depth = 780;

        // Equipment progression
        this.hasBrokenPickaxe = false;
        this.hasCrowbar = false;

        // Stage 2: The Abyssal Ore Chute Slide
        this.isSliding = false;
        this.slideProgress = 0; // 0 to 1
        this.slideLateralOffset = 0;
        this.slideSpeed = 0.09; // takes ~11 seconds to slide down 110 meters

        // Stage 2: Extended Swimming Grotto
        this.isSwimming = false;
        this.swimStrokeTimer = 0;
        this.underwaterOverlay = document.getElementById('underwater-overlay');
        this.splashVignette = document.getElementById('water-splash-vignette');

        // Stage 3: Manual Hand-over-Hand Rope Climb (24m vertical)
        this.isClimbingRope = false;
        this.ropeClimbMeters = 0;
        this.ropeTotalMeters = 24.0;
        this.hasClimbedRope = false;
        this.ropePullAlternate = false;

        // Flashlight (Helmet Headlamp)
        this.flashlight = null;
        this.flashlightTarget = null;
        this.isFlashlightOn = true;
        this.isFlashlightMalfunctioning = false;
        this.tapsRequired = 0;
        this.nextMalfunctionCheck = 30.0;

        // Physical Fatigue Stumble & Collapse
        this.isStumbled = false;
        this.stumbleProgress = 0;
        this.stumbleCooldown = 0;
        this.stumbleTapsNeeded = 0;

        // Concussive Tremor Sway & Active Boulder Dodging
        this.concussiveSway = 0;

        // Desperate Crawling Finale (z < -820)
        this.isForcedCrawl = false;

        // Initial Game Intro: Waking Up Prone
        this.isWakingUp = false;
        this.wakeUpTimer = 0;
        this.wakeUpDuration = 3.6;

        // Crouch Mechanics
        this.isCrouching = false;
        this.standEyeHeight = 1.65;
        this.crouchEyeHeight = 0.80;
        this.currentEyeHeight = 1.65;

        // Head Bobbing & Elevation
        this.bobCycle = 0;
        this.cameraBaseY = 1.65;

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
        // Bright 360-degree helmet headlamp attached directly to camera
        this.ambientBulb = new THREE.PointLight(0xffeedd, 1.8, 26.0, 1.2);
        this.ambientBulb.position.set(0, 0, 0);
        this.camera.add(this.ambientBulb);

        // Forward focused beam attached directly to camera
        this.flashlight = new THREE.SpotLight(0xfffae0, 4.0, 50, Math.PI / 3.0, 0.35, 1.2);
        this.flashlight.position.set(0, 0, 0);
        this.flashlightTarget = new THREE.Object3D();
        this.flashlightTarget.position.set(0, 0, -5);
        this.camera.add(this.flashlightTarget);
        this.flashlight.target = this.flashlightTarget;
        this.camera.add(this.flashlight);
    }

    initInputListeners() {
        let isMouseDown = false;
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isMouseDown = true;
                if (window.gameState && window.gameState.state === 'PLAYING') {
                    if (window.eventManager) {
                        window.eventManager.strikePickaxe();
                    }
                }
            }
        });
        window.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        // Click anywhere on viewport to lock mouse in PLAYING mode
        window.addEventListener('click', (e) => {
            if (!this.isDead && window.gameState && window.gameState.state === 'PLAYING') {
                if (e.target.closest('#title-screen') || e.target.closest('#polaroid-container') || e.target.closest('#story-note-modal') || e.target.closest('#rhythm-minigame-overlay') || e.target.closest('#polaroid-inspect-modal')) {
                    return;
                }
                if (this.domElement && document.pointerLockElement !== this.domElement) {
                    try {
                        const lockPromise = this.domElement.requestPointerLock();
                        if (lockPromise && lockPromise.catch) {
                            lockPromise.catch(err => {
                                console.warn("Pointer lock request warning:", err);
                            });
                        }
                    } catch (err) {
                        console.warn("Pointer lock request error:", err);
                    }
                }
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
            if (this.isDead || this.isSliding) return;
            if (!this.isLocked && !isMouseDown) return;
            this.yaw -= e.movementX * this.sensitivity;
            this.pitch -= e.movementY * this.sensitivity;
            this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
        });

        window.addEventListener('keydown', (e) => {
            if (this.isDead) return;

            // Handle recovery when player has stumbled / collapsed to knees
            if (this.isStumbled) {
                if (e.code === 'Space' || e.code === 'KeyW') {
                    this.stumbleTapsNeeded--;
                    if (window.soundEngine && window.soundEngine.playFootstep) {
                        window.soundEngine.playFootstep(0.4);
                    }
                    if (this.stumbleTapsNeeded <= 0) {
                        this.recoverFromStumble();
                    }
                }
                return;
            }

            // Manual hand-over-hand rope climbing
            if (this.isClimbingRope) {
                if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'KeyY') {
                    this.pullRopeHand();
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
                case 'KeyC':
                case 'ControlLeft':
                case 'ControlRight':
                    this.toggleCrouch();
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
                case 'Space':
                    if (window.eventManager && window.eventManager.currentRubble) {
                        window.eventManager.strikePickaxe();
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

    startIntroWakeUp() {
        this.isWakingUp = true;
        this.wakeUpTimer = 0;
        this.pitch = -0.7; // looking at ground
        this.yaw = 0;
        this.roll = 0.45; // head resting tilted on rock
    }

    toggleCrouch() {
        if (this.isForcedCrawl) return; // Cannot stand up during forced crawl
        this.isCrouching = !this.isCrouching;
        const stanceEl = document.getElementById('hud-stance-value');
        if (stanceEl) {
            stanceEl.textContent = this.isCrouching ? "CROUCHING [C]" : "STANDING [C]";
            stanceEl.style.color = this.isCrouching ? "#ffd54f" : "#69f0ae";
        }
    }

    handleHelmetTap() {
        if (!this.isFlashlightMalfunctioning) return;
        this.tapsRequired--;
        if (window.soundEngine) window.soundEngine.playHelmetTap();

        if (this.tapsRequired <= 0) {
            this.isFlashlightMalfunctioning = false;
            this.isFlashlightOn = true;
            this.flashlight.intensity = 4.5;
            this.ambientBulb.intensity = 0.85;
            const tapAlert = document.getElementById('helmet-tap-alert');
            if (tapAlert) tapAlert.style.display = 'none';
        }
    }

    triggerStumble(severity = 1.0) {
        if (this.isStumbled || this.isSliding || this.isClimbingRope || this.isSwimming) return;

        this.isStumbled = true;
        this.stumbleTapsNeeded = 3;
        this.stumbleProgress = 0;
        this.stumbleCooldown = 15.0; // Prevent spam

        if (window.soundEngine && window.soundEngine.playBreathGasp) {
            window.soundEngine.playBreathGasp();
        }
        if (window.eventManager) {
            window.eventManager.showNotification("EXHAUSTION! TAP [SPACE] OR [W] TO STRUGGLE BACK UP!");
        }
    }

    recoverFromStumble() {
        this.isStumbled = false;
        if (window.eventManager) {
            window.eventManager.showNotification("Back on your feet! Keep moving!");
        }
    }

    startSlide(slideChute) {
        if (this.isSliding) return;
        this.isSliding = true;
        this.slideProgress = 0;
        this.slideLateralOffset = 0;

        if (window.soundEngine && window.soundEngine.playWhoosh) {
            window.soundEngine.playWhoosh();
        }
        if (window.eventManager) {
            window.eventManager.showNotification("HANG ON! PLUNGING DOWN THE ORE CHUTE! [A]/[D] STEER!");
        }
    }

    updateSlide(delta) {
        this.slideProgress += delta * this.slideSpeed;

        // Player steering
        if (this.keys.left) this.slideLateralOffset = Math.max(-1.2, this.slideLateralOffset - delta * 3.0);
        if (this.keys.right) this.slideLateralOffset = Math.min(1.2, this.slideLateralOffset + delta * 3.0);

        const pos = window.gameWorld.stage2.getSlidePosition(this.slideProgress, this.slideLateralOffset);
        this.position.copy(pos);
        this.camera.position.set(pos.x, pos.y + 0.6, pos.z);

        // Slide dynamic camera pitch & roll
        this.pitch = -0.35 + Math.sin(this.slideProgress * 20) * 0.08;
        this.roll = this.slideLateralOffset * 0.25;

        // End of slide: splash into water
        if (this.slideProgress >= 1.0) {
            this.isSliding = false;
            this.enterWaterGrotto();
        }
    }

    enterWaterGrotto() {
        this.isSwimming = true;
        this.position.set(0, -12.2, -400);

        if (window.soundEngine && window.soundEngine.playWaterSplash) {
            window.soundEngine.playWaterSplash();
        }
        if (this.underwaterOverlay) {
            this.underwaterOverlay.style.opacity = '0.55';
        }
        if (this.splashVignette) {
            this.splashVignette.style.opacity = '0.9';
            setTimeout(() => {
                this.splashVignette.style.opacity = '0';
            }, 1200);
        }
        if (window.eventManager) {
            window.eventManager.showNotification("SUBMERGED IN UNDERGROUND LAKE! SWIM TOWARDS THE O2 GEYSERS!");
        }
    }

    startRopeClimb(rescueRope) {
        if (this.isClimbingRope || this.hasClimbedRope) return;
        this.isClimbingRope = true;
        this.ropeClimbMeters = 0;
        this.position.set(0, -12.0, -625);

        if (window.eventManager) {
            window.eventManager.showNotification("CLIMBING RESCUE ROPE (24 METERS)! TAP [W] OR [SPACE] TO PULL UPWARD!");
        }
    }

    pullRopeHand() {
        this.ropeClimbMeters += 0.85; // 0.85 meters per hand pull (~28 taps)
        this.ropePullAlternate = !this.ropePullAlternate;

        // Camera hand-pull sway
        this.roll = (this.ropePullAlternate ? 1 : -1) * 0.12;
        this.pitch = 0.55; // looking up the rope

        if (window.soundEngine && window.soundEngine.playRopeCreak) {
            window.soundEngine.playRopeCreak();
        }

        const currentY = -12.0 + this.ropeClimbMeters;
        this.position.y = currentY;
        this.camera.position.set(0, currentY + 1.2, -625);

        const remaining = Math.max(0, Math.round(this.ropeTotalMeters - this.ropeClimbMeters));
        if (window.eventManager) {
            window.eventManager.showNotification(`CLIMBING... ${remaining} METERS REMAINING!`);
        }

        if (this.ropeClimbMeters >= this.ropeTotalMeters) {
            this.completeRopeClimb();
        }
    }

    completeRopeClimb() {
        this.isClimbingRope = false;
        this.hasClimbedRope = true;
        this.roll = 0;
        this.pitch = 0;
        this.position.set(0, 12.0, -635);

        if (window.eventManager) {
            window.eventManager.showNotification("UPPER ESCAPE CANYON REACHED! PROCEED TOWARDS HATCH B-4!");
        }
        if (window.gameState) {
            window.gameState.triggerTremorClimax();
        }
    }

    takeDamage(amount, reason) {
        this.oxygen -= amount;
        this.triggerStumble(1.2);
        if (this.oxygen <= 0) {
            this.die(reason || "Crushed in the collapse!");
        }
    }

    die(reason) {
        if (this.isDead) return;
        this.isDead = true;
        if (window.gameState) {
            window.gameState.triggerGameOver(reason);
        }
    }

    update(delta) {
        if (this.isDead) return;

        // 1. Initial Intro Wake-up Transition
        if (this.isWakingUp) {
            this.wakeUpTimer += delta;
            const p = Math.min(1.0, this.wakeUpTimer / this.wakeUpDuration);
            this.pitch = THREE.MathUtils.lerp(-0.7, 0, p);
            this.roll = THREE.MathUtils.lerp(0.45, 0, p);
            if (p >= 1.0) this.isWakingUp = false;
            this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
            return;
        }

        // 2. Abyssal Slide Simulation
        if (this.isSliding) {
            this.updateSlide(delta);
            this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
            return;
        }

        // 3. Manual Rope Climbing
        if (this.isClimbingRope) {
            this.roll = THREE.MathUtils.lerp(this.roll, 0, delta * 3.0);
            this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
            return;
        }

        // 4. Fatigue Stumble Recovery State
        if (this.isStumbled) {
            this.pitch = THREE.MathUtils.lerp(this.pitch, -0.45, delta * 6.0);
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.position.y + 0.45, delta * 5.0);
            this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
            return;
        }
        if (this.stumbleCooldown > 0) this.stumbleCooldown -= delta;

        // 5. Normal Walking / Swimming Movement
        const world = window.gameWorld;
        this.isMoving = false;

        // Check if player entered slide intake at z = -282
        if (!this.isSliding && this.position.z <= -282 && this.position.z >= -286) {
            this.startSlide(world.stage2);
            return;
        }

        // Check if player entered water zone (z <= -395 and z >= -615)
        const inWater = world && world.isWaterZone(this.position.z);
        if (inWater && !this.isSwimming) {
            this.enterWaterGrotto();
        } else if (!inWater && this.isSwimming && this.position.z < -615) {
            this.isSwimming = false;
            if (this.underwaterOverlay) this.underwaterOverlay.style.opacity = '0';
        }

        // Check if player reached desperate crawl zone (z <= -820)
        if (this.position.z <= -820 && !this.isForcedCrawl) {
            this.isForcedCrawl = true;
            this.isCrouching = true;
            if (window.eventManager) {
                window.eventManager.showNotification("AIR IS TOO THIN! CRAWL TOWARDS THE LIGHT OF HATCH B-4!");
            }
        }

        // Movement Direction
        const moveDir = new THREE.Vector3();
        if (this.keys.forward) moveDir.z -= 1;
        if (this.keys.backward) moveDir.z += 1;
        if (this.keys.left) moveDir.x -= 1;
        if (this.keys.right) moveDir.x += 1;

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            this.isMoving = true;

            // Apply camera yaw
            moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

            let speed = this.moveSpeed;
            if (this.isSwimming) {
                speed *= 0.65; // Water drag
            } else if (this.isForcedCrawl || this.isCrouching) {
                speed *= 0.45; // Crawling
            } else if (this.keys.shift) {
                speed *= this.sprintMultiplier;
                this.isSprinting = true;
            } else {
                this.isSprinting = false;
            }

            this.position.x += moveDir.x * speed * delta;
            this.position.z += moveDir.z * speed * delta;

            // Physical Boundaries & Wall Clamping (Prevents falling out of the cavern into void)
            if (world) {
                // 1. Rear Cave-in Wall at Entrance (z = 2.5m)
                if (this.position.z > 2.5) {
                    this.position.z = 2.5;
                }
                // 2. Surface Hatch End Point (z = -865m)
                if (this.position.z < -865.0) {
                    this.position.z = -865.0;
                }

                // 3. Rubble Cave-in Solid Collision (Must breach with pickaxe to pass)
                if (world.rubbles) {
                    world.rubbles.forEach(r => {
                        if (!r.cleared && Math.abs(this.position.z - r.position.z) < 1.3) {
                            if (this.position.z > r.position.z) {
                                this.position.z = r.position.z + 1.3;
                            } else {
                                this.position.z = r.position.z - 1.3;
                            }
                        }
                    });
                }

                // 4. Derailed Minecart Blockade (Must push [E] to clear track)
                if (world.mineCart && !world.mineCart.isPushed) {
                    if (this.position.z <= -143.2 && this.position.z >= -146.5) {
                        this.position.z = -143.2;
                    }
                }

                // 5. Vertical Cliff at Rope Base (Cannot walk past without climbing rope)
                if (!this.hasClimbedRope && this.position.z <= -626.0 && this.position.y < 0) {
                    this.position.z = -626.0;
                }

                // 6. Lateral Cavern Wall Clamping (Clamps player safely inside the 3D tube)
                const pathX = world.getPathX(this.position.z);
                const maxLateral = this.isSwimming ? 5.8 : (this.position.z < -640 ? 1.35 : 1.45);
                this.position.x = Math.max(pathX - maxLateral, Math.min(pathX + maxLateral, this.position.x));
            }

            // Footsteps / swimming sound
            this.stepTimer += delta * (this.isSprinting ? 1.6 : 1.0);
            if (this.stepTimer > 0.45) {
                this.stepTimer = 0;
                if (this.isSwimming) {
                    if (window.soundEngine && window.soundEngine.playSwimStroke) window.soundEngine.playSwimStroke();
                } else {
                    if (window.soundEngine && window.soundEngine.playFootstep) window.soundEngine.playFootstep();
                }
            }

            // Head Bobbing
            this.bobCycle += delta * (this.isSprinting ? 14 : 9);
        } else {
            this.isSprinting = false;
        }

        // Terrain Ground Height & Clamping
        if (world) {
            const groundY = world.getGroundHeight(this.position.x, this.position.z);
            if (this.isSwimming) {
                // Bobbing at water surface y = -12.2
                this.position.y = -12.2 + Math.sin(performance.now() * 0.003) * 0.08;
            } else {
                this.position.y = groundY;
            }
        }

        // Eye Height
        const targetEyeH = this.isCrouching ? this.crouchEyeHeight : this.standEyeHeight;
        this.currentEyeHeight = THREE.MathUtils.lerp(this.currentEyeHeight, targetEyeH, delta * 8.0);
        const bob = this.isMoving ? Math.sin(this.bobCycle) * (this.isSprinting ? 0.06 : 0.035) : 0;
        this.camera.position.set(this.position.x, this.position.y + this.currentEyeHeight + bob, this.position.z);

        // Concussive Tremor Sway
        if (this.concussiveSway > 0) {
            this.roll = Math.sin(performance.now() * 0.008) * this.concussiveSway;
            this.concussiveSway = Math.max(0, this.concussiveSway - delta * 0.15);
        } else {
            this.roll = 0;
        }

        this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

        // Update Flashlight
        if (this.flashlight) {
            this.flashlight.position.copy(this.camera.position);
            const front = new THREE.Vector3(0, 0, -5).applyMatrix4(this.camera.matrixWorld);
            this.flashlightTarget.position.copy(front);
            this.ambientBulb.position.copy(this.camera.position);
        }

        // 6. Oxygen Consumption
        let o2DrainRate = 0.55; // Base drain rate per second
        if (this.isSprinting) o2DrainRate *= 2.8;
        if (this.isSwimming) o2DrainRate *= 1.8;

        this.oxygen -= o2DrainRate * delta;
        if (this.oxygen <= 0) {
            this.oxygen = 0;
            this.die("Asphyxiation! Respirator oxygen depleted in the collapsed mine.");
        }

        // Check if player is near oxygen geyser vents in Stage 2
        if (world && world.airVents) {
            world.airVents.forEach(vent => {
                if (this.position.distanceTo(vent.position) < 2.5 && vent.cooldown <= 0) {
                    vent.cooldown = 4.0;
                    this.oxygen = Math.min(100, this.oxygen + 25);
                    if (window.soundEngine && window.soundEngine.playDeepInhale) window.soundEngine.playDeepInhale();
                    if (window.eventManager) window.eventManager.showNotification("FRESH AIR INHALED! +25% OXYGEN!");
                }
            });
        }

        // Check for spontaneous fatigue stumble when running with low O2
        if (this.isSprinting && this.oxygen < 35 && this.stumbleCooldown <= 0) {
            if (Math.random() < 0.02) {
                this.triggerStumble(1.0);
            }
        }

        // Update Real-time Mine Depth HUD
        // z = 0 corresponds to 780m, z = -865 corresponds to 0m (Surface)
        const progress = Math.min(1.0, Math.max(0, -this.position.z / 865));
        this.depth = Math.max(0, Math.round(780 * (1 - progress)));
        const depthEl = document.getElementById('hud-depth-value');
        if (depthEl) depthEl.textContent = `${this.depth}m`;

        const distEl = document.getElementById('hud-distance-to-hatch');
        if (distEl) distEl.textContent = `${Math.max(0, Math.round(865 + this.position.z))}m`;

        const o2ValEl = document.getElementById('hud-o2-value');
        const o2FillEl = document.getElementById('hud-o2-fill');
        if (o2ValEl) o2ValEl.textContent = `${Math.round(this.oxygen)}%`;
        if (o2FillEl) {
            o2FillEl.style.width = `${this.oxygen}%`;
            if (this.oxygen < 25) {
                o2FillEl.style.background = '#ff1744';
            } else if (this.oxygen < 50) {
                o2FillEl.style.background = '#ffb300';
            } else {
                o2FillEl.style.background = '#00e676';
            }
        }

        // Update First-Person Pickaxe if available
        if (window.pickaxeSystem) {
            window.pickaxeSystem.update(delta, this.isMoving, this.isSprinting);
        }
    }
}

window.PlayerController = PlayerController;
