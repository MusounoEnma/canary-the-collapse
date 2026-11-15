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
            midway: false,
            hypoxia: false,
            finalDesperation: false,
            nearExit: false
        };
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

        if (titleScreen) titleScreen.style.display = 'none';
        if (hud) hud.style.display = 'block';

        this.state = 'PLAYING';
        this.oxygen = 100.0;
        if (this.player) {
            this.player.oxygen = 100.0;
            try {
                if (this.player.domElement) {
                    this.player.domElement.requestPointerLock();
                }
            } catch (e) {
                console.warn("Pointer lock deferred:", e);
            }
        }

        setTimeout(() => {
            this.triggerMonologue("start");
        }, 1200);
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
                line = "A heavy carbide crowbar! Sturdy and solid steel. If there are more cave-ins near the surface, I can pry them open now.";
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
                const progressRatio = Math.max(0, Math.min(1.0, (-this.player.position.z) / 262));
                this.depth = Math.round(780 * (1.0 - progressRatio));

                const distToHatch = Math.max(0, Math.round(Math.abs(-262 - this.player.position.z)));
                const distEl = document.getElementById('hud-distance-to-hatch');
                if (distEl) distEl.textContent = `${distToHatch}m`;

                // Check Story Monologue Triggers along the winding path
                const pz = this.player.position.z;
                if (!this.monologueFlags.firstCorpse && pz < -18 && pz > -32) {
                    this.triggerMonologue("firstCorpse");
                } else if (!this.monologueFlags.firstRubble && pz < -42 && pz > -55) {
                    this.triggerMonologue("firstRubble");
                } else if (!this.monologueFlags.midway && pz < -115 && pz > -130) {
                    this.triggerMonologue("midway");
                } else if (!this.monologueFlags.hypoxia && this.oxygen < 35 && this.oxygen > 15) {
                    this.triggerMonologue("hypoxia");
                } else if (!this.monologueFlags.finalDesperation && this.oxygen < 12 && pz < -210) {
                    this.triggerMonologue("finalDesperation");
                } else if (!this.monologueFlags.nearExit && pz < -245) {
                    this.triggerMonologue("nearExit");
                }
            }

            this.updateHUDAndHypoxia();
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
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
