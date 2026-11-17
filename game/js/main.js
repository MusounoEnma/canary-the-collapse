/**
 * CANARY: The Collapse - Master Game Orchestrator & State Machine
 * Coordinates the full 3-Stage subterranean survival expedition (780m depth to 0m surface),
 * persistent saves & checkpoints, sector select, first-person pickaxe 3D rendering,
 * and dramatic climactic escape sequences.
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
        this.pickaxe = null;

        this.boulderSpawnTimer = 0;
        this.isTremorActive = false;
        this.lastTime = performance.now();
    }

    init() {
        const container = document.getElementById('game-container');

        // Three.js Scene Setup
        this.scene = new THREE.Scene();
        window.gameScene = this.scene;
        this.scene.fog = new THREE.FogExp2(0x14171a, 0.012);

        // Balanced Global Ambient Lighting (Crisp contrast, clear cave visibility)
        const hemiLight = new THREE.HemisphereLight(0xb0bec5, 0x37474f, 0.65);
        this.scene.add(hemiLight);

        const ambLight = new THREE.AmbientLight(0xffeedd, 0.55);
        this.scene.add(ambLight);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 160);
        this.camera.position.set(0, 1.7, 0);

        // WebGL Renderer Setup (Smooth 60 FPS, optimized performance)
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25)); // 1.25 pixel ratio for maximum smoothness
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.renderer.shadowMap.enabled = false; // Disable heavy shadow maps to eliminate GPU lag!
        container.appendChild(this.renderer.domElement);

        // Initialize World, Player, Events & Pickaxe
        this.world = new MineWorld(this.scene);
        window.gameWorld = this.world;

        this.player = new PlayerController(this.camera, this.renderer.domElement);
        window.gamePlayer = this.player;

        this.events = new EventManager();
        window.eventManager = this.events;

        this.pickaxe = new PickaxeSystem(this.scene, this.camera);
        window.pickaxeSystem = this.pickaxe;

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
            startBtn.addEventListener('click', () => this.startGame());
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }

        if (winRestartBtn) {
            winRestartBtn.addEventListener('click', () => this.restartGame());
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

        // Render Persistent Sector Select & Resume Buttons on Title Screen
        this.renderSectorSelectButtons();

        if (window.polaroidSystem) {
            window.polaroidSystem.setupCanvases();
            window.polaroidSystem.updateHUD(100);
        }
    }

    renderSectorSelectButtons() {
        const titleScreen = document.getElementById('title-screen');
        if (!titleScreen) return;

        let sectorContainer = document.getElementById('sector-select-container');
        if (!sectorContainer) {
            sectorContainer = document.createElement('div');
            sectorContainer.id = 'sector-select-container';
            sectorContainer.style.cssText = 'margin: 18px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; max-width: 600px;';
            const introCard = titleScreen.querySelector('.story-intro-card');
            if (introCard) {
                introCard.insertAdjacentElement('afterend', sectorContainer);
            }
        }

        const save = window.saveSystem ? window.saveSystem.data : { unlockedSector: 1, lastCheckpoint: null };
        let html = '';

        if (save.lastCheckpoint) {
            html += `<button class="btn-primary" style="background:#00e676; color:#000; font-weight:bold; margin-bottom:6px;" onclick="window.gameState.resumeCheckpoint()">
                ▶ RESUME CHECKPOINT (Sector ${save.lastCheckpoint.sector} - Depth ${save.lastCheckpoint.depth}m)
            </button>`;
        }

        html += `<div style="font-size:12px; color:#ffb300; font-family:monospace; margin-top:4px; letter-spacing:1px;">EXPEDITION SECTOR SELECTION</div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
            <button class="btn-polaroid" style="padding:8px 14px; font-size:12px;" onclick="window.gameState.startAtSector(1)">
                SECTOR 1: VEIN (780m)
            </button>
            <button class="btn-polaroid" style="padding:8px 14px; font-size:12px; ${save.unlockedSector < 2 ? 'opacity:0.4; cursor:not-allowed;' : ''}" onclick="if(${save.unlockedSector >= 2}) window.gameState.startAtSector(2)">
                SECTOR 2: CHUTE & GROTTO (600m) ${save.unlockedSector < 2 ? '🔒' : ''}
            </button>
            <button class="btn-polaroid" style="padding:8px 14px; font-size:12px; ${save.unlockedSector < 3 ? 'opacity:0.4; cursor:not-allowed;' : ''}" onclick="if(${save.unlockedSector >= 3}) window.gameState.startAtSector(3)">
                SECTOR 3: ASCENT & HATCH (300m) ${save.unlockedSector < 3 ? '🔒' : ''}
            </button>
        </div>`;

        sectorContainer.innerHTML = html;
    }

    startGame() {
        this.startAtSector(1);
    }

    startAtSector(sector) {
        if (window.saveSystem) window.saveSystem.recordAttempt();

        try {
            if (window.soundEngine) {
                window.soundEngine.init();
                window.soundEngine.resume();
            }
        } catch (e) {
            console.warn("Sound init deferred:", e);
        }

        const titleScreen = document.getElementById('title-screen');
        const hud = document.getElementById('hud-layer');
        if (titleScreen) titleScreen.style.display = 'none';
        if (hud) hud.style.display = 'block';

        this.state = 'PLAYING';
        this.elapsedTime = 0;

        if (this.player) {
            this.player.oxygen = 100.0;
            this.player.isDead = false;

            if (sector === 1) {
                this.player.position.set(0, 0.8, 0);
                this.player.startIntroWakeUp();
            } else if (sector === 2) {
                this.player.position.set(0, 4.5, -282); // Right at slide entrance
            } else if (sector === 3) {
                this.player.position.set(0, -12.0, -620); // At rope base
            }

            if (this.player.domElement) {
                this.player.domElement.requestPointerLock();
            }
        }
    }

    resumeCheckpoint() {
        if (!window.saveSystem || !window.saveSystem.data.lastCheckpoint) {
            this.startGame();
            return;
        }

        const cp = window.saveSystem.data.lastCheckpoint;
        try {
            if (window.soundEngine) {
                window.soundEngine.init();
                window.soundEngine.resume();
            }
        } catch (e) {}

        const titleScreen = document.getElementById('title-screen');
        const hud = document.getElementById('hud-layer');
        if (titleScreen) titleScreen.style.display = 'none';
        if (hud) hud.style.display = 'block';

        this.state = 'PLAYING';
        if (this.player) {
            this.player.isDead = false;
            this.player.position.set(cp.x, cp.y, cp.z);
            this.player.oxygen = cp.oxygen || 75;
            if (this.player.domElement) {
                this.player.domElement.requestPointerLock();
            }
        }
    }

    triggerTremorClimax() {
        this.isTremorActive = true;
        if (window.soundEngine && window.soundEngine.playTremorRumble) {
            window.soundEngine.playTremorRumble();
        }
    }

    triggerGameOver(reason) {
        this.state = 'GAMEOVER';
        document.exitPointerLock();

        const screen = document.getElementById('gameover-screen');
        const reasonEl = document.getElementById('gameover-reason');
        const statsEl = document.getElementById('gameover-stats');

        if (reasonEl) reasonEl.textContent = reason || "Consciousness faded in the subterranean dark.";
        if (statsEl && this.player) {
            statsEl.textContent = `Depth: ${this.player.depth}m // Distance covered: ${Math.round(865 - (this.player.depth * 865 / 780))}m`;
        }
        if (screen) screen.style.display = 'flex';
    }

    restartGame() {
        location.reload();
    }

    triggerVictory() {
        this.state = 'VICTORY';
        document.exitPointerLock();

        if (window.saveSystem) {
            window.saveSystem.recordVictory(this.elapsedTime);
        }

        if (window.soundEngine && window.soundEngine.playVictorySequence) {
            window.soundEngine.playVictorySequence();
        }

        const winScreen = document.getElementById('victory-screen');
        const winTimeEl = document.getElementById('victory-time');

        if (winTimeEl) {
            const mins = Math.floor(this.elapsedTime / 60);
            const secs = Math.floor(this.elapsedTime % 60);
            const best = window.saveSystem ? window.saveSystem.data.bestEscapeTime : null;
            winTimeEl.innerHTML = `<strong>ESCAPE TIME:</strong> ${mins}m ${secs}s &nbsp;|&nbsp; <strong>RECORD:</strong> ${best ? best + 's' : 'NEW!'}`;
        }

        if (winScreen) winScreen.style.display = 'flex';
    }

    loop(time) {
        requestAnimationFrame((t) => this.loop(t));

        const delta = Math.min(0.1, (time - this.lastTime) / 1000);
        this.lastTime = time;

        if (this.state === 'PLAYING') {
            this.elapsedTime += delta;

            if (this.player) this.player.update(delta);
            if (this.world) this.world.update(delta, this.player ? this.player.position : null, this.player ? this.player.oxygen : 100);
            if (this.events) {
                this.events.checkInteractions(this.player, this.world);
                this.events.update(delta);
            }

            // Stage 3 Active Falling Boulder Hazard
            if (this.isTremorActive && this.player && this.player.position.z < -640 && this.player.position.z > -830) {
                this.boulderSpawnTimer += delta;
                if (this.boulderSpawnTimer > 3.2) {
                    this.boulderSpawnTimer = 0;
                    if (this.world && this.world.stage3) {
                        this.world.stage3.spawnFallingBoulder(this.player.position);
                        this.player.concussiveSway = 0.15; // Tremor concussive sway
                    }
                }
            }

            // Sync Polaroid HUD with Oxygen
            if (window.polaroidSystem && this.player) {
                window.polaroidSystem.updateHUD(this.player.oxygen);
            }
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.gameState = new GameState();
    window.gameState.init();
});
