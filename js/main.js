/**
 * CANARY: The Collapse - Main Game Orchestrator & State Machine
 * Features:
 * - Real-time climbing depth & distance-to-hatch compass indicator.
 * - Narrative monologue subtitle system triggering at key story milestones.
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
            midway: false,
            hypoxia: false,
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
        // Atmospheric mine dust fog (gentle density so cave walls are visible)
        this.scene.fog = new THREE.FogExp2(0x121014, 0.024);

        // Ambient & Directional Cave Illumination
        const hemiLight = new THREE.HemisphereLight(0x4a3f35, 0x1e1914, 0.55);
        this.scene.add(hemiLight);

        const ambLight = new THREE.AmbientLight(0x221c16, 0.35);
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

        // Initialize UI Elements & Event Listeners
        this.initUI();

        // Start Loop
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

        // Click HUD polaroid to inspect
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

        // Initial render of Polaroid thumbnail on HUD
        if (window.polaroidSystem) {
            window.polaroidSystem.setupCanvases();
            window.polaroidSystem.updateHUD(100);
        }
    }

    startGame() {
        if (window.soundEngine) {
            window.soundEngine.init();
            window.soundEngine.resume();
        }

        const titleScreen = document.getElementById('title-screen');
        const hud = document.getElementById('hud-layer');

        if (titleScreen) titleScreen.style.display = 'none';
        if (hud) hud.style.display = 'block';

        this.state = 'PLAYING';
        this.oxygen = 100.0;
        this.player.oxygen = 100.0;
        this.player.domElement.requestPointerLock();

        // Initial story monologue
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
                line = "A massive rockslide blocked the path completely. My pickaxe... remember the mining drills. Strike the weak fracture point!";
                this.monologueFlags.firstRubble = true;
                break;
            case "midway":
                line = "Air is burning my throat... lungs feel like lead. Keep moving, Henry. Think of Lily's smile. Just keep moving.";
                this.monologueFlags.midway = true;
                break;
            case "hypoxia":
                line = "Lily...? Is that you in the golden light? Sweetheart, wait for daddy! Don't fade into the dust... please don't leave me!";
                this.monologueFlags.hypoxia = true;
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
                } else if (!this.monologueFlags.midway && pz < -120 && pz > -140) {
                    this.triggerMonologue("midway");
                } else if (!this.monologueFlags.hypoxia && this.oxygen < 35 && this.oxygen > 15) {
                    this.triggerMonologue("hypoxia");
                } else if (!this.monologueFlags.nearExit && pz < -240) {
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

        const o2 = Math.max(0, Math.min(100, this.oxygen));

        if (o2ValEl) o2ValEl.textContent = `${Math.ceil(o2)}%`;
        if (o2BarEl) {
            o2BarEl.style.width = `${o2}%`;
            if (o2 < 25) {
                o2BarEl.style.backgroundColor = '#ff1744';
            } else if (o2 < 50) {
                o2BarEl.style.backgroundColor = '#ff9100';
            } else {
                o2BarEl.style.backgroundColor = '#00e676';
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
                const vignetteStrength = (0.4 + severity * 0.55).toFixed(2);
                hypoxiaOverlay.style.background = `radial-gradient(circle, rgba(0,0,0,0) 25%, rgba(0,0,0,${vignetteStrength}) 85%)`;
                if (window.soundEngine) {
                    window.soundEngine.setTinnitus(severity * 0.22);
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
window.addEventListener('DOMContentLoaded', () => {
    window.gameState.init();
});
