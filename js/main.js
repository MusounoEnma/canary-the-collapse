/**
 * CANARY: The Collapse - Main Game Orchestrator & State Machine
 * Standardized in full English.
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

        this.lastTime = performance.now();
    }

    init() {
        const container = document.getElementById('game-container');

        // Three.js Scene Setup
        this.scene = new THREE.Scene();
        window.gameScene = this.scene;
        this.scene.fog = new THREE.FogExp2(0x060608, 0.055);

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

        if (this.events) {
            this.events.showNotification("Shaft 07 has collapsed! Climb upward through the winding tunnel before oxygen runs out!");
        }
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

            // Real-time Climbing Depth Tracking (780m down to 0m at surface)
            if (this.player) {
                const progressRatio = Math.max(0, Math.min(1.0, (-this.player.position.z) / 262));
                this.depth = Math.round(780 * (1.0 - progressRatio));
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
