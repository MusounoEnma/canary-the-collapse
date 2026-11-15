/**
 * CANARY: The Collapse - Dynamic Event Manager
 * Precision Rhythm Pickaxe Breach, Corpse Looting, Aftershocks & Escape Hatch.
 */

class EventManager {
    constructor() {
        this.currentRubble = null;
        this.currentCorpse = null;
        this.isNearHatch = false;
        
        // Rhythm Mini-game state
        this.isRhythmActive = false;
        this.needlePos = 0; // 0 to 100
        this.needleSpeed = 95; // Speed of oscillation
        this.needleDir = 1;
        this.sweetSpotMin = 40;
        this.sweetSpotMax = 60;
        this.rhythmCombo = 0;

        // Earthquake aftershock timer
        this.nextAftershockTimer = 35.0;
        this.isEarthquakeShaking = false;
        this.earthquakeDuration = 0;

        // Story dialog / note modal
        this.isNoteModalOpen = false;

        this.initRhythmListeners();
    }

    initRhythmListeners() {
        window.addEventListener('keydown', (e) => {
            if (this.isRhythmActive) {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.strikePickaxe();
                } else if (e.code === 'Escape') {
                    this.closeRhythmMinigame();
                }
            } else if (this.isNoteModalOpen) {
                if (e.code === 'KeyE' || e.code === 'Escape' || e.code === 'Space') {
                    this.closeNoteModal();
                }
            }
        });
    }

    // Dynamic Interaction check called in game loop
    checkInteractions(player, world) {
        if (!player || !world || this.isRhythmActive || this.isNoteModalOpen) return;

        const pPos = player.position;
        const promptEl = document.getElementById('interaction-prompt');
        let promptText = '';

        // 1. Check Rubbles
        let foundRubble = null;
        world.rubbleObjects.forEach(r => {
            if (!r.cleared) {
                const distZ = Math.abs(pPos.z - r.z);
                if (distZ < 3.2 && Math.abs(pPos.x) < 2.0) {
                    foundRubble = r;
                }
            }
        });

        if (foundRubble) {
            this.currentRubble = foundRubble;
            promptText = `[E] TEMBUS RERUNTUHAN BATU DENGAN BELIUNG (${foundRubble.currentHealth}/${foundRubble.maxHealth})`;
        } else {
            this.currentRubble = null;
        }

        // 2. Check Corpses
        let foundCorpse = null;
        if (!foundRubble) {
            world.corpseObjects.forEach(c => {
                if (!c.looted) {
                    const dist = pPos.distanceTo(c.pos);
                    if (dist < 2.4) {
                        foundCorpse = c;
                    }
                }
            });

            if (foundCorpse) {
                this.currentCorpse = foundCorpse;
                promptText = `[E] PERIKSA REKAN KERJA (${foundCorpse.name} - ${foundCorpse.role})`;
            } else {
                this.currentCorpse = null;
            }
        }

        // 3. Check Escape Hatch at -265m
        if (!foundRubble && !foundCorpse && world.escapeHatch) {
            const distToHatch = Math.abs(pPos.z - world.escapeHatch.z);
            if (distToHatch < 3.5) {
                this.isNearHatch = true;
                promptText = `[E] BUKA KATUP DARURAT SHAFT PERMUKAAN (780m ➔ 0m)`;
            } else {
                this.isNearHatch = false;
            }
        }

        if (promptEl) {
            if (promptText) {
                promptEl.textContent = promptText;
                promptEl.style.display = 'block';
            } else {
                promptEl.style.display = 'none';
            }
        }
    }

    handleInteraction() {
        if (this.currentRubble) {
            this.startRhythmMinigame(this.currentRubble);
        } else if (this.currentCorpse) {
            this.lootCorpse(this.currentCorpse);
        } else if (this.isNearHatch) {
            this.triggerEscapeSequence();
        }
    }

    // -------------------------------------------------------------
    // PRECISION RHYTHM PICKAXE BREACH MINI-GAME
    // -------------------------------------------------------------
    startRhythmMinigame(rubble) {
        this.isRhythmActive = true;
        this.currentRubble = rubble;
        this.needlePos = 10;
        this.needleDir = 1;
        this.needleSpeed = 110 + (rubble.maxHealth - rubble.currentHealth) * 20; // Gets faster as rocks crack
        this.rhythmCombo = 0;

        // Randomize sweet spot zone between 35% and 65%
        this.sweetSpotMin = 35 + Math.random() * 15;
        this.sweetSpotMax = this.sweetSpotMin + 18;

        const overlay = document.getElementById('rhythm-minigame-overlay');
        const titleEl = document.getElementById('rhythm-rubble-title');
        const healthEl = document.getElementById('rhythm-health-text');
        const sweetSpotEl = document.getElementById('rhythm-sweet-spot');

        if (titleEl) titleEl.textContent = rubble.name;
        if (healthEl) healthEl.textContent = `Kerapatan Bebatuan: ${rubble.currentHealth} / ${rubble.maxHealth}`;

        // Position sweet spot on visual bar
        if (sweetSpotEl) {
            sweetSpotEl.style.left = `${this.sweetSpotMin}%`;
            sweetSpotEl.style.width = `${this.sweetSpotMax - this.sweetSpotMin}%`;
        }

        if (overlay) overlay.style.display = 'flex';
        document.exitPointerLock();

        if (window.gameState) {
            window.gameState.state = 'MINIGAME';
        }
    }

    updateRhythm(delta) {
        if (!this.isRhythmActive) return;

        // Oscillate needle back and forth
        this.needlePos += this.needleDir * this.needleSpeed * delta;
        if (this.needlePos >= 98) {
            this.needlePos = 98;
            this.needleDir = -1;
        } else if (this.needlePos <= 2) {
            this.needlePos = 2;
            this.needleDir = 1;
        }

        const needleEl = document.getElementById('rhythm-needle');
        if (needleEl) {
            needleEl.style.left = `${this.needlePos}%`;
        }
    }

    strikePickaxe() {
        if (!this.isRhythmActive || !this.currentRubble) return;

        const feedbackEl = document.getElementById('rhythm-feedback');
        const healthEl = document.getElementById('rhythm-health-text');

        // Check if needle is inside Sweet Spot
        const isHit = (this.needlePos >= this.sweetSpotMin && this.needlePos <= this.sweetSpotMax);

        if (isHit) {
            // PERFECT STRIKE!
            if (window.soundEngine) window.soundEngine.playPickaxeHit(true);
            this.currentRubble.currentHealth--;
            this.rhythmCombo++;

            if (feedbackEl) {
                feedbackEl.textContent = "HANTAMAN SEMPURNA! RETAKAN TERBUKA LEBAR!";
                feedbackEl.className = "hit-perfect";
            }

            // Screen shockwave
            this.triggerScreenShake(0.35, 8);

            if (healthEl) {
                healthEl.textContent = `Kerapatan Bebatuan: ${this.currentRubble.currentHealth} / ${this.currentRubble.maxHealth}`;
            }

            if (this.currentRubble.currentHealth <= 0) {
                // Completely breached!
                if (feedbackEl) feedbackEl.textContent = "BONGKAHAN BATU HANCUR TOTAL! JALAN TERBUKA!";
                setTimeout(() => {
                    if (window.gameWorld) window.gameWorld.removeRubble(this.currentRubble.id);
                    this.showNotification("Reruntuhan berhasil dihancurkan! Terus bergerak!");
                    this.closeRhythmMinigame();
                }, 700);
            } else {
                // Shift sweet spot for next strike
                this.sweetSpotMin = 25 + Math.random() * 40;
                this.sweetSpotMax = this.sweetSpotMin + 16;
                const sweetSpotEl = document.getElementById('rhythm-sweet-spot');
                if (sweetSpotEl) {
                    sweetSpotEl.style.left = `${this.sweetSpotMin}%`;
                    sweetSpotEl.style.width = `${this.sweetSpotMax - this.sweetSpotMin}%`;
                }
            }
        } else {
            // MISSED STRIKE!
            if (window.soundEngine) {
                window.soundEngine.playPickaxeHit(false);
                window.soundEngine.playEarthquake(1.8);
            }
            if (feedbackEl) {
                feedbackEl.textContent = "HANTAMAN MELESET! BELIUNG MEMICU GETARAN BATU!";
                feedbackEl.className = "hit-miss";
            }

            // Lose extra oxygen and trigger vibration
            if (window.gamePlayer) {
                window.gamePlayer.oxygen = Math.max(0, window.gamePlayer.oxygen - 4.5);
            }
            this.triggerScreenShake(0.7, 14);
        }
    }

    closeRhythmMinigame() {
        this.isRhythmActive = false;
        const overlay = document.getElementById('rhythm-minigame-overlay');
        if (overlay) overlay.style.display = 'none';

        if (window.gameState && window.gameState.state === 'MINIGAME') {
            window.gameState.state = 'PLAYING';
            if (window.gamePlayer && window.gamePlayer.domElement) {
                window.gamePlayer.domElement.requestPointerLock();
            }
        }
    }

    // -------------------------------------------------------------
    // CORPSE LOOTING & STORY NOTES
    // -------------------------------------------------------------
    lootCorpse(corpse) {
        corpse.looted = true;
        if (corpse.valveLight) corpse.valveLight.intensity = 0;

        // Refill Player Oxygen
        if (window.gamePlayer) {
            const prevO2 = window.gamePlayer.oxygen;
            window.gamePlayer.oxygen = Math.min(100, window.gamePlayer.oxygen + corpse.o2Bonus);
            const gained = Math.round(window.gamePlayer.oxygen - prevO2);
            if (window.soundEngine) window.soundEngine.playOxygenRefill();
            this.showNotification(`+${gained}% O2 Cadangan dari ransel ${corpse.name}!`);
        }

        // Show Story Note Modal
        this.showCorpseNote(corpse);
    }

    showCorpseNote(corpse) {
        this.isNoteModalOpen = true;
        document.exitPointerLock();

        const modal = document.getElementById('story-note-modal');
        const titleEl = document.getElementById('note-miner-name');
        const bodyEl = document.getElementById('note-miner-body');

        if (titleEl) titleEl.textContent = `Lencana Tambang: ${corpse.name} (${corpse.role})`;
        if (bodyEl) {
            bodyEl.innerHTML = `
                <p><strong>Catatan Terakhir:</strong></p>
                <p class="handwriting-text">"${corpse.note}"</p>
                <div class="note-loot-info">
                    <span>✔ Tabung O2 Darurat Diserap (+${corpse.o2Bonus}%)</span><br>
                    <span>✔ Baterai Senter Helm Diisi Ulang</span>
                </div>
            `;
        }

        if (modal) modal.style.display = 'flex';
        if (window.gameState) window.gameState.state = 'INSPECTING';
    }

    closeNoteModal() {
        this.isNoteModalOpen = false;
        const modal = document.getElementById('story-note-modal');
        if (modal) modal.style.display = 'none';

        if (window.gameState && window.gameState.state === 'INSPECTING') {
            window.gameState.state = 'PLAYING';
            if (window.gamePlayer && window.gamePlayer.domElement) {
                window.gamePlayer.domElement.requestPointerLock();
            }
        }
    }

    // -------------------------------------------------------------
    // AFTERSHOCKS & EARTHQUAKES
    // -------------------------------------------------------------
    updateAftershocks(delta) {
        this.nextAftershockTimer -= delta;
        if (this.nextAftershockTimer <= 0) {
            this.nextAftershockTimer = 38.0 + Math.random() * 25.0;
            this.triggerAftershock();
        }

        if (this.isEarthquakeShaking) {
            this.earthquakeDuration -= delta;
            if (this.earthquakeDuration <= 0) {
                this.isEarthquakeShaking = false;
                document.body.classList.remove('earthquake-shake');
            }
        }
    }

    triggerAftershock() {
        this.isEarthquakeShaking = true;
        this.earthquakeDuration = 4.2;
        if (window.soundEngine) {
            window.soundEngine.playEarthquake(4.2);
            window.soundEngine.setTinnitus(0.18);
            setTimeout(() => {
                if (window.soundEngine) window.soundEngine.setTinnitus(0.0001);
            }, 3500);
        }
        document.body.classList.add('earthquake-shake');
        this.showNotification("GEMPA SUSULAN MENGGUNCANG SHAFT! BEBATUAN BERJATUHAN!");
    }

    triggerScreenShake(duration, intensity) {
        const viewport = document.getElementById('game-container');
        if (!viewport) return;

        let elapsed = 0;
        const shakeInterval = setInterval(() => {
            elapsed += 0.03;
            const x = (Math.random() - 0.5) * intensity;
            const y = (Math.random() - 0.5) * intensity;
            viewport.style.transform = `translate(${x}px, ${y}px)`;

            if (elapsed >= duration) {
                clearInterval(shakeInterval);
                viewport.style.transform = 'none';
            }
        }, 30);
    }

    // -------------------------------------------------------------
    // ESCAPE HATCH VICTORY SEQUENCE
    // -------------------------------------------------------------
    triggerEscapeSequence() {
        if (window.gameState) {
            window.gameState.triggerVictory();
        }
    }

    showNotification(text) {
        const banner = document.getElementById('notification-banner');
        if (!banner) return;
        banner.textContent = text;
        banner.classList.add('active');
        clearTimeout(this.notificationTimer);
        this.notificationTimer = setTimeout(() => {
            banner.classList.remove('active');
        }, 3800);
    }
}

window.EventManager = EventManager;

