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
        this.isNearRope = false;
        this.isNearCrate = false;
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
                const distThresh = r.isBedrock ? 4.2 : 3.2;
                const dist = Math.hypot(pPos.x - r.x, pPos.z - r.z);
                if (dist < distThresh) {
                    foundRubble = r;
                }
            }
        });

        if (foundRubble) {
            this.currentRubble = foundRubble;
            if (foundRubble.isBedrock) {
                if (player.hasBrokenPickaxe) {
                    promptText = "[IMPASSABLE] MONOLITHIC BEDROCK - PICKAXE BROKEN! TAKE BYPASS DETOUR ◄";
                } else {
                    promptText = "[E] ATTEMPT TO BREACH SOLID BEDROCK WITH PICKAXE";
                }
            } else if (foundRubble.requiresCrowbar) {
                if (!player.hasCrowbar) {
                    promptText = "[BLOCKED] REQUIRES HEAVY CROWBAR (Find gear crate at Upper Ledge)";
                } else {
                    const remaining = foundRubble.currentHealth;
                    promptText = `[E] PRY BOULDER BARRIER WITH CARBIDE CROWBAR (${remaining} PRY STRIKE${remaining > 1 ? 'S' : ''})`;
                }
            } else {
                const remaining = foundRubble.currentHealth;
                promptText = `[E] BREACH BOULDER RUBBLE WITH PICKAXE (${remaining} STRIKE${remaining > 1 ? 'S' : ''} NEEDED)`;
            }
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

        // 3. Check Rescue Rope at Cliff Ledge (z = -195)
        let foundRope = null;
        if (!foundRubble && !foundCorpse && world.rescueRope && !player.hasClimbedRope) {
            const distToRope = Math.hypot(pPos.x - world.rescueRope.x, pPos.z - world.rescueRope.z);
            if (distToRope < 4.8) {
                foundRope = world.rescueRope;
                this.isNearRope = true;
                promptText = `[E] CLIMB RESCUE ROPE TO UPPER CANYON (6.9m VERTICAL ASCENT)`;
            } else {
                this.isNearRope = false;
            }
        } else {
            this.isNearRope = false;
        }

        // 4. Check Emergency Gear Crate (z = -208)
        if (!foundRubble && !foundCorpse && !this.isNearRope && world.gearCrate && !world.gearCrate.retrieved) {
            const distToCrate = Math.hypot(pPos.x - world.gearCrate.x, pPos.z - world.gearCrate.z);
            if (distToCrate < 3.8) {
                this.isNearCrate = true;
                promptText = "[E] RETRIEVE HEAVY CARBIDE CROWBAR FROM RESCUE GEAR CRATE";
            } else {
                this.isNearCrate = false;
            }
        } else {
            this.isNearCrate = false;
        }

        // 5. Check Escape Hatch at Surface Shaft Head (z = -340)
        if (!foundRubble && !foundCorpse && !this.isNearRope && !this.isNearCrate && world.escapeHatch) {
            const distToHatch = Math.hypot(pPos.x - world.escapeHatch.x, pPos.z - world.escapeHatch.z);
            if (distToHatch < 4.8) {
                this.isNearHatch = true;
                promptText = `[E] HEAVE OPEN EMERGENCY SURFACE HATCH (ESCAPE TO SUNLIGHT)`;
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
            if (this.currentRubble.isBedrock) {
                if (window.gamePlayer && window.gamePlayer.hasBrokenPickaxe) {
                    this.showNotification("Pickaxe is broken! Take the illuminated side bypass chute!");
                    return;
                }
                // Break pickaxe sequence!
                if (window.soundEngine) window.soundEngine.playPickaxeBreak();
                if (window.gamePlayer) window.gamePlayer.hasBrokenPickaxe = true;
                if (window.gameWorld && typeof window.gameWorld.revealChuteOpening === 'function') {
                    window.gameWorld.revealChuteOpening();
                }
                this.triggerScreenShake(1.2, 14);
                this.showNotification("CLANG! PICKAXE SHATTERED ON MONOLITHIC BEDROCK! A gaping fissure cracked open on the left wall ◄");
                const objEl = document.querySelector('.hud-top-value[style*="69f0ae"]');
                if (objEl) objEl.textContent = "CHUTE ◄";
                if (window.gameState) {
                    window.gameState.triggerMonologue("pickaxeBroken");
                }
                return;
            }
            if (this.currentRubble.requiresCrowbar && (!window.gamePlayer || !window.gamePlayer.hasCrowbar)) {
                this.showNotification("Granite boulders jammed tight! Need heavy crowbar from Upper Ledge crate!");
                return;
            }
            this.startRhythmMinigame(this.currentRubble);
        } else if (this.currentCorpse) {
            this.lootCorpse(this.currentCorpse);
        } else if (this.isNearRope && window.gamePlayer && window.gameWorld && window.gameWorld.rescueRope) {
            window.gamePlayer.startRopeClimb(window.gameWorld.rescueRope);
        } else if (this.isNearCrate && window.gameWorld && window.gameWorld.gearCrate) {
            window.gameWorld.retrieveCrowbar();
            if (window.gamePlayer) {
                window.gamePlayer.hasCrowbar = true;
                window.gamePlayer.oxygen = Math.min(100.0, window.gamePlayer.oxygen + 15.0);
            }
            this.isNearCrate = false;
            if (window.soundEngine) {
                window.soundEngine.playFootstep(true);
                window.soundEngine.playOxygenRefill();
            }
            this.showNotification("EQUIPPED: HEAVY CARBIDE CROWBAR (+15% O₂)! Found emergency respirator cartridge in gear crate!");
            if (window.gameState) window.gameState.triggerMonologue("crowbarRetrieved");
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
        this.needleSpeed = 50; // Smooth, relaxed rhythm oscillation

        // Runtuhan akhir pas mau keluar (Granite Barrier at z = -285) harus 3x hijau!
        this.hitsNeeded = (rubble.requiresCrowbar || rubble.id === 3) ? 3 : 1;
        this.hitsDone = 0;

        // Wide, generous 38% sweet spot area
        this.sweetSpotMin = 26 + Math.random() * 16;
        this.sweetSpotMax = this.sweetSpotMin + 38; // Generous green zone
        this.sweetSpotCenter = (this.sweetSpotMin + this.sweetSpotMax) / 2;

        const overlay = document.getElementById('rhythm-minigame-overlay');
        const titleEl = document.getElementById('rhythm-rubble-title');
        const sweetSpotEl = document.getElementById('rhythm-sweet-spot');
        const feedbackEl = document.getElementById('rhythm-feedback');

        if (titleEl) titleEl.textContent = rubble.name;
        if (feedbackEl) {
            feedbackEl.textContent = this.hitsNeeded > 1 
                ? "STRIKE INSIDE GREEN ZONE 3 TIMES TO PRY OPEN THE MASSIVE GRANITE BARRICADE!" 
                : "PRESS [SPACE] OR CLICK ANYWHERE INSIDE THE GREEN AREA!";
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
        if (this.hitsNeeded > 1) {
            const left = this.hitsNeeded - this.hitsDone;
            healthEl.textContent = `Massive granite barricade: Land 3 green strikes with crowbar (${left} strike${left > 1 ? 's' : ''} remaining)!`;
        } else {
            healthEl.textContent = "Fracture line exposed: Any strike in the green zone shatters the rock!";
        }
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

        // Generous Hit Detection: ANYWHERE inside the green zone (+5% edge padding)
        const tolerance = 5.0;
        const isInsideGreenZone = (this.needlePos >= (this.sweetSpotMin - tolerance) && this.needlePos <= (this.sweetSpotMax + tolerance));

        if (isInsideGreenZone) {
            if (window.soundEngine) window.soundEngine.playPickaxeHit(true);

            this.hitsDone++;
            this.triggerScreenShake(0.45, 12);
            const remaining = this.hitsNeeded - this.hitsDone;

            if (remaining > 0) {
                // Relocate sweet spot for next strike
                this.sweetSpotMin = 20 + Math.random() * 26;
                this.sweetSpotMax = this.sweetSpotMin + 36;
                this.sweetSpotCenter = (this.sweetSpotMin + this.sweetSpotMax) / 2;
                const sweetSpotEl = document.getElementById('rhythm-sweet-spot');
                if (sweetSpotEl) {
                    sweetSpotEl.style.left = `${this.sweetSpotMin}%`;
                    sweetSpotEl.style.width = `${this.sweetSpotMax - this.sweetSpotMin}%`;
                }

                if (feedbackEl) {
                    feedbackEl.textContent = `SOLID GREEN HIT! (${this.hitsDone}/3) — ${remaining} MORE GREEN STRIKE${remaining > 1 ? 'S' : ''}!`;
                    feedbackEl.className = "hit-perfect";
                }
                this.updateRhythmHealthDisplay();
            } else {
                // All required green hits completed!
                this.currentRubble.currentHealth = 0;
                this.updateRhythmHealthDisplay();

                const isGranite = (this.hitsNeeded > 1 || this.currentRubble.requiresCrowbar);
                if (feedbackEl) {
                    feedbackEl.textContent = isGranite 
                        ? "FINAL GREEN STRIKE! GRANITE SHATTERED! PATH CLEARED!" 
                        : "PERFECT STRIKE! BOULDERS SHATTERED! PATH CLEARED!";
                    feedbackEl.className = "hit-perfect";
                }

                try {
                    if (window.soundEngine && typeof window.soundEngine.playRockCollapse === 'function') {
                        window.soundEngine.playRockCollapse();
                    } else if (window.soundEngine && typeof window.soundEngine.playHeavyCaveInThud === 'function') {
                        window.soundEngine.playHeavyCaveInThud();
                    }
                } catch (e) {
                    console.warn("Audio error ignored:", e);
                }

                const rubbleId = this.currentRubble.id;
                if (window.gameWorld && typeof window.gameWorld.removeRubble === 'function') {
                    window.gameWorld.removeRubble(rubbleId);
                }

                setTimeout(() => {
                    this.showNotification(isGranite 
                        ? "Final granite barricade pried open! The surface hatch is ahead!" 
                        : "Cave-in rubble destroyed! Keep moving forward!");
                    this.closeRhythmMinigame();
                }, 350);
            }
        } else {
            // Missed outside green zone
            if (window.soundEngine) {
                window.soundEngine.playPickaxeHit(false);
                window.soundEngine.playEarthquake(1.2);
            }
            if (feedbackEl) {
                feedbackEl.textContent = "MISSED! PRESS [SPACE] OR CLICK WHEN NEEDLE IS IN GREEN AREA!";
                feedbackEl.className = "hit-miss";
            }

            if (window.gamePlayer) {
                window.gamePlayer.oxygen = Math.max(0, window.gamePlayer.oxygen - 2.0);
            }
            this.triggerScreenShake(0.35, 7);
        }
    }

    closeRhythmMinigame() {
        this.isRhythmActive = false;
        const overlay = document.getElementById('rhythm-minigame-overlay');
        if (overlay) overlay.style.display = 'none';

        if (window.gameState && window.gameState.state === 'MINIGAME') {
            window.gameState.state = 'PLAYING';
            if (window.gamePlayer && window.gamePlayer.domElement) {
                try {
                    const p = window.gamePlayer.domElement.requestPointerLock();
                    if (p && p.catch) p.catch(() => {});
                } catch (e) {}
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
        const glitchEl = document.getElementById('glitch-overlay');
        if (glitchEl) {
            glitchEl.classList.add('active');
            setTimeout(() => {
                glitchEl.classList.remove('active');
            }, 4200);
        }
        this.showNotification("WARNING: AFTERSHOCK TREMOR SHAKING SHAFT CEILING! ELECTRICAL SURGE GLITCHING!");
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
