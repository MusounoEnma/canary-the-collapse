/**
 * CANARY: The Collapse - Narrative Events & Environmental Interaction Manager
 * Coordinates real-time 3D first-person mining strikes, minecart pushing, fallen miner looting,
 * vertical rope ascents, and emergency escape hatch operations.
 */

class EventManager {
    constructor() {
        this.isRhythmActive = false; // Kept for backward compatibility
        this.currentRubble = null;
        this.currentCorpse = null;
        this.isNearCart = false;
        this.isNearRope = false;
        this.isNearHatch = false;
        this.isNoteModalOpen = false;

        this.notifTimeout = null;
    }

    checkInteractions(player, world) {
        if (!player || !world || this.isNoteModalOpen) return;

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
            this.showMiningHUD(foundRubble);
            if (window.pickaxeSystem) {
                window.pickaxeSystem.setVisible(true);
            }
            promptText = `[CLICK / SPACE / E] BREACH ROCK BARRIER (${foundRubble.hitsRemaining} HIT${foundRubble.hitsRemaining > 1 ? 'S' : ''} REMAINING)`;
        } else {
            if (this.currentRubble) {
                this.hideMiningHUD();
            }
            if (window.pickaxeSystem && !window.pickaxeSystem.isSwinging) {
                window.pickaxeSystem.setVisible(false);
            }
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
            this.strikePickaxe();
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

    strikePickaxe() {
        if (window.pickaxeSystem && window.pickaxeSystem.isSwinging) return;

        if (this.currentRubble && !this.currentRubble.cleared) {
            const rubble = this.currentRubble;
            if (window.pickaxeSystem) {
                window.pickaxeSystem.swing(() => {
                    rubble.hitsRemaining = Math.max(0, (rubble.hitsRemaining || 3) - 1);

                    // 1. Shake rubble group violently
                    if (rubble.group) {
                        const origX = rubble.position.x;
                        rubble.group.position.x = origX + (Math.random() - 0.5) * 0.25;
                        setTimeout(() => {
                            if (rubble && rubble.group) rubble.group.position.x = origX;
                        }, 80);
                    }

                    // 2. Break off boulder meshes from rubble pile
                    if (rubble.meshes && rubble.meshes.length > 0) {
                        const toDrop = Math.ceil(rubble.meshes.length / (rubble.hitsRemaining + 1));
                        for (let k = 0; k < toDrop && rubble.meshes.length > 0; k++) {
                            const dropped = rubble.meshes.pop();
                            if (dropped) {
                                rubble.group.remove(dropped);
                                if (window.pickaxeSystem) {
                                    window.pickaxeSystem.spawnRockShatterDebris(
                                        new THREE.Vector3().copy(rubble.position).add(dropped.position),
                                        0x353a40
                                    );
                                }
                            }
                        }
                    }

                    // 3. Update HUD
                    this.updateMiningHUD(rubble);

                    // 4. Check if shattered
                    if (rubble.hitsRemaining <= 0) {
                        this.breachRubbleSuccess(rubble);
                    }
                });
            }
        } else {
            // Free air swing with whoosh
            if (window.pickaxeSystem) {
                window.pickaxeSystem.swing();
            }
        }
    }

    breachRubbleSuccess(rubble) {
        rubble.cleared = true;
        if (rubble.group) {
            if (rubble.meshes) {
                rubble.meshes.forEach(m => {
                    rubble.group.remove(m);
                    if (window.pickaxeSystem) {
                        window.pickaxeSystem.spawnRockShatterDebris(
                            new THREE.Vector3().copy(rubble.position).add(m.position),
                            0x353a40
                        );
                    }
                });
                rubble.meshes = [];
            }
            rubble.group.visible = false;
        }

        if (window.soundEngine && window.soundEngine.playTremorRumble) {
            window.soundEngine.playTremorRumble();
        }

        this.hideMiningHUD();
        if (window.pickaxeSystem) {
            window.pickaxeSystem.setVisible(false);
        }
        this.currentRubble = null;
        this.showNotification("★ GRANITE BARRIER SHATTERED! PASSAGEWAY CLEARED!");

        if (window.saveSystem && window.gamePlayer) {
            window.saveSystem.saveCheckpoint(1, window.gamePlayer.position, window.gamePlayer.oxygen, window.gamePlayer.depth);
        }
    }

    showMiningHUD(rubble) {
        const hud = document.getElementById('mining-hud');
        const title = document.getElementById('mining-rubble-title');
        if (title) title.textContent = rubble.name || "GRANITE BARRIER";
        if (hud) hud.style.display = 'flex';
        this.updateMiningHUD(rubble);
    }

    updateMiningHUD(rubble) {
        const p1 = document.getElementById('mining-pip-1');
        const p2 = document.getElementById('mining-pip-2');
        const p3 = document.getElementById('mining-pip-3');
        const status = document.getElementById('mining-status');
        const left = rubble.hitsRemaining !== undefined ? rubble.hitsRemaining : 3;

        if (p1) p1.className = left >= 1 ? 'mining-pip active' : 'mining-pip shattered';
        if (p2) p2.className = left >= 2 ? 'mining-pip active' : 'mining-pip shattered';
        if (p3) p3.className = left >= 3 ? 'mining-pip active' : 'mining-pip shattered';

        if (status) {
            if (left === 3) status.textContent = "[CLICK / SPACE / E] SWING PICKAXE (3 HITS TO SHATTER)";
            else if (left === 2) status.textContent = "CRACKED! (2 HITS REMAINING)";
            else if (left === 1) status.textContent = "CRITICAL FRACTURE! (1 HIT REMAINING)";
            else status.textContent = "SHATTERED!";
        }
    }

    hideMiningHUD() {
        const hud = document.getElementById('mining-hud');
        if (hud) hud.style.display = 'none';
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
        // Event manager tick
    }
}

window.EventManager = EventManager;
