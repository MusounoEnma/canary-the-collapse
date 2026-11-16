/**
 * CANARY: The Collapse - Main Game Orchestrator & State Machine
 * Features:
 * - Real-time climbing depth & distance-to-hatch compass indicator.
 * - Narrative monologue subtitle system triggering at key story milestones (including post-tumble & final desperation).
 * - High-tension oxygen calculation in final unassisted stretch.
 * - Full English standardization.
 */

class GameState {
    constructor() {
        this.state = 'MENU'; // 'MENU' | 'PLAYING' | 'MINIGAME' | 'INSPECTING' | 'GAMEOVER' | 'VICTORY'
        this.oxygen = 100.0;
        this.depth = 780;
        this.elapsedTime = 0;
        this.isSprinting = false;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.world = null;
        this.player = null;
        this.events = null;

        // Monologue story tracking flags
        this.monologueFlags = {
            start: false,
            firstCorpse: false,
            firstRubble: false,
            tumbleLanded: false,
            swimming: false,
            ropeClimbed: false,
            crawlspace: false,
            midway: false,
            hypoxia: false,
            finalDesperation: false,
            nearExit: false,
            climaxCaveIn: false,
            climaxWaking: false,
            climaxStagger: false
        };
        this.climaxTriggered = false;
        this.monologueTimer = null;

        this.lastTime = performance.now();
    }

    init() {
        const container = document.getElementById('game-container');

        // Three.js Scene Setup
        this.scene = new THREE.Scene();
        window.gameScene = this.scene;
        this.scene.fog = new THREE.FogExp2(0x121014, 0.024);

        // Ambient & Directional Cave Illumination (Guarantees cave is always visible & atmospheric)
        const hemiLight = new THREE.HemisphereLight(0x756b5c, 0x3a3024, 0.85);
        this.scene.add(hemiLight);

        const ambLight = new THREE.AmbientLight(0x453b30, 0.65);
        this.scene.add(ambLight);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 120);
        this.camera.position.set(0, 1.7, 0);

        // WebGL Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.35;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Initialize World, Player & Events
        this.world = new MineWorld(this.scene);
        window.gameWorld = this.world;

        this.player = new PlayerController(this.camera, this.renderer.domElement);
        window.gamePlayer = this.player;

        this.events = new EventManager();
        window.eventManager = this.events;

        // Window Resize Handling
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.initUI();

