/**
 * CANARY: The Collapse - Dynamic Event Manager
 * Features:
 * - Precision Rhythm Pickaxe Breach: Generous 30% green sweet spot, 60 speed, dual strike button & critical hit.
 * - Fallen miner looting with Sub-Shaft 07-C secret corpse (Arthur).
 * - Earthquakes and surface escape hatch.
 */

class EventManager {
    constructor() {
        this.currentRubble = null;
        this.currentCorpse = null;
        this.isNearHatch = false;
        
        // Rhythm Mini-game state
        this.isRhythmActive = false;
        this.needlePos = 10;
        this.needleSpeed = 60; // Gentle, predictable, rhythm tempo (no hyper-speed skip)
        this.needleDir = 1;
        this.sweetSpotMin = 35;
        this.sweetSpotMax = 65; // Wide 30% area
        this.sweetSpotCenter = 50;
        this.hitsDone = 0;
        this.hitsNeeded = 2;

        // Earthquake aftershock timer
        this.nextAftershockTimer = 38.0;
        this.isEarthquakeShaking = false;
        this.earthquakeDuration = 0;

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

        // Click on Strike button or overlay
        const strikeBtn = document.getElementById('btn-strike-pickaxe');
        if (strikeBtn) {
            strikeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.isRhythmActive) {
                    this.strikePickaxe();
                }
            });
        }

        const rhythmOverlay = document.getElementById('rhythm-minigame-overlay');
        if (rhythmOverlay) {
            rhythmOverlay.addEventListener('mousedown', (e) => {
                if (this.isRhythmActive && e.target.tagName !== 'BUTTON') {
                    this.strikePickaxe();
                }
            });
        }
    }

    checkInteractions(player, world) {
        if (!player || !world || this.isRhythmActive || this.isNoteModalOpen) return;

        const pPos = player.position;
        const promptEl = document.getElementById('interaction-prompt');
        let promptText = '';

        // 1. Check Rubbles
        let foundRubble = null;
        world.rubbleObjects.forEach(r => {
            if (!r.cleared) {
                const dist = Math.hypot(pPos.x - r.x, pPos.z - r.z);
                if (dist < 3.2) {
                    foundRubble = r;
                }
            }
        });

        if (foundRubble) {
            this.currentRubble = foundRubble;
            const remaining = foundRubble.currentHealth;
            promptText = `[E] BREACH BOULDER RUBBLE WITH PICKAXE (${remaining} STRIKE${remaining > 1 ? 'S' : ''} NEEDED)`;
        } else {
            this.currentRubble = null;
        }

        // 2. Check Fallen Corpses (including secret Arthur in dead-end branch)
        let foundCorpse = null;
        if (!foundRubble) {
            world.corpseObjects.forEach(c => {
                if (!c.looted) {
                    const dist = pPos.distanceTo(c.pos);
                    if (dist < 2.5) {
                        foundCorpse = c;
                    }
                }
            });

            if (foundCorpse) {
                this.currentCorpse = foundCorpse;
                promptText = `[E] SEARCH FALLEN MINER (${foundCorpse.name} - ${foundCorpse.role})`;
            } else {
                this.currentCorpse = null;
            }
        }

        // 3. Check Escape Hatch at Surface Shaft Head
        if (!foundRubble && !foundCorpse && world.escapeHatch) {
            const distToHatch = Math.hypot(pPos.x - world.escapeHatch.x, pPos.z - world.escapeHatch.z);
            if (distToHatch < 3.6) {
                this.isNearHatch = true;
                promptText = `[E] TURN EMERGENCY SURFACE VALVE WHEEL (780m ➔ 0m)`;
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
        this.needlePos = 8;
        this.needleDir = 1;
        this.needleSpeed = 62; // Smooth, easy-to-read rhythm oscillation
        this.hitsNeeded = rubble.maxHealth;
        this.hitsDone = rubble.maxHealth - rubble.currentHealth;

        // Wide, generous 30% sweet spot area
        this.sweetSpotMin = 32 + Math.random() * 12;
        this.sweetSpotMax = this.sweetSpotMin + 30; // 30% width!
        this.sweetSpotCenter = (this.sweetSpotMin + this.sweetSpotMax) / 2;

        const overlay = document.getElementById('rhythm-minigame-overlay');
        const titleEl = document.getElementById('rhythm-rubble-title');
        const sweetSpotEl = document.getElementById('rhythm-sweet-spot');
        const feedbackEl = document.getElementById('rhythm-feedback');

        if (titleEl) titleEl.textContent = rubble.name;
        if (feedbackEl) {
            feedbackEl.textContent = "PRESS [SPACE] OR CLICK ANYWHERE INSIDE THE GREEN AREA!";
            feedbackEl.className = "";
        }
        this.updateRhythmHealthDisplay();

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

    updateRhythmHealthDisplay() {
        const healthEl = document.getElementById('rhythm-health-text');
        if (!healthEl || !this.currentRubble) return;
        const remaining = Math.max(0, this.currentRubble.currentHealth);
        const pct = Math.round((this.hitsDone / this.hitsNeeded) * 100);
        healthEl.textContent = `Structural Integrity: ${remaining} Strikes Remaining (${pct}% Fractured)`;
    }

    updateRhythm(delta) {
        if (!this.isRhythmActive) return;

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

        // Generous Hit Detection: ANYWHERE inside the entire green zone (+4% edge padding) counts as a successful hit!
        const tolerance = 4.0;
        const isInsideGreenZone = (this.needlePos >= (this.sweetSpotMin - tolerance) && this.needlePos <= (this.sweetSpotMax + tolerance));

        if (isInsideGreenZone) {
            // Check if bullseye critical hit (near the center line)
            const isCritical = Math.abs(this.needlePos - this.sweetSpotCenter) < 5.5;

            if (window.soundEngine) window.soundEngine.playPickaxeHit(true);

            const damage = isCritical ? 2 : 1;
            this.currentRubble.currentHealth -= damage;
            this.hitsDone = Math.min(this.hitsNeeded, this.hitsDone + damage);

            this.triggerScreenShake(0.35, 9);
            this.updateRhythmHealthDisplay();

            if (this.currentRubble.currentHealth <= 0) {
                // Completely breached!
                if (feedbackEl) {
                    feedbackEl.textContent = isCritical ? "CRITICAL BULLSEYE! BOULDERS SHATTERED TO DUST!" : "PERFECT STRIKE! BOULDERS SHATTERED! PATH CLEARED!";
                    feedbackEl.className = "hit-perfect";
                }

                // Instantly remove collision & clear obstacle
                if (window.gameWorld) window.gameWorld.removeRubble(this.currentRubble.id);

                setTimeout(() => {
                    this.showNotification("Cave-in rubble destroyed! Keep moving forward!");
                    this.closeRhythmMinigame();
                }, 400);
            } else {
                if (feedbackEl) {
                    feedbackEl.textContent = isCritical ? "CRITICAL HIT! DEEP STRUCTURAL FRACTURE! (1 MORE TO SHATTER)" : `SUCCESSFUL STRIKE! FRACTURE EXPANDING! (${this.currentRubble.currentHealth} MORE TO SHATTER)`;
                    feedbackEl.className = "hit-perfect";
                }

                // Move sweet spot slightly for next strike
                this.sweetSpotMin = 24 + Math.random() * 32;
                this.sweetSpotMax = this.sweetSpotMin + 30;
                this.sweetSpotCenter = (this.sweetSpotMin + this.sweetSpotMax) / 2;

                const sweetSpotEl = document.getElementById('rhythm-sweet-spot');
                if (sweetSpotEl) {
                    sweetSpotEl.style.left = `${this.sweetSpotMin}%`;
                    sweetSpotEl.style.width = `${this.sweetSpotMax - this.sweetSpotMin}%`;
                }
            }
        } else {
            // Missed outside green zone
            if (window.soundEngine) {
                window.soundEngine.playPickaxeHit(false);
                window.soundEngine.playEarthquake(1.8);
            }
            if (feedbackEl) {
                feedbackEl.textContent = "MISSED GREEN ZONE! GLANCING BLOW CAUSED VIBRATION!";
                feedbackEl.className = "hit-miss";
            }

            if (window.gamePlayer) {
                window.gamePlayer.oxygen = Math.max(0, window.gamePlayer.oxygen - 3.5);
            }
            this.triggerScreenShake(0.6, 11);
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

    lootCorpse(corpse) {
        corpse.looted = true;
        if (corpse.valveLight) corpse.valveLight.intensity = 0;

        if (window.gamePlayer) {
            const prevO2 = window.gamePlayer.oxygen;
            window.gamePlayer.oxygen = Math.min(100, window.gamePlayer.oxygen + corpse.o2Bonus);
            const gained = Math.round(window.gamePlayer.oxygen - prevO2);
            if (window.soundEngine) window.soundEngine.playOxygenRefill();
            this.showNotification(`+${gained}% O2 retrieved from ${corpse.name}'s survival canister!`);
        }

        this.showCorpseNote(corpse);
    }

    showCorpseNote(corpse) {
        this.isNoteModalOpen = true;
        document.exitPointerLock();

        const modal = document.getElementById('story-note-modal');
        const titleEl = document.getElementById('note-miner-name');
        const bodyEl = document.getElementById('note-miner-body');

        if (titleEl) titleEl.textContent = `Miner ID Badge: ${corpse.name} (${corpse.role})`;
        if (bodyEl) {
            bodyEl.innerHTML = `
                <p><strong>Last Recorded Entry:</strong></p>
                <p class="handwriting-text">"${corpse.note}"</p>
                <div class="note-loot-info">
                    <span>✔ High-Capacity O2 Canister Recovered (+${corpse.o2Bonus}%)</span><br>
                    <span>✔ Headlamp Backup Battery Restored</span>
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
        this.showNotification("WARNING: AFTERSHOCK TREMOR SHAKING SHAFT CEILING! DEBRIS FALLING!");
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
