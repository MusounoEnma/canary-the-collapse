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
        this.stress = 15.0; // 0 to 100% Panic level
        this.heartbeatBpm = 68; // 60 to 180 BPM
        this.isDead = false;
        this.isRespiratorLeaking = false;
        this.depth = 780;

        // Equipment progression
        this.hasBrokenPickaxe = false;
        this.hasCrowbar = false;

        // Stage 2: The Abyssal Natural Rock Chasm Fall & Plunge
        this.isSliding = false;
        this.slideProgress = 0; // 0 to 1
        this.slideLateralOffset = 0;
        this.fallVelocity = 0.22; // Natural gravity plunge acceleration (~3.2 seconds total fall)

        // Stage 2: Extended Swimming Grotto & Dynamic Surge Bobbing
        this.isSwimming = false;
        this.isHeadSubmerged = false;
        this.swimCycle = 0;
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
        // Authentic warm golden-amber miner helmet ambient glow
        this.ambientBulb = new THREE.PointLight(0xffca28, 1.1, 18.0, 1.4);
        this.ambientBulb.position.set(0, 0, 0);
        this.camera.add(this.ambientBulb);

        // High-powered warm incandescent miner headlamp beam
        this.flashlight = new THREE.SpotLight(0xfff3e0, 4.2, 58, Math.PI / 3.4, 0.35, 1.1);
        this.flashlight.position.set(0, 0, 0);
        this.flashlightTarget = new THREE.Object3D();
        this.flashlightTarget.position.set(0, 0, -6);
        this.camera.add(this.flashlightTarget);
        this.flashlight.target = this.flashlightTarget;
        this.camera.add(this.flashlight);
    }

    initInputListeners() {
        let isMouseDown = false;
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isMouseDown = true;
                if (this.isClimbingRope) {
                    this.pullRopeHand();
                    return;
                }
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
                if (e.target.closest('#title-screen') || e.target.closest('#polaroid-container') || e.target.closest('#story-note-modal') || e.target.closest('#rhythm-minigame-overlay') || e.target.closest('#polaroid-inspect-modal') || e.target.closest('#gameover-screen')) {
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
            if (this.isDead || this.isSliding || this.isClimbingRope) return;
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

            // Manual hand-over-hand rope climbing (responsive to W, Space, E, ArrowUp, Enter, Y)
            if (this.isClimbingRope) {
                if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'KeyE' || e.code === 'ArrowUp' || e.code === 'KeyY' || e.code === 'Enter') {
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
            this.flashlight.intensity = 4.2;
            this.ambientBulb.intensity = 1.1;
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

    startChasmPlunge(slideChute) {
        if (this.isSliding) return;
        this.isSliding = true;
        this.slideProgress = 0;
        this.slideLateralOffset = 0;
        this.fallVelocity = 0.22; // Natural gravity plunge acceleration

        if (window.soundEngine) {
            if (window.soundEngine.playWhoosh) window.soundEngine.playWhoosh();
            if (window.soundEngine.playTremorRumble) window.soundEngine.playTremorRumble();
        }
        if (window.eventManager) {
            window.eventManager.showNotification("CRITICAL CAVE-IN! TUMBLING DOWN THE ROCKY CHASM!");
        }
    }

    startSlide(slideChute) {
        this.startChasmPlunge(slideChute);
    }

    updateSlide(delta) {
        // Natural gravity fall acceleration down the rocky shaft
        this.fallVelocity = Math.min(0.48, this.fallVelocity + delta * 0.16);
        this.slideProgress += delta * this.fallVelocity;

        // Dynamic chaotic tumbling shudder & debris buffeting down the natural rock chasm
        const t = performance.now() * 0.001;
        const shudder = Math.sin(t * 38.0) * 0.035 * (1.0 - this.slideProgress * 0.3);
        const rockRoll = Math.sin(t * 16.0) * 0.06;

        // Follow the natural chasm drop path down to the flooded grotto
        const pos = window.gameWorld.stage2.getSlidePosition(this.slideProgress, 0);
        this.position.copy(pos);
        this.camera.position.set(pos.x, pos.y + 0.5, pos.z);

        // Realistic downward plunge camera tilt: looking down into the yawning abyss
        this.pitch = -0.68 + Math.sin(t * 14.0) * 0.06 + shudder;
        this.roll = rockRoll;
        this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

        // End of fall: violent impact splashdown into submerged lake
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

    takeRockHit(damage = 10, stressAmount = 28) {
        if (this.isDead) return;
        this.oxygen = Math.max(0, this.oxygen - damage);
        this.stress = Math.min(100, this.stress + stressAmount);
        this.concussiveSway = 0.38;
        this.pitch += (Math.random() - 0.5) * 0.16;
        this.roll += (Math.random() - 0.5) * 0.18;

        if (window.soundEngine) {
            if (window.soundEngine.playHeavyCaveInThud) window.soundEngine.playHeavyCaveInThud();
            if (window.soundEngine.playRaggedBreath) window.soundEngine.playRaggedBreath();
        }
        if (window.eventManager) {
            window.eventManager.showNotification("CRUSHING IMPACT! STRUCK BY FALLING CEILING ROCK DEBRIS!");
        }

        if (this.oxygen <= 0) {
            this.die("Crushed by collapsing rock strata in the flooded cavern!");
        }
    }

    triggerNearMissPanic(stressAmount = 12) {
        if (this.isDead) return;
        this.stress = Math.min(100, this.stress + stressAmount);
        this.concussiveSway = 0.14;
    }

    startRopeClimb(rescueRope) {
        if (this.isClimbingRope || this.hasClimbedRope) return;
        this.isClimbingRope = true;
        this.ropeClimbMeters = 0;
        this.ropeSlipsDone = 0;
        // Two random fatigue slip altitudes during the 24m ascent (around ~9.5m and ~17.5m)
        this.ropeSlipTargets = [8.8 + Math.random() * 2.2, 16.5 + Math.random() * 2.2];
        this.position.set(0, -12.0, -622.8);
        this.camera.position.set(0, -10.8, -622.8);
        this.yaw = 0;
        this.pitch = 0.85; // Locked looking up the vertical rescue rope!
        this.roll = 0;
        this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

        if (window.eventManager) {
            window.eventManager.showNotification("CLIMBING RESCUE ROPE (24 METERS)! TAP [W], [SPACE], [E], OR CLICK TO PULL UPWARD!");
        }
    }

    pullRopeHand() {
        // Check for random fatigue slipping event due to burning exhaustion
        if (this.ropeSlipsDone < this.ropeSlipTargets.length && this.ropeClimbMeters >= this.ropeSlipTargets[this.ropeSlipsDone]) {
            this.ropeSlipsDone++;
            const slipDist = 1.3 + Math.random() * 0.7; // Slips down 1.3m to 2.0m
            this.ropeClimbMeters = Math.max(0.5, this.ropeClimbMeters - slipDist);

            // Violent downward camera drop and loss of grip
            this.pitch = -0.38;
            this.roll = (Math.random() - 0.5) * 0.35;
            this.concussiveSway = 0.45;

            // Audio: harsh rope burn friction screech & ragged breath
            if (window.soundEngine) {
                if (window.soundEngine.playRopeSlip) window.soundEngine.playRopeSlip();
                if (window.soundEngine.playRaggedBreath) window.soundEngine.playRaggedBreath();
            }

            // Exertion: spike stress & heartbeat, small O2 burn
            this.stress = Math.min(100, this.stress + 24);
            this.heartbeatBpm += 22;
            this.oxygen = Math.max(10, this.oxygen - 2.5);

            // Screen glitch/vignette flash
            const glitchEl = document.getElementById('glitch-overlay');
            if (glitchEl) {
                glitchEl.style.opacity = '0.7';
                setTimeout(() => { if (glitchEl) glitchEl.style.opacity = '0'; }, 320);
            }

            const currentY = -12.0 + this.ropeClimbMeters;
            this.position.set(0, currentY, -622.8);
            this.camera.position.set(0, currentY + 1.2, -622.8);

            const remaining = Math.max(0, Math.round(this.ropeTotalMeters - this.ropeClimbMeters));
            if (window.eventManager) {
                window.eventManager.showNotification(`⚠️ LOSS OF GRIP! SLIPPED -${slipDist.toFixed(1)}m! EXHAUSTION SETTING IN! HOLD ON AND KEEP CLIMBING! (${remaining}m LEFT)`);
            }
            return;
        }

        this.ropeClimbMeters += 0.95; // 0.95 meters per pull
        this.ropePullAlternate = !this.ropePullAlternate;

        // Camera hand-pull sway (subtle lateral tilt, locked looking up)
        this.roll = (this.ropePullAlternate ? 1 : -1) * 0.08;
        this.pitch = 0.82; // Firmly locked looking UP towards upper escape canyon!

        if (window.soundEngine) {
            if (window.soundEngine.playRopeCreak) window.soundEngine.playRopeCreak();
            if (Math.random() < 0.28 && window.soundEngine.playRaggedBreath) {
                window.soundEngine.playRaggedBreath();
            }
        }

        const currentY = -12.0 + this.ropeClimbMeters;
        this.position.set(0, currentY, -622.8);
        this.camera.position.set(0, currentY + 1.2, -622.8);

        const remaining = Math.max(0, Math.round(this.ropeTotalMeters - this.ropeClimbMeters));
        if (window.eventManager) {
            window.eventManager.showNotification(`CLIMBING... ${remaining} METERS REMAINING! [W] / [SPACE] / [E] / [CLICK]`);
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
        this.yaw = 0;
        this.position.set(0, 12.0, -635.0);
        this.camera.position.set(0, 13.6, -635.0);
        this.camera.rotation.set(0, 0, 0, 'YXZ');

        // Save official checkpoint: Upper Escape Canyon reached!
        if (window.saveSystem) {
            window.saveSystem.unlockSector(3);
            window.saveSystem.saveCheckpoint(3, this.position, Math.max(55, this.oxygen), this.depth);
        }

        // Catastrophic tremor collapse permanently seals the chasm ledge behind the player!
        if (window.soundEngine && window.soundEngine.playTremorRumble) {
            window.soundEngine.playTremorRumble();
        }
        this.concussiveSway = 0.55;

        if (window.eventManager) {
            window.eventManager.showNotification("★ SEISMIC COLLAPSE SEALS CHASM BEHIND YOU! NO TURNING BACK! PUSH FORWARD TO HATCH B-4!");
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

        // 3. Manual Rope Climbing (Camera POV locked looking UP the rescue rope)
        if (this.isClimbingRope) {
            this.yaw = THREE.MathUtils.lerp(this.yaw, 0, delta * 8.0);
            this.pitch = THREE.MathUtils.lerp(this.pitch, 0.82, delta * 6.0); // Firmly locked looking UP
            this.roll = THREE.MathUtils.lerp(this.roll, 0, delta * 3.0);
            this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

            const currentY = -12.0 + this.ropeClimbMeters;
            this.position.set(0, currentY, -622.8);
            this.camera.position.set(0, currentY + 1.2, -622.8);

            // Update real-time climbing depth HUD
            const progress = Math.min(1.0, Math.max(0, -this.position.z / 865));
            this.depth = Math.max(0, Math.round(780 * (1 - progress) - this.ropeClimbMeters));
            const depthEl = document.getElementById('hud-depth-value');
            if (depthEl) depthEl.textContent = `${this.depth}m`;

            const stanceEl = document.getElementById('hud-stance-value');
            if (stanceEl) {
                stanceEl.textContent = "CLIMBING ROPE";
                stanceEl.style.color = "#00e676";
            }

            // Steady breathing and O2 consumption during climb
            this.oxygen -= 0.6 * delta;
            if (this.oxygen <= 0) {
                this.oxygen = 0;
                this.die("Exhaustion! Lost consciousness while ascending the vertical rescue rope.");
            }
            const o2ValEl = document.getElementById('hud-o2-value');
            const o2FillEl = document.getElementById('hud-o2-fill');
            if (o2ValEl) o2ValEl.textContent = `${Math.round(this.oxygen)}%`;
            if (o2FillEl) o2FillEl.style.width = `${this.oxygen}%`;

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

        // Check if player entered natural chasm fall zone at z <= -280
        if (!this.isSliding && this.position.z <= -280 && this.position.z >= -286) {
            this.startChasmPlunge(world.stage2);
            return;
        }

        // Check if player entered water zone (z <= -395 and z >= -615)
        const inWater = world && world.isWaterZone(this.position.z);
        if (inWater && !this.isSwimming) {
            this.enterWaterGrotto();
            // Checkpoint at start of swimming lake
            if (window.saveSystem && !this.waterStartCheckpointSaved) {
                this.waterStartCheckpointSaved = true;
                window.saveSystem.unlockSector(2);
                window.saveSystem.saveCheckpoint(2, new THREE.Vector3(0, -12.2, -396.0), Math.max(75, this.oxygen), 419);
            }
        } else if (!inWater && this.isSwimming && this.position.z < -615) {
            this.isSwimming = false;
            if (this.underwaterOverlay) this.underwaterOverlay.style.opacity = '0';
            // Emerged onto solid lake shore! Take desperate gasping breath & restore emergency O2
            if (this.oxygen < 50) {
                this.oxygen = Math.max(this.oxygen, 50);
                this.stress = Math.max(15, this.stress - 20);
                if (window.soundEngine && window.soundEngine.playBreathGasp) window.soundEngine.playBreathGasp();
            }

            // Save official checkpoint: Shoreline at base of rope (Sector 3 unlocked!)
            if (window.saveSystem && !this.shoreCheckpointSaved) {
                this.shoreCheckpointSaved = true;
                window.saveSystem.unlockSector(2);
                window.saveSystem.unlockSector(3);
                window.saveSystem.saveCheckpoint(3, new THREE.Vector3(0, -12.0, -622.0), Math.max(65, this.oxygen), 222);
                if (window.eventManager) {
                    window.eventManager.showNotification("★ CHECKPOINT REACHED: SUBTERRANEAN SHORE (DEPTH 222m) - SECTOR 2 CLEARED!");
                }
            }
        }

        // Ensure Sector 3 checkpoint triggers as soon as player reaches shore landing (z <= -618)
        if (this.position.z <= -618 && this.position.z >= -625 && this.position.y < 0 && window.saveSystem && !this.shoreCheckpointSaved) {
            this.shoreCheckpointSaved = true;
            window.saveSystem.unlockSector(2);
            window.saveSystem.unlockSector(3);
            window.saveSystem.saveCheckpoint(3, new THREE.Vector3(0, -12.0, -622.0), Math.max(65, this.oxygen), 222);
            if (window.eventManager) {
                window.eventManager.showNotification("★ CHECKPOINT REACHED: SUBTERRANEAN SHORE (DEPTH 222m) - SECTOR 2 CLEARED!");
            }
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
                speed *= 0.78; // Base swimming stroke speed
                if (this.keys.shift) {
                    speed *= 1.45; // Sprint swim / evasive dodge paddle!
                    this.isSprinting = true;
                } else {
                    this.isSprinting = false;
                }
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

                // 5. Solid Ledge Lock after Climbing (Player CANNOT return or fall back down to the bottom lake)
                if (this.hasClimbedRope) {
                    if (this.position.z >= -633.0) {
                        this.position.z = -633.0;
                    }
                } else {
                    // Solid Vertical Cliff at Rope Base (Cannot walk past or clip behind cliff at dock level)
                    if (this.position.z <= -626.0) {
                        this.position.z = -626.0;
                    }
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

        // Terrain Ground Height & Dynamic Swimming Water Bobbing
        if (this.isSwimming) {
            const waterY = world && world.getWaterHeightAt ? world.getWaterHeightAt(this.position.x, this.position.z) : -12.2;
            this.position.y = waterY;

            // Swimming stroke bobbing cycle (simulates head dipping and rising while treading/swimming)
            this.swimCycle = (this.swimCycle || 0) + delta * (this.isMoving ? 3.4 : 1.6);
            const strokeBob = Math.sin(this.swimCycle) * 0.28;
            const headY = waterY + 0.05 + strokeBob;

            // Check if head is submerged under wave
            const isSubmerged = headY < waterY;
            if (isSubmerged) {
                if (!this.isHeadSubmerged) {
                    this.isHeadSubmerged = true;
                    if (window.soundEngine && window.soundEngine.setUnderwater) window.soundEngine.setUnderwater(true);
                    if (world && world.scene && world.scene.fog) {
                        world.scene.fog.color.setHex(0x003348); // Deep murky aquatic blue fog
                        world.scene.fog.near = 1.0;
                        world.scene.fog.far = 30.0;
                    }
                }
                if (this.underwaterOverlay) this.underwaterOverlay.style.opacity = '0.92';
                // Underwater breath holding stresses the player!
                this.stress = Math.min(100, this.stress + delta * 5.5);
            } else {
                if (this.isHeadSubmerged) {
                    this.isHeadSubmerged = false;
                    if (window.soundEngine) {
                        if (window.soundEngine.setUnderwater) window.soundEngine.setUnderwater(false);
                        if (window.soundEngine.playBreathGasp) window.soundEngine.playBreathGasp();
                    }
                    if (world && world.scene && world.scene.fog) {
                        world.scene.fog.color.setHex(0x060e1a); // Restore cavern atmosphere fog
                        world.scene.fog.near = 35.0;
                        world.scene.fog.far = 140.0;
                    }
                }
                if (this.underwaterOverlay) this.underwaterOverlay.style.opacity = '0.04';
                // Head above water: slowly steady nerves
                this.stress = Math.max(15, this.stress - delta * 3.2);
            }

            this.camera.position.set(this.position.x, headY, this.position.z);
            this.roll = Math.sin(this.swimCycle * 0.5) * 0.07;
        } else {
            // Normal walking / crawling on solid ground
            if (this.isHeadSubmerged) {
                this.isHeadSubmerged = false;
                if (window.soundEngine && window.soundEngine.setUnderwater) window.soundEngine.setUnderwater(false);
                if (this.underwaterOverlay) this.underwaterOverlay.style.opacity = '0';
                if (world && world.scene && world.scene.fog) {
                    world.scene.fog.color.setHex(0x060e1a);
                    world.scene.fog.near = 35.0;
                    world.scene.fog.far = 140.0;
                }
            }
            if (world) {
                this.position.y = world.getGroundHeight(this.position.x, this.position.z);
            }
            const targetEyeH = this.isCrouching ? this.crouchEyeHeight : this.standEyeHeight;
            this.currentEyeHeight = THREE.MathUtils.lerp(this.currentEyeHeight, targetEyeH, delta * 8.0);
            const bob = this.isMoving ? Math.sin(this.bobCycle) * (this.isSprinting ? 0.06 : 0.035) : 0;
            this.camera.position.set(this.position.x, this.position.y + this.currentEyeHeight + bob, this.position.z);
            this.stress = Math.max(10, this.stress - delta * 2.2);
            this.roll = 0;
        }

        // Concussive Tremor / Hit Sway
        if (this.concussiveSway > 0) {
            this.roll += Math.sin(performance.now() * 0.008) * this.concussiveSway;
            this.concussiveSway = Math.max(0, this.concussiveSway - delta * 0.15);
        }

        this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

        // Dynamic BPM calculation based on Stress level and Oxygen Depletion
        const o2Deficit = Math.max(0, 100 - this.oxygen);
        this.heartbeatBpm = Math.round(65 + (this.stress / 100) * 88 + (o2Deficit / 100) * 25);

        // Update Stance HUD text
        const stanceEl = document.getElementById('hud-stance-value');
        if (stanceEl) {
            if (this.isSwimming) {
                stanceEl.textContent = this.isHeadSubmerged ? "SWIMMING [SUBMERGED]" : "SWIMMING [SURFACED]";
                stanceEl.style.color = this.isHeadSubmerged ? "#00e5ff" : "#69f0ae";
            } else if (this.isForcedCrawl) {
                stanceEl.textContent = "CRAWLING [EXHAUSTED]";
                stanceEl.style.color = "#ff9100";
            } else {
                stanceEl.textContent = this.isCrouching ? "CROUCHING [C]" : "STANDING [C]";
                stanceEl.style.color = this.isCrouching ? "#ffd54f" : "#69f0ae";
            }
        }

        // 6. Oxygen Consumption
        let o2DrainRate = 0.55; // Base drain rate per second
        if (this.isSprinting) o2DrainRate *= 2.8;
        if (this.isSwimming) o2DrainRate *= 1.8;

        // Hyperventilation multiplier from panic / high BPM:
        // High stress and panic drastically increase O2 consumption (up to 3.2x)!
        const panicO2Multiplier = 1.0 + (this.stress / 100) * 2.2;
        o2DrainRate *= panicO2Multiplier;

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
                    this.stress = Math.max(10, this.stress - 20); // Fresh air relieves panic!
                    if (window.soundEngine && window.soundEngine.playDeepInhale) window.soundEngine.playDeepInhale();
                    if (window.eventManager) window.eventManager.showNotification("FRESH AIR INHALED! +25% OXYGEN! PANIC SUBSIDING!");
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

        // Update Pulse (BPM) and Stress / Panic Monitor
        const bpmEl = document.getElementById('hud-bpm-value');
        const panicValEl = document.getElementById('hud-panic-value');
        const panicFillEl = document.getElementById('hud-panic-fill');
        if (bpmEl) {
            bpmEl.textContent = `${this.heartbeatBpm} BPM`;
            bpmEl.style.color = this.heartbeatBpm > 130 ? '#ff1744' : (this.heartbeatBpm > 95 ? '#ffb300' : '#69f0ae');
        }
        if (panicValEl) {
            let label = 'CALM';
            let color = '#69f0ae';
            if (this.stress >= 80) {
                label = 'PANIC!';
                color = '#ff1744';
            } else if (this.stress >= 55) {
                label = 'HIGH';
                color = '#ff9100';
            } else if (this.stress >= 30) {
                label = 'ELEVATED';
                color = '#ffd54f';
            }
            panicValEl.textContent = label;
            panicValEl.style.color = color;
        }
        if (panicFillEl) {
            panicFillEl.style.width = `${Math.min(100, Math.round(this.stress))}%`;
            if (this.stress >= 80) {
                panicFillEl.style.background = '#ff1744';
            } else if (this.stress >= 55) {
                panicFillEl.style.background = '#ff9100';
            } else if (this.stress >= 30) {
                panicFillEl.style.background = '#ffd54f';
            } else {
                panicFillEl.style.background = '#69f0ae';
            }
        }

        // Update First-Person Pickaxe if available
        if (window.pickaxeSystem) {
            window.pickaxeSystem.update(delta, this.isMoving, this.isSprinting);
        }
    }
}

window.PlayerController = PlayerController;