        requestAnimationFrame((t) => this.loop(t));
    }

    initUI() {
        const startBtn = document.getElementById('btn-start-game');
        const restartBtn = document.getElementById('btn-restart-game');
        const winRestartBtn = document.getElementById('btn-win-restart');
        const flipBtn = document.getElementById('btn-flip-polaroid');
        const closeInspectBtn = document.getElementById('btn-close-inspect');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
            });
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        if (winRestartBtn) {
            winRestartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        if (flipBtn) {
            flipBtn.addEventListener('click', () => {
                if (window.polaroidSystem) window.polaroidSystem.flipPhoto();
            });
        }

        if (closeInspectBtn) {
            closeInspectBtn.addEventListener('click', () => {
                if (window.polaroidSystem && window.polaroidSystem.isInspecting) {
                    window.polaroidSystem.toggleInspect();
                }
                if (this.state === 'INSPECTING') {
                    this.state = 'PLAYING';
                    if (this.player && this.player.domElement) {
                        this.player.domElement.requestPointerLock();
                    }
                }
            });
        }

        const hudPolaroid = document.getElementById('polaroid-container');
        if (hudPolaroid) {
            hudPolaroid.addEventListener('click', () => {
                if (this.state === 'PLAYING') {
                    if (window.polaroidSystem) window.polaroidSystem.toggleInspect();
                    this.state = 'INSPECTING';
                    document.exitPointerLock();
                }
            });
        }

        window.addEventListener('keydown', (e) => {
            if (this.state === 'MENU' && (e.code === 'Space' || e.code === 'Enter')) {
                this.startGame();
            }
        });

        if (window.polaroidSystem) {
            window.polaroidSystem.setupCanvases();
            window.polaroidSystem.updateHUD(100);
        }
    }

    startGame() {
        if (this.state === 'PLAYING') return;

        if (!this.isInitialized) {
            this.isInitialized = true;
            this.init();
        }

        try {
            if (window.soundEngine) {
                window.soundEngine.init();
                window.soundEngine.resume();
            }
        } catch (err) {
            console.warn("Audio init deferred:", err);
        }

        const titleScreen = document.getElementById('title-screen');
        const hud = document.getElementById('hud-layer');

        if (titleScreen) {
            titleScreen.style.display = 'none';
            titleScreen.style.pointerEvents = 'none';
        }
        if (hud) hud.style.display = 'block';

        this.state = 'PLAYING';
        this.oxygen = 100.0;
        if (this.player) {
            this.player.oxygen = 100.0;
            this.player.startWakeUpIntro();
            try {
                if (this.player.domElement) {
                    const lockPromise = this.player.domElement.requestPointerLock();
                    if (lockPromise && lockPromise.catch) {
                        lockPromise.catch(e => {
                            console.warn("Pointer lock deferred (click viewport to lock):", e);
                        });
                    }
                }
            } catch (e) {
                console.warn("Pointer lock error deferred:", e);
            }
        }

        setTimeout(() => {
            this.triggerMonologue("start");
        }, 3600);
    }

    // Monologue Subtitle System
    triggerMonologue(type) {
        const box = document.getElementById('monologue-box');
        const textEl = document.getElementById('monologue-text');
        if (!box || !textEl) return;

        let line = "";
        switch (type) {
            case "start":
                line = "God... the whole shaft collapsed on us. I have to crawl upward... Lily is waiting on the porch for me.";
                this.monologueFlags.start = true;
                break;
            case "firstCorpse":
                line = "Tomas... no, not you too brother. Forgive me, I need your oxygen tank. I made a promise to my girl... I have to make it home.";
                this.monologueFlags.firstCorpse = true;
                break;
            case "firstRubble":
                line = "A massive rockslide blocked the path completely. My pickaxe... remember the mining drills. Strike anywhere in the green zone!";
                this.monologueFlags.firstRubble = true;
                break;
            case "pickaxeBroken":
                line = "Dammit! The pickaxe snapped clean in two on that bedrock! Main drift is sealed shut... wait, there's a side drainage chute on the left! It's steep, but it's my only way!";
                break;
            case "tumbleLanded":
                line = "Aaargh! The precipice gave way! I fell down into the lower flooded drainage rift... my mask cracked! The air is leaking out! No more backups down here... I have to climb up fast!";
                this.monologueFlags.tumbleLanded = true;
                break;
            case "waterLilyScene":
                line = "My headlamp... water killed the bulb! It's pitch black down here... Wait! Lily?! Is that you in the golden light across the water? Sweetheart, wait for daddy... don't fade away!";
                break;
            case "swimming":
                line = "Water is freezing... respirator is submerged! Gotta keep paddling across this flooded sump to reach the rope!";
                this.monologueFlags.swimming = true;
                break;
            case "ropeClimbed":
                line = "Made it up the rope... arms burning. The surface escape hatch is just ahead in the upper canyon!";
                this.monologueFlags.ropeClimbed = true;
                break;
            case "crowbarRetrieved":
                line = "A heavy carbide crowbar and a spare O2 canister! Restored some air (+15%). If there are more cave-ins near the surface, I can pry them open now.";
                break;
            case "crawlspace":
                line = "The cavern ceiling collapsed into a razor-thin fissure... I have to drop down on my knees [C] and crawl under the crushing weight.";
                this.monologueFlags.crawlspace = true;
                break;
            case "midway":
                line = "Air is burning my throat... lungs feel like lead. Keep moving, Henry. Think of Lily's smile. Just keep moving.";
                this.monologueFlags.midway = true;
                break;
            case "hypoxia":
                line = "Lily...? Is that you in the golden light? Sweetheart, wait for daddy! Don't fade into the dust... please don't leave me!";
                this.monologueFlags.hypoxia = true;
                break;
            case "finalDesperation":
                line = "Lungs... on fire... can't breathe... Lily, I'm right here! Don't let me fall now!";
                this.monologueFlags.finalDesperation = true;
                break;
            case "headlamp":
                line = "Dammit, not now! Headlamp wire came loose... need to tap my helmet [F] to kickstart the battery!";
                break;
            case "nearExit":
                line = "I see the green beacon of Emergency Hatch B-4! I can smell fresh mountain air! Almost there!";
                this.monologueFlags.nearExit = true;
                break;
            case "climaxCaveIn":
                line = "WHAT'S HAPPENING?! THE WHOLE CEILING IS CRACKING OPEN—! LOOK OUT!!";
                this.monologueFlags.climaxCaveIn = true;
                break;
            case "climaxWaking":
                line = "Ugh... god... my ribs... pinned under the stones... I can't move... vision fading...";
                this.monologueFlags.climaxWaking = true;
                break;
            case "climaxStagger":
                line = "Lily... I promised on the porch. I will NOT die in this darkness! GET UP, HENRY! PUSH FOR THE LIGHT!";
                this.monologueFlags.climaxStagger = true;
                break;
        }

        if (!line) return;

        textEl.textContent = `"${line}"`;
        box.classList.add('visible');

        clearTimeout(this.monologueTimer);
        this.monologueTimer = setTimeout(() => {
            box.classList.remove('visible');
        }, 6500);
    }

    triggerPhotoComfort() {
        this.events.showNotification("Looking at Lily's smile strengthens your resolve: 'I will make it home...'");
        if (window.soundEngine) {
            window.soundEngine.setTinnitus(0.0001);
        }
    }

    loop(currentTime) {
        requestAnimationFrame((t) => this.loop(t));

        const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        if (this.state === 'PLAYING' || this.state === 'MINIGAME' || this.state === 'INSPECTING') {
            this.elapsedTime += delta;

            if (this.player) {
                this.player.update(delta, this.world);
                this.oxygen = this.player.oxygen;
                this.isSprinting = this.player.isSprinting;
            }

            if (this.world && this.player) {
                this.world.update(delta, this.player.position, this.oxygen);
            }

            if (this.events) {
                this.events.checkInteractions(this.player, this.world);
                this.events.updateAftershocks(delta);
                if (this.state === 'MINIGAME') {
                    this.events.updateRhythm(delta);
                }
            }

            // Real-time Climbing Depth Tracking & Compass Distance
            if (this.player) {
                const progressRatio = Math.max(0, Math.min(1.0, (-this.player.position.z) / 340));
                this.depth = Math.round(780 * (1.0 - progressRatio));

                const distToHatch = Math.max(0, Math.round(Math.abs(-340 - this.player.position.z)));
                const distEl = document.getElementById('hud-distance-to-hatch');
                if (distEl) distEl.textContent = `${distToHatch}m`;

                // Check Story Monologue Triggers along the winding path
                const pz = this.player.position.z;
                if (!this.climaxTriggered && pz <= -326) {
                    this.triggerClimaxCaveIn();
                } else if (!this.monologueFlags.firstCorpse && pz < -18 && pz > -32) {
                    this.triggerMonologue("firstCorpse");
                } else if (!this.monologueFlags.firstRubble && pz < -42 && pz > -55) {
                    this.triggerMonologue("firstRubble");
                } else if (!this.monologueFlags.midway && pz < -115 && pz > -130) {
                    this.triggerMonologue("midway");
                } else if (!this.monologueFlags.crawlspace && pz < -226 && pz > -235) {
                    this.triggerMonologue("crawlspace");
                } else if (!this.monologueFlags.hypoxia && this.oxygen < 35 && this.oxygen > 15) {
                    this.triggerMonologue("hypoxia");
                } else if (!this.monologueFlags.finalDesperation && this.oxygen < 12 && pz < -280) {
                    this.triggerMonologue("finalDesperation");
                } else if (!this.monologueFlags.nearExit && pz < -320) {
                    this.triggerMonologue("nearExit");
                }
            }

            this.updateHUDAndHypoxia();
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    triggerClimaxCaveIn() {
        this.climaxTriggered = true;
        this.triggerMonologue("climaxCaveIn");

        // 1. Catastrophic violent earthquake tremor & boulder shower from ceiling
        if (this.events) {
            this.events.triggerScreenShake(2.5, 26);
        }
        if (window.soundEngine) {
            window.soundEngine.playHeavyCaveInThud();
        }
        if (this.world && this.player) {
            this.world.spawnClimaxFallingBoulders(this.player.position);
        }

        // 2. Heavy crushing stone impact & blackout (knocked unconscious)
        setTimeout(() => {
            const blackout = document.getElementById('climax-blackout-overlay');
            if (blackout) blackout.classList.add('blackout');

            if (this.player) {
                this.player.isClimaxKnockedOut = true;
            }

            if (window.soundEngine) {
                window.soundEngine.playHeavyCaveInThud();
                window.soundEngine.setTinnitus(0.35);
            }
        }, 1500);

        // 3. Narrative Unconscious Memory Sequence: Promises to Lily in the darkness
        const memContainer = document.getElementById('climax-memory-container');
        const memSpeaker = document.getElementById('climax-memory-speaker');
        const memText = document.getElementById('climax-memory-text');

        // First Memory (2.8s)
        setTimeout(() => {
            if (memContainer) memContainer.classList.add('active');
            if (memSpeaker) memSpeaker.textContent = "LILY'S VOICE (IN YOUR FADING MIND)";
            if (memText) memText.textContent = "“Daddy, don't forget your promise... You said we'd plant sunflowers by the porch this spring.”";
            if (window.soundEngine) window.soundEngine.playMemoryMusicBox();
        }, 2800);

        // Second Memory (7.8s)
        setTimeout(() => {
            if (memSpeaker) memSpeaker.textContent = "MEMORY OF HOME";
            if (memText) memText.textContent = "Her tiny laugh... Her warm little hand clutching my miner coat before the morning horn blew.";
            if (window.soundEngine) window.soundEngine.playHeavyHeartbeat();
        }, 7800);

        // Third Memory (12.8s)
        setTimeout(() => {
            if (memSpeaker) memSpeaker.textContent = "YOUR SACRED VOW";
            if (memText) memText.textContent = "“I promised on Sarah's grave... I will NOT leave my little girl alone in this world. I'M COMING HOME!”";
            if (window.soundEngine) window.soundEngine.playHeavyHeartbeat();
        }, 12800);

        // 4. Regaining consciousness (siuman): blurred vision & ragged gasping breath (17.5s)
        setTimeout(() => {
            if (memContainer) memContainer.classList.remove('active');

            const blackout = document.getElementById('climax-blackout-overlay');
            if (blackout) {
                blackout.classList.remove('blackout');
                blackout.classList.add('blurred-vision');
            }

            if (window.soundEngine) {
                window.soundEngine.playRaggedBreath();
                window.soundEngine.setTinnitus(0.12);
            }

            this.triggerMonologue("climaxWaking");
        }, 17500);

        // 5. Focus on Lily's Photo clutched tightly in hand (Restoring Resolve & Adrenaline) (20.5s)
        setTimeout(() => {
            const polaroidContainer = document.getElementById('climax-polaroid-container');
            if (polaroidContainer) polaroidContainer.classList.add('active');

            if (window.polaroidSystem && typeof window.polaroidSystem.setupCanvases === 'function') {
                window.polaroidSystem.setupCanvases();
            }

            // Adrenaline surge: restore emergency breath & willpower
            if (this.player) {
                this.player.oxygen = Math.max(this.player.oxygen, 28);
            }

            if (window.soundEngine) {
                window.soundEngine.playHeavyHeartbeat();
            }
        }, 20500);

        // 6. Stand up and stagger toward the dawn light at the exit hatch (25.0s)
        setTimeout(() => {
            const polaroidContainer = document.getElementById('climax-polaroid-container');
            if (polaroidContainer) polaroidContainer.classList.remove('active');

            const blackout = document.getElementById('climax-blackout-overlay');
            if (blackout) blackout.classList.remove('blurred-vision');

            if (this.player) {
                this.player.isClimaxKnockedOut = false;
                this.player.isStaggering = true;
            }

            if (window.soundEngine) {
                window.soundEngine.setTinnitus(0.0001);
            }

            this.triggerMonologue("climaxStagger");
            if (this.events) {
                this.events.showNotification("SURGE OF ADRENALINE! STAGGER TOWARDS THE DAWN LIGHT AT EMERGENCY HATCH B-4!");
            }
        }, 25000);
    }

    updateHUDAndHypoxia() {
        const o2ValEl = document.getElementById('hud-o2-value');
        const o2BarEl = document.getElementById('hud-o2-fill');
        const depthValEl = document.getElementById('hud-depth-value');
        const sprintIndicator = document.getElementById('hud-sprint-status');
        const pressureStatus = document.getElementById('hud-pressure-status');

        const o2 = Math.max(0, Math.min(100, this.oxygen));

        if (o2ValEl) o2ValEl.textContent = `${Math.ceil(o2)}%`;
        if (o2BarEl) {
            o2BarEl.style.width = `${o2}%`;
            if (o2 < 20) {
                o2BarEl.style.backgroundColor = '#ff1744';
            } else if (o2 < 45) {
                o2BarEl.style.backgroundColor = '#ff9100';
            } else {
                o2BarEl.style.backgroundColor = '#00e676';
            }
        }

        if (pressureStatus && this.player) {
            if (this.player.isRespiratorLeaking) {
                pressureStatus.textContent = "VALVE BREACH: CRITICAL LEAK!";
                pressureStatus.style.color = "#ff1744";
                pressureStatus.style.fontWeight = "bold";
            } else {
                pressureStatus.textContent = "PRESSURE: NOMINAL";
                pressureStatus.style.color = "#aaa";
                pressureStatus.style.fontWeight = "normal";
            }
        }

        if (depthValEl) depthValEl.textContent = `${this.depth}m`;

        if (sprintIndicator) {
            sprintIndicator.style.opacity = this.isSprinting ? '1' : '0.25';
        }

        if (window.polaroidSystem) {
            window.polaroidSystem.updateHUD(o2);
        }

        const hypoxiaOverlay = document.getElementById('hypoxia-overlay');
        if (hypoxiaOverlay) {
            if (o2 < 35) {
                hypoxiaOverlay.classList.add('active');
                const severity = (35 - o2) / 35;
                const vignetteStrength = (0.4 + severity * 0.58).toFixed(2);
                hypoxiaOverlay.style.background = `radial-gradient(circle, rgba(0,0,0,0) 20%, rgba(20,0,0,${vignetteStrength}) 85%)`;
                if (window.soundEngine) {
                    window.soundEngine.setTinnitus(severity * 0.25);
                }
            } else {
                hypoxiaOverlay.classList.remove('active');
                hypoxiaOverlay.style.background = 'none';
                if (window.soundEngine && !this.events.isEarthquakeShaking) {
                    window.soundEngine.setTinnitus(0.0001);
                }
            }
        }
    }

    triggerGameOver(reason) {
        this.state = 'GAMEOVER';
        document.exitPointerLock();

        const gameOverScreen = document.getElementById('gameover-screen');
        const reasonEl = document.getElementById('gameover-reason');
        const statsEl = document.getElementById('gameover-stats');

        if (reasonEl) reasonEl.textContent = reason;
        if (statsEl) {
            const distanceClimbed = 780 - this.depth;
            statsEl.textContent = `You ascended ${distanceClimbed} meters out of 780m before running out of air.`;
        }

        if (gameOverScreen) gameOverScreen.style.display = 'flex';
    }

    triggerVictory() {
        this.state = 'VICTORY';
        document.exitPointerLock();

        if (window.soundEngine) {
            window.soundEngine.stopCaveAmbience();
            window.soundEngine.playVictorySequence();
        }

        const victoryScreen = document.getElementById('victory-screen');
        const timeEl = document.getElementById('victory-time');

        if (timeEl) {
            const mins = Math.floor(this.elapsedTime / 60);
            const secs = Math.floor(this.elapsedTime % 60);
            timeEl.textContent = `Escape Time: ${mins} minute(s) ${secs} second(s).`;
        }

        if (victoryScreen) victoryScreen.style.display = 'flex';
    }

    restartGame() {
        window.location.reload();
    }
}

window.gameState = new GameState();

function launchGameInit() {
    if (window.gameState && !window.gameState.isInitialized) {
        window.gameState.isInitialized = true;
        window.gameState.init();
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', launchGameInit);
} else {
    launchGameInit();
}
window.addEventListener('load', launchGameInit);
