/**
 * CANARY: The Collapse - Polaroid Photo & Emotional Anchor System
 * Directly renders Lily's procedural portrait to native HTML5 Canvases (Zero broken images).
 * Dynamic real-time hypoxia fading and inspection modal.
 */

class PolaroidSystem {
    constructor() {
        this.isInspecting = false;
        this.isFlipped = false;
        this.hudCanvas = null;
        this.inspectCanvas = null;
        this.init();
    }

    init() {
        // Will be called on DOM load
        window.addEventListener('DOMContentLoaded', () => {
            this.setupCanvases();
        });
    }

    setupCanvases() {
        this.hudCanvas = document.getElementById('polaroid-hud-canvas');
        this.inspectCanvas = document.getElementById('inspect-polaroid-canvas');

        if (this.hudCanvas) {
            this.drawPolaroidToCanvas(this.hudCanvas, 240, 280);
        }
        if (this.inspectCanvas) {
            this.drawPolaroidToCanvas(this.inspectCanvas, 340, 400);
        }
    }

    drawPolaroidToCanvas(canvas, w, h) {
        if (!canvas) return;
        const c = canvas.getContext('2d');
        canvas.width = w;
        canvas.height = h;

        // Paper frame background (aged photo paper)
        c.fillStyle = '#f5f2eb';
        c.fillRect(0, 0, w, h);

        // Dirty aged vignette border
        const paperGrad = c.createRadialGradient(w/2, h/2, w*0.25, w/2, h/2, w*0.7);
        paperGrad.addColorStop(0, 'rgba(0,0,0,0)');
        paperGrad.addColorStop(1, 'rgba(95, 75, 55, 0.28)');
        c.fillStyle = paperGrad;
        c.fillRect(0, 0, w, h);

        // Photo Square inside frame
        const margin = Math.round(w * 0.08);
        const px = margin;
        const py = margin;
        const pw = w - margin * 2;
        const ph = Math.round(h * 0.76);

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
        c.arc(px + pw * 0.28, py + ph * 0.72, pw * 0.35, Math.PI, 0, false);
        c.fill();
        c.beginPath();
        c.arc(px + pw * 0.75, py + ph * 0.68, pw * 0.42, Math.PI, 0, false);
        c.fill();

        // Warm sun
        c.fillStyle = 'rgba(255, 245, 180, 0.45)';
        c.beginPath();
        c.arc(px + pw * 0.2, py + ph * 0.2, pw * 0.14, 0, Math.PI * 2);
        c.fill();

        // Yellow wild canary flowers
        c.fillStyle = '#ffd700';
        for (let i = 0; i < 24; i++) {
            const fx = px + 10 + (i * 17) % (pw - 20);
            const fy = py + ph * 0.65 + (i * 13) % (ph * 0.3);
            c.beginPath();
            c.arc(fx, fy, 2.5, 0, Math.PI * 2);
            c.fill();
        }

        // Draw Lily (6 years old daughter)
        const lx = px + pw / 2;
        const ly = py + ph * 0.58;
        const scale = w / 340;

        // Pigtail hair
        c.fillStyle = '#5c3116';
        c.beginPath();
        c.arc(lx - 38 * scale, ly - 32 * scale, 20 * scale, 0, Math.PI * 2);
        c.arc(lx + 38 * scale, ly - 32 * scale, 20 * scale, 0, Math.PI * 2);
        c.fill();
        // Ribbons
        c.fillStyle = '#e53935';
        c.fillRect(lx - 42 * scale, ly - 35 * scale, 7 * scale, 6 * scale);
        c.fillRect(lx + 35 * scale, ly - 35 * scale, 7 * scale, 6 * scale);

        // Yellow dress
        c.fillStyle = '#ffca28';
        c.beginPath();
        c.moveTo(lx - 22 * scale, ly + 22 * scale);
        c.lineTo(lx + 22 * scale, ly + 22 * scale);
        c.lineTo(lx + 40 * scale, ly + 90 * scale);
        c.lineTo(lx - 40 * scale, ly + 90 * scale);
        c.closePath();
        c.fill();

        // White floral collar
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(lx, ly + 24 * scale, 12 * scale, 0, Math.PI);
        c.fill();

        // Bouquet of yellow canary flowers
        c.fillStyle = '#ffd54f';
        c.beginPath();
        c.arc(lx, ly + 46 * scale, 13 * scale, 0, Math.PI * 2);
        c.fill();

        // Arms holding flowers
        c.fillStyle = '#ffcfb3';
        c.beginPath();
        c.arc(lx - 20 * scale, ly + 48 * scale, 8 * scale, 0, Math.PI * 2);
        c.arc(lx + 20 * scale, ly + 48 * scale, 8 * scale, 0, Math.PI * 2);
        c.fill();

        // Head / Face
        c.fillStyle = '#ffcfb3';
        c.beginPath();
        c.arc(lx, ly - 10 * scale, 30 * scale, 0, Math.PI * 2);
        c.fill();

        // Bangs
        c.fillStyle = '#5c3116';
        c.beginPath();
        c.arc(lx, ly - 20 * scale, 31 * scale, Math.PI, 0, false);
        c.fill();

        // Big brown eyes
        c.fillStyle = '#3e2723';
        c.beginPath();
        c.arc(lx - 11 * scale, ly - 10 * scale, 5 * scale, 0, Math.PI * 2);
        c.arc(lx + 11 * scale, ly - 10 * scale, 5 * scale, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(lx - 13 * scale, ly - 12 * scale, 1.8 * scale, 0, Math.PI * 2);
        c.arc(lx + 9 * scale, ly - 12 * scale, 1.8 * scale, 0, Math.PI * 2);
        c.fill();

        // Rosy cheeks
        c.fillStyle = 'rgba(255, 110, 110, 0.45)';
        c.beginPath();
        c.arc(lx - 16 * scale, ly - 3 * scale, 6 * scale, 0, Math.PI * 2);
        c.arc(lx + 16 * scale, ly - 3 * scale, 6 * scale, 0, Math.PI * 2);
        c.fill();

        // Cheerful smile
        c.strokeStyle = '#b71c1c';
        c.lineWidth = 2 * scale;
        c.beginPath();
        c.arc(lx, ly - 3 * scale, 9 * scale, 0.2, Math.PI - 0.2, false);
        c.stroke();

        // Coal thumb smudge on bottom border
        c.fillStyle = 'rgba(30, 25, 20, 0.35)';
        c.beginPath();
        c.ellipse(px + 35 * scale, h - 25 * scale, 18 * scale, 14 * scale, 0.4, 0, Math.PI * 2);
        c.fill();

        // Handwritten caption
        c.font = `italic ${Math.round(13 * scale)}px "Brush Script MT", cursive, sans-serif`;
        c.fillStyle = '#222';
        c.fillText('Lily (Age 6) — Spring 1984', px + 25 * scale, h - 16 * scale);
    }

    // Dynamic HUD rendering based on Oxygen level
    updateHUD(oxygen) {
        if (!this.hudCanvas) {
            this.hudCanvas = document.getElementById('polaroid-hud-canvas');
            if (this.hudCanvas) this.setupCanvases();
        }

        const hudContainer = document.getElementById('polaroid-container');
        if (!hudContainer || !this.hudCanvas) return;

        const o2 = Math.max(0, Math.min(100, oxygen));

        if (o2 < 35) {
            // Critical Hypoxia: high grayscale, blur, tremble
            const blurPx = ((35 - o2) / 35 * 4.5).toFixed(1);
            const grayPct = (50 + (35 - o2) / 35 * 50).toFixed(0);
            const sepiaPct = ((35 - o2) / 35 * 60).toFixed(0);
            this.hudCanvas.style.filter = `grayscale(${grayPct}%) blur(${blurPx}px) sepia(${sepiaPct}%) contrast(1.4)`;
            hudContainer.classList.add('critical-fade');
        } else if (o2 < 65) {
            const grayPct = ((65 - o2) / 30 * 45).toFixed(0);
            this.hudCanvas.style.filter = `grayscale(${grayPct}%) contrast(1.1)`;
            hudContainer.classList.remove('critical-fade');
        } else {
            this.hudCanvas.style.filter = 'none';
            hudContainer.classList.remove('critical-fade');
        }
    }

    toggleInspect() {
        this.isInspecting = !this.isInspecting;
        this.isFlipped = false;
        const modal = document.getElementById('polaroid-inspect-modal');
        const flipCard = document.getElementById('polaroid-card-inner');

        if (!modal) return;

        if (this.isInspecting) {
            if (!this.inspectCanvas) this.setupCanvases();
            if (flipCard) flipCard.classList.remove('is-flipped');
            modal.classList.add('visible');
            if (window.soundEngine) window.soundEngine.playLilyWhisper();
            if (window.gameState) window.gameState.triggerPhotoComfort();
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
