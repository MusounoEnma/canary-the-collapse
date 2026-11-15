/**
 * CANARY: The Collapse - Polaroid Photo & Emotional Anchor System
 * Procedurally draws Lily's polaroid with real-time hypoxia fading and inspection modal.
 * Standardized in full English.
 */

class PolaroidSystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.hudImageElement = null;
        this.isInspecting = false;
        this.isFlipped = false;
        this.init();
    }

    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 480;
        this.ctx = this.canvas.getContext('2d');
        this.generatePolaroidBase();
    }

    generatePolaroidBase() {
        const c = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Polaroid Frame (aged white paper with dirty edges)
        c.fillStyle = '#f2efe9';
        c.fillRect(0, 0, w, h);

        // Dirty aged vignette border on paper
        const paperGrad = c.createRadialGradient(w/2, h/2, 100, w/2, h/2, 260);
        paperGrad.addColorStop(0, 'rgba(0,0,0,0)');
        paperGrad.addColorStop(1, 'rgba(90, 75, 55, 0.28)');
        c.fillStyle = paperGrad;
        c.fillRect(0, 0, w, h);

        // Photo Square (340 x 340) with margin 30px
        const px = 30, py = 30, pw = 340, ph = 340;
        
        // Sunny meadow background
        const skyGrad = c.createLinearGradient(px, py, px, py + ph);
        skyGrad.addColorStop(0, '#5cb8ff');
        skyGrad.addColorStop(0.55, '#c5ebfe');
        skyGrad.addColorStop(0.6, '#86d956');
        skyGrad.addColorStop(1, '#3b9125');
        c.fillStyle = skyGrad;
        c.fillRect(px, py, pw, ph);

        // Distant hills
        c.fillStyle = '#6ab840';
        c.beginPath();
        c.arc(px + 90, py + 240, 110, Math.PI, 0, false);
        c.fill();
        c.beginPath();
        c.arc(px + 260, py + 230, 140, Math.PI, 0, false);
        c.fill();

        // Warm sun rays
        c.fillStyle = 'rgba(255, 245, 180, 0.4)';
        c.beginPath();
        c.arc(px + 60, py + 60, 45, 0, Math.PI * 2);
        c.fill();

        // Yellow wild canary flowers in meadow
        for (let i = 0; i < 35; i++) {
            const fx = px + 15 + Math.random() * (pw - 30);
            const fy = py + 215 + Math.random() * 110;
            c.fillStyle = '#ffd700';
            c.beginPath();
            c.arc(fx, fy, 3 + Math.random() * 3, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#fff';
            c.beginPath();
            c.arc(fx, fy, 1.5, 0, Math.PI * 2);
            c.fill();
        }

        // Draw Lily (6 years old daughter)
        const lx = px + pw / 2;
        const ly = py + 195;

        // Pigtail hair
        c.fillStyle = '#5c3116';
        c.beginPath();
        c.arc(lx - 42, ly - 35, 22, 0, Math.PI * 2);
        c.arc(lx + 42, ly - 35, 22, 0, Math.PI * 2);
        c.fill();
        // Red hair ribbons
        c.fillStyle = '#e53935';
        c.fillRect(lx - 46, ly - 38, 8, 7);
        c.fillRect(lx + 38, ly - 38, 8, 7);

        // Yellow summer dress
        c.fillStyle = '#ffca28';
        c.beginPath();
        c.moveTo(lx - 25, ly + 25);
        c.lineTo(lx + 25, ly + 25);
        c.lineTo(lx + 45, ly + 105);
        c.lineTo(lx - 45, ly + 105);
        c.closePath();
        c.fill();

        // White floral lace collar
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(lx, ly + 28, 14, 0, Math.PI);
        c.fill();

        // Arms holding small bouquet of yellow canaries
        c.fillStyle = '#ffcfb3';
        c.beginPath();
        c.arc(lx - 22, ly + 55, 9, 0, Math.PI * 2);
        c.arc(lx + 22, ly + 55, 9, 0, Math.PI * 2);
        c.fill();

        // Little yellow flowers bouquet in hands
        c.fillStyle = '#ffd54f';
        c.beginPath();
        c.arc(lx, ly + 52, 14, 0, Math.PI * 2);
        c.fill();

        // Neck
        c.fillStyle = '#ffc0a0';
        c.fillRect(lx - 8, ly + 12, 16, 16);

        // Head / Face
        c.fillStyle = '#ffcfb3';
        c.beginPath();
        c.arc(lx, ly - 10, 34, 0, Math.PI * 2);
        c.fill();

        // Front Hair Bangs
        c.fillStyle = '#5c3116';
        c.beginPath();
        c.arc(lx, ly - 22, 35, Math.PI, 0, false);
        c.fill();
        c.beginPath();
        c.moveTo(lx - 30, ly - 20);
        c.quadraticCurveTo(lx - 10, ly - 6, lx, ly - 20);
        c.quadraticCurveTo(lx + 15, ly - 4, lx + 30, ly - 20);
        c.fill();

        // Eyes
        c.fillStyle = '#3e2723';
        c.beginPath();
        c.arc(lx - 12, ly - 10, 5.5, 0, Math.PI * 2);
        c.arc(lx + 12, ly - 10, 5.5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(lx - 14, ly - 12, 2, 0, Math.PI * 2);
        c.arc(lx + 10, ly - 12, 2, 0, Math.PI * 2);
        c.fill();

        // Rosy cheeks
        c.fillStyle = 'rgba(255, 110, 110, 0.45)';
        c.beginPath();
        c.arc(lx - 18, ly - 2, 7, 0, Math.PI * 2);
        c.arc(lx + 18, ly - 2, 7, 0, Math.PI * 2);
        c.fill();

        // Loving cheerful smile
        c.strokeStyle = '#b71c1c';
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(lx, ly - 3, 11, 0.2, Math.PI - 0.2, false);
        c.stroke();

        // Coal dust thumb smudges
        c.fillStyle = 'rgba(30, 25, 20, 0.35)';
        c.beginPath();
        c.ellipse(px + 45, h - 45, 24, 18, 0.4, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(w - 55, h - 40, 28, 20, -0.3, 0, Math.PI * 2);
        c.fill();

        // Handwritten caption in ink on white border (English)
        c.font = 'italic 16px "Brush Script MT", cursive, sans-serif';
        c.fillStyle = '#222';
        c.fillText('Lily (Age 6) — Spring 1984', px + 40, h - 40);
    }

    // Dynamic HUD rendering based on Oxygen level
    updateHUD(oxygen) {
        const hudImg = document.getElementById('polaroid-hud-img');
        const hudContainer = document.getElementById('polaroid-container');
        if (!hudImg || !hudContainer) return;

        const o2 = Math.max(0, Math.min(100, oxygen));

        if (o2 < 35) {
            // Critical Hypoxia: high grayscale, blur, vibration
            const blurPx = ((35 - o2) / 35 * 4.5).toFixed(1);
            const grayPct = (50 + (35 - o2) / 35 * 50).toFixed(0);
            const sepiaPct = ((35 - o2) / 35 * 60).toFixed(0);
            hudImg.style.filter = `grayscale(${grayPct}%) blur(${blurPx}px) sepia(${sepiaPct}%) contrast(1.4)`;
            hudContainer.classList.add('critical-fade');
        } else if (o2 < 65) {
            const grayPct = ((65 - o2) / 30 * 45).toFixed(0);
            hudImg.style.filter = `grayscale(${grayPct}%) contrast(1.1)`;
            hudContainer.classList.remove('critical-fade');
        } else {
            hudImg.style.filter = 'none';
            hudContainer.classList.remove('critical-fade');
        }

        if (!hudImg.src || hudImg.src === '') {
            hudImg.src = this.canvas.toDataURL('image/jpeg', 0.85);
        }
    }

    // Toggle full inspect mode [T]
    toggleInspect() {
        this.isInspecting = !this.isInspecting;
        this.isFlipped = false;
        const modal = document.getElementById('polaroid-inspect-modal');
        const modalImg = document.getElementById('inspect-polaroid-img');
        const flipCard = document.getElementById('polaroid-card-inner');

        if (!modal) return;

        if (this.isInspecting) {
            if (modalImg) {
                modalImg.src = this.canvas.toDataURL('image/jpeg', 0.95);
            }
            if (flipCard) {
                flipCard.classList.remove('is-flipped');
            }
            modal.classList.add('visible');
            if (window.soundEngine) {
                window.soundEngine.playLilyWhisper();
            }
            if (window.gameState) {
                window.gameState.triggerPhotoComfort();
            }
        } else {
            modal.classList.remove('visible');
        }
    }

    flipPhoto() {
        if (!this.isInspecting) return;
        this.isFlipped = !this.isFlipped;
        const flipCard = document.getElementById('polaroid-card-inner');
        if (flipCard) {
            flipCard.classList.toggle('is-flipped', this.isFlipped);
        }
    }
}

window.polaroidSystem = new PolaroidSystem();
