/**
 * CANARY: The Collapse - Save & Expedition Progression System
 * Handles persistent player checkpoints, sector unlocks, miner lore collectibles, and best escape records.
 */

class SaveSystem {
    constructor() {
        this.STORAGE_KEY = 'canary_survival_save_v1';
        this.data = this.loadData();
    }

    getDefaultData() {
        return {
            unlockedSector: 1, // 1: Collapsed Vein, 2: Abyssal Chute & Grotto, 3: The Ascent & Surface
            lastCheckpoint: null, // { sector: 1, x: 0, y: 0.8, z: 0, oxygen: 100, depth: 780 }
            bestEscapeTime: null, // in seconds
            badgesCollected: [], // ['miner_koval', 'miner_elena', 'miner_chen', 'miner_marcus']
            totalAttempts: 0,
            totalEscapes: 0
        };
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                return Object.assign(this.getDefaultData(), parsed);
            }
        } catch (e) {
            console.warn('Could not read localStorage:', e);
        }
        return this.getDefaultData();
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not write to localStorage:', e);
        }
    }

    recordAttempt() {
        this.data.totalAttempts++;
        this.save();
    }

    saveCheckpoint(sector, position, oxygen, depth) {
        this.data.lastCheckpoint = {
            sector: sector,
            x: position.x,
            y: position.y,
            z: position.z,
            oxygen: Math.max(35, oxygen), // Give player a fighting chance on reload
            depth: depth
        };
        if (sector > this.data.unlockedSector) {
            this.data.unlockedSector = sector;
        }
        this.save();
    }

    unlockSector(sector) {
        if (sector > this.data.unlockedSector) {
            this.data.unlockedSector = sector;
            this.save();
        }
    }

    collectBadge(badgeId) {
        if (!this.data.badgesCollected.includes(badgeId)) {
            this.data.badgesCollected.push(badgeId);
            this.save();
            return true;
        }
        return false;
    }

    recordVictory(elapsedSeconds) {
        this.data.totalEscapes++;
        if (this.data.bestEscapeTime === null || elapsedSeconds < this.data.bestEscapeTime) {
            this.data.bestEscapeTime = Math.round(elapsedSeconds);
        }
        this.data.lastCheckpoint = null; // Clear active run checkpoint upon winning
        this.save();
    }

    hasCheckpoint() {
        return !!this.data.lastCheckpoint;
    }

    clearCheckpoint() {
        this.data.lastCheckpoint = null;
        this.save();
    }
}

// Global singleton instance
window.saveSystem = new SaveSystem();
