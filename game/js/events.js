/**
 * CANARY: The Collapse - Dynamic Event Manager
 * Coordinates interactive world objects across all 3 stages:
 * - Pickaxe rhythm mini-game & first-person 3D strike swings.
 * - Derailed minecart pushing interaction.
 * - Fallen miner ID badges & lore collectibles with O2 refills.
 * - Manual 24m rope climbing trigger.
 * - Escape Hatch B-4 breach and victory sequence.
 */

class EventManager {
    constructor() {
        this.currentRubble = null;
        this.currentCorpse = null;
        this.isNearCart = false;
        this.isNearRope = false;
        this.isNearHatch = false;

        // Rhythm Pickaxe Mini-Game State
        this.isRhythmActive = false;
        this.needlePos = 10;
        this.needleSpeed = 55;
        this.needleDir = 1;
        this.sweetSpotMin = 32;
        this.sweetSpotMax = 68; // Generous 36% sweet spot
        this.hitsDone = 0;
        this.hitsNeeded = 3;

        this.isNoteModalOpen = false;

        this.initListeners();
    }

    initListeners() {
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

        const strikeBtn = document.getElementById('btn-strike-pickaxe');
        if (strikeBtn) {
            strikeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.isRhythmActive) this.strikePickaxe();
            });
        }
    }

    checkInteractions(player, world) {
        if (!player || !world || this.isRhythmActive || this.isNoteModalOpen) return;

        const pPos = player.position;
        const promptEl = document.getElementById('interaction-prompt');
        let promptText = '';

        // 1. Check Rubbles in Stage 1
        let foundRubble = null;
        if (world.rubbles) {
            world.rubbles.forEach(r => {
                if (!r.cleared) {
                    const dist = pPos.distanceTo(r.position);
                    if (dist < 3.8) {
                        foundRubble = r;
                    }
                }
            });
        }

        if (foundRubble) {
            this.currentRubble = foundRubble;
            promptText = `[E] BREACH ROCK BARRIER WITH PICKAXE (${foundRubble.hitsRemaining} STRIKE${foundRubble.hitsRemaining > 1 ? 'S' : ''} NEEDED)`;
        } else {
            this.currentRubble = null;
        }

        // 2. Check Derailed Minecart (z = -145)
        if (!foundRubble && world.mineCart && !world.mineCart.isPushed) {
            const dist = pPos.distanceTo(world.mineCart.position);
            if (dist < 3.6) {
                this.isNearCart = true;
                promptText = "[E] PUSH DERAILED MINECART OUT OF THE TRACK";
            } else {
                this.isNearCart = false;
            }
        } else {
            this.isNearCart = false;
        }

        // 3. Check Fallen Miner Corpses
        let foundCorpse = null;
        if (!foundRubble && !this.isNearCart && world.corpses) {
            world.corpses.forEach(c => {
                if (c && !c.looted) {
                    const dist = pPos.distanceTo(c.position);
                    if (dist < 3.2) {
                        foundCorpse = c;
                    }
                }
            });

            if (foundCorpse) {
                this.currentCorpse = foundCorpse;
                promptText = `[E] SEARCH FALLEN MINER (${foundCorpse.name})`;
            } else {
                this.currentCorpse = null;
            }
        }

        // 4. Check Rescue Rope at z = -625
        if (!foundRubble && !this.isNearCart && !foundCorpse && world.rescueRope && !player.hasClimbedRope) {
            const dist = Math.hypot(pPos.x - world.rescueRope.position.x, pPos.z - world.rescueRope.position.z);
            if (dist < 4.5 && pPos.y < 0) {
                this.isNearRope = true;
                promptText = "[E] CLIMB RESCUE ROPE (24 METERS VERTICAL ASCENT)";
            } else {
                this.isNearRope = false;
            }
        } else {
            this.isNearRope = false;
        }

        // 5. Check Escape Hatch B-4 at z = -865
        if (!foundRubble && !this.isNearCart && !foundCorpse && !this.isNearRope && world.escapeHatch) {
            const dist = pPos.distanceTo(world.escapeHatch.position);
            if (dist < 5.0) {
                this.isNearHatch = true;
                promptText = "[E] HEAVE OPEN EMERGENCY HATCH B-4 (ESCAPE TO MORNING SUNLIGHT)";
            } else {
                this.isNearHatch = false;
            }
        } else {
            this.isNearHatch = false;
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
        } else if (this.isNearCart && window.gameWorld && window.gameWorld.stage1) {
            this.pushCart();
        } else if (this.currentCorpse) {
            this.lootCorpse(this.currentCorpse);
        } else if (this.isNearRope && window.gamePlayer && window.gameWorld && window.gameWorld.rescueRope) {
            window.gamePlayer.startRopeClimb(window.gameWorld.rescueRope);
        } else if (this.isNearHatch && window.gameWorld && window.gameWorld.escapeHatch) {
            this.triggerEscapeSequence();
        }
    }

    pushCart() {
        if (window.soundEngine && window.soundEngine.playFootstep) {
            window.soundEngine.playFootstep(true);
        }
        const cartPushed = window.gameWorld.stage1.pushMineCart(1.0);
        if (cartPushed) {
            this.showNotification("HEAVED DERAILED CART ASIDE! TRACK CLEARED!");
            if (window.saveSystem) {
                window.saveSystem.saveCheckpoint(1, window.gamePlayer.position, window.gamePlayer.oxygen, window.gamePlayer.depth);
            }
        }
    }

    lootCorpse(corpse) {
        corpse.looted = true;
        if (corpse.beacon) corpse.beacon.visible = false;

        // Collect badge into persistent save
        if (window.saveSystem) {
            window.saveSystem.collectBadge(corpse.id);
        }

        // Restore Oxygen
        if (window.gamePlayer) {
            window.gamePlayer.oxygen = Math.min(100, window.gamePlayer.oxygen + corpse.oxygenBonus);
        }
        if (window.soundEngine && window.soundEngine.playOxygenRefill) {
            window.soundEngine.playOxygenRefill();
        }

        // Open Lore Note Modal
        this.isNoteModalOpen = true;
        const nameEl = document.getElementById('note-miner-name');
        const bodyEl = document.getElementById('note-miner-body');
        const modal = document.getElementById('story-note-modal');

        if (nameEl) nameEl.textContent = corpse.name;
        if (bodyEl) {
            bodyEl.innerHTML = `<p>${corpse.note.replace(/\n\n/g, '</p><p style="margin-top:10px;">')}</p>
            <p style="margin-top:14px; color:#69f0ae; font-weight:bold;">+${corpse.oxygenBonus}% OXYGEN SECURED FROM RESPIRATOR TANK!</p>`;
        }
        if (modal) modal.style.display = 'flex';
        document.exitPointerLock();
    }

    closeNoteModal() {
        this.isNoteModalOpen = false;
        const modal = document.getElementById('story-note-modal');
        if (modal) modal.style.display = 'none';
        if (window.gamePlayer && window.gamePlayer.domElement) {
            window.gamePlayer.domElement.requestPointerLock();
        }
    }

    startRhythmMinigame(rubble) {
        this.isRhythmActive = true;
        this.currentRubble = rubble;
        this.needlePos = 8;
        this.needleDir = 1;
        this.hitsDone = 0;
        this.hitsNeeded = rubble.hitsRemaining || 3;

        const overlay = document.getElementById('rhythm-minigame-overlay');
        const titleEl = document.getElementById('rhythm-rubble-title');
        const spotEl = document.getElementById('rhythm-sweet-spot');
        const feedbackEl = document.getElementById('rhythm-feedback');

        if (titleEl) titleEl.textContent = rubble.name || "Collapsed Rubble";
        if (spotEl) {
            spotEl.style.left = `${this.sweetSpotMin}%`;
            spotEl.style.width = `${this.sweetSpotMax - this.sweetSpotMin}%`;
        }
        if (feedbackEl) {
            feedbackEl.textContent = `STRIKE TIMING IN GREEN ZONE (${this.hitsNeeded - this.hitsDone} HITS REMAINING)!`;
            feedbackEl.style.color = '#fff';
        }
        if (overlay) overlay.style.display = 'flex';
        document.exitPointerLock();
    }

    strikePickaxe() {
        if (!this.isRhythmActive) return;

        const isHit = (this.needlePos >= this.sweetSpotMin && this.needlePos <= this.sweetSpotMax);

        // First-person 3D pickaxe swing animation
        if (window.pickaxeSystem) {
            window.pickaxeSystem.swing(() => {
                if (isHit) {
                    this.hitsDone++;
                    const feedbackEl = document.getElementById('rhythm-feedback');
                    if (feedbackEl) {
                        feedbackEl.textContent = `CRITICAL FRACTURE! (${this.hitsNeeded - this.hitsDone} HITS LEFT)`;
                        feedbackEl.style.color = '#69f0ae';
                    }

                    if (this.hitsDone >= this.hitsNeeded) {
                        this.breachRubbleSuccess();
                    }
                } else {
                    const feedbackEl = document.getElementById('rhythm-feedback');
                    if (feedbackEl) {
                        feedbackEl.textContent = "GLANCING BLOW! TIMING MISSED!";
                        feedbackEl.style.color = '#ff1744';
                    }
                    if (window.soundEngine && window.soundEngine.playPickaxeClang) {
                        window.soundEngine.playPickaxeClang(false);
                    }
                }
            });
        } else {
            if (isHit) {
                this.hitsDone++;
                if (this.hitsDone >= this.hitsNeeded) this.breachRubbleSuccess();
            }
        }
    }

    breachRubbleSuccess() {
        this.closeRhythmMinigame();

        if (this.currentRubble && window.gameWorld) {
            window.gameWorld.removeRubble(this.currentRubble.id);
            this.showNotification("RUBBLE SHATTERED! PATH FORWARD CLEARED!");

            // Save checkpoint
            if (window.saveSystem && window.gamePlayer) {
                window.saveSystem.saveCheckpoint(1, window.gamePlayer.position, window.gamePlayer.oxygen, window.gamePlayer.depth);
            }
        }
    }

    closeRhythmMinigame() {
        this.isRhythmActive = false;
        const overlay = document.getElementById('rhythm-minigame-overlay');
        if (overlay) overlay.style.display = 'none';
        if (window.gamePlayer && window.gamePlayer.domElement) {
            window.gamePlayer.domElement.requestPointerLock();
        }
    }

    triggerEscapeSequence() {
        if (window.gameState) {
            window.gameState.triggerVictory();
        }
    }

    showNotification(msg) {
        const notif = document.getElementById('notification-banner');
        if (notif) {
            notif.textContent = msg;
            notif.style.display = 'block';
            notif.style.opacity = '1';
            clearTimeout(this.notifTimeout);
            this.notifTimeout = setTimeout(() => {
                notif.style.opacity = '0';
                setTimeout(() => notif.style.display = 'none', 500);
            }, 3500);
        }
    }

    update(delta) {
        if (this.isRhythmActive) {
            this.needlePos += this.needleSpeed * delta * this.needleDir;
            if (this.needlePos >= 96) {
                this.needlePos = 96;
                this.needleDir = -1;
            } else if (this.needlePos <= 4) {
                this.needlePos = 4;
                this.needleDir = 1;
            }

            const needleEl = document.getElementById('rhythm-needle');
            if (needleEl) needleEl.style.left = `${this.needlePos}%`;
        }
    }
}

window.EventManager = EventManager;
