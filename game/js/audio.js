/**
 * CANARY: The Collapse - Procedural Web Audio Engine
 * 100% synthesized audio using Web Audio API without external audio files.
 * Enhanced with water puddle splashes, underwater swimming strokes, and rope climbing creaks.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.tinnitusOsc = null;
        this.tinnitusGain = null;
        this.breathingTimer = null;
        this.isBreathingIn = true;
        this.heartbeatTimer = null;
        this.heartbeatBpm = 65;
        this.isHeartbeatRunning = false;
        this.ambienceGain = null;
        this.isUnderwater = false;
        this.underwaterFilter = null;
        this.isInitialized = false;
        this.isMuted = false;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    init() {
        if (this.isInitialized) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.85;

        // Lowpass master filter for underwater stage
        this.underwaterFilter = this.ctx.createBiquadFilter();
        this.underwaterFilter.type = 'lowpass';
        this.underwaterFilter.frequency.setValueAtTime(22000, this.ctx.currentTime);

        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        this.masterGain.connect(this.underwaterFilter);
        this.underwaterFilter.connect(compressor);
        compressor.connect(this.ctx.destination);

        // Continuous Tinnitus Node
        this.tinnitusOsc = this.ctx.createOscillator();
        this.tinnitusOsc.type = 'sine';
        this.tinnitusOsc.frequency.setValueAtTime(4100, this.ctx.currentTime);
        this.tinnitusGain = this.ctx.createGain();
        this.tinnitusGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
        this.tinnitusOsc.connect(this.tinnitusGain);
        this.tinnitusGain.connect(this.masterGain);
        this.tinnitusOsc.start();

        this.initAmbience();
        this.startHeartbeatLoop();
        this.startBreathingLoop();

        this.isInitialized = true;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setUnderwater(active) {
        if (!this.underwaterFilter || !this.ctx) return;
        this.isUnderwater = active;
        const targetFreq = active ? 400 : 22000;
        this.underwaterFilter.frequency.cancelScheduledValues(this.ctx.currentTime);
        this.underwaterFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.45);
    }

    initAmbience() {
        if (!this.ctx) return;
        const droneGain = this.ctx.createGain();
        droneGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(46, this.ctx.currentTime);
        osc2.frequency.setValueAtTime(49.5, this.ctx.currentTime);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(130, this.ctx.currentTime);
        filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(droneGain);
        droneGain.connect(this.masterGain);

        osc1.start();
        osc2.start();
        this.ambienceGain = droneGain;
    }

    playFootstep(isSprinting = false) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = isSprinting ? 0.08 : 0.12;

        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isSprinting ? 650 + Math.random() * 200 : 450 + Math.random() * 150, now);
        filter.Q.setValueAtTime(2.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isSprinting ? 0.22 : 0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
    }

    playWaterSplash(isSprinting = false) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = isSprinting ? 0.35 : 0.45;

        // 1. Water displacement spray
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.exponentialRampToValueAtTime(280, now + dur);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isSprinting ? 0.42 : 0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);

        // 2. Heavy Submerged Plunge Body Thud
        const osc = this.ctx.createOscillator();
        const oGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.38);
        oGain.gain.setValueAtTime(0.55, now);
        oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(oGain);
        oGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.39);
    }

    // Underwater Swimming Arm Stroke
    playWaterStroke() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = 0.42;

        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.sin((i / bufSize) * Math.PI);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(260, now);
        filter.frequency.linearRampToValueAtTime(520, now + 0.15);
        filter.frequency.linearRampToValueAtTime(180, now + dur);
        filter.Q.setValueAtTime(3.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
    }

    // Heavy Rescue Rope Creak / Grip
    playRopeCreak() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Friction noise
        const bufSize = Math.floor(this.ctx.sampleRate * 0.28);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.5));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(850, now);
        f.frequency.exponentialRampToValueAtTime(420, now + 0.25);
        f.Q.setValueAtTime(4.0, now);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        noise.connect(f);
        f.connect(g);
        g.connect(this.masterGain);
        noise.start(now);

        // Low rope tension creak
        const osc = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.24);
        og.gain.setValueAtTime(0.18, now);
        og.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(og);
        og.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.26);
    }

    // Dramatic Rope Slip / Loss of Grip screech, abrasive burn, and sudden tension snap
    playRopeSlip() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. Harsh abrasive sliding friction noise (hemp burning through gloves)
        const bufSize = Math.floor(this.ctx.sampleRate * 0.48);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.8));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(1400, now);
        f.frequency.exponentialRampToValueAtTime(320, now + 0.44);
        f.Q.setValueAtTime(3.5, now);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.48, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

        noise.connect(f);
        f.connect(g);
        g.connect(this.masterGain);
        noise.start(now);

        // 2. Heavy tension rope snap / arrest twang
        const osc = this.ctx.createOscillator();
        const og = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now + 0.22);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.32);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.52);

        og.gain.setValueAtTime(0.001, now);
        og.gain.setValueAtTime(0.38, now + 0.25);
        og.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

        osc.connect(og);
        og.connect(this.masterGain);
        osc.start(now + 0.22);
        osc.stop(now + 0.55);
    }

    startBreathingLoop() {
        const breathe = () => {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const isHypoxic = window.gameState && window.gameState.oxygen < 35;
            const breathDuration = isHypoxic ? 1.0 : (window.gameState && window.gameState.isSprinting ? 1.2 : 2.1);
            
            const bufferSize = Math.floor(this.ctx.sampleRate * breathDuration);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1);
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            const gain = this.ctx.createGain();

            if (this.isBreathingIn) {
                filter.frequency.setValueAtTime(450, now);
                filter.frequency.linearRampToValueAtTime(800, now + breathDuration * 0.7);
                filter.Q.setValueAtTime(3.5, now);

                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(isHypoxic ? 0.22 : 0.12, now + breathDuration * 0.4);
                gain.gain.exponentialRampToValueAtTime(0.005, now + breathDuration);
            } else {
                filter.frequency.setValueAtTime(650, now);
                filter.frequency.linearRampToValueAtTime(300, now + breathDuration * 0.8);
                filter.Q.setValueAtTime(2.2, now);

                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(isHypoxic ? 0.26 : 0.15, now + breathDuration * 0.3);
                gain.gain.exponentialRampToValueAtTime(0.005, now + breathDuration);
            }

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            noise.start(now);

            this.isBreathingIn = !this.isBreathingIn;
            this.breathingTimer = setTimeout(breathe, (breathDuration + 0.3) * 1000);
        };

        breathe();
    }

    startHeartbeatLoop() {
        const pulse = () => {
            if (!this.ctx) return;
            const player = window.gamePlayer;
            const o2 = player ? player.oxygen : 100;
            const stress = player ? player.stress : 0;
            const targetBpm = player ? player.heartbeatBpm : Math.floor(65 + (100 - o2) * 0.95);
            this.heartbeatBpm = Math.min(180, Math.max(60, targetBpm));

            const intensity = (stress > 65 || o2 < 35) ? 0.55 : ((stress > 35 || o2 < 60) ? 0.35 : 0.15);
            this.triggerHeartbeat(intensity);

            const intervalMs = (60 / this.heartbeatBpm) * 1000;
            this.heartbeatTimer = setTimeout(pulse, intervalMs);
        };

        pulse();
    }

    triggerHeartbeat(volume = 0.2) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(75, now);
        osc1.frequency.exponentialRampToValueAtTime(32, now + 0.14);

        gain1.gain.setValueAtTime(volume * 1.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.16);

        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(65, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(28, now + 0.26);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.setValueAtTime(volume * 0.9, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.3);
    }

    playPickaxeHit(isPerfect = true) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        if (isPerfect) {
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1450, now);
            osc.frequency.exponentialRampToValueAtTime(950, now + 0.4);

            oscGain.gain.setValueAtTime(0.55, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(oscGain);
            oscGain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.46);

            const bufSize = Math.floor(this.ctx.sampleRate * 0.25);
            const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.15));
            const noise = this.ctx.createBufferSource();
            noise.buffer = buf;
            const f = this.ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.setValueAtTime(1200, now);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.4, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            noise.connect(f);
            f.connect(g);
            g.connect(this.masterGain);
            noise.start(now);
        } else {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.31);
        }
    }

    playPickaxeBreak() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. High metallic snapping ping
        const osc1 = this.ctx.createOscillator();
        const g1 = this.ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(1850, now);
        osc1.frequency.exponentialRampToValueAtTime(320, now + 0.55);
        g1.gain.setValueAtTime(0.7, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc1.connect(g1);
        g1.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.56);

        // 2. Heavy cracking iron fracture crunch
        const dur = 0.65;
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.22));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(950, now);
        f.Q.setValueAtTime(4.0, now);
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.75, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(f);
        f.connect(g2);
        g2.connect(this.masterGain);
        noise.start(now);
    }

    playElectricalGlitch() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = 0.22;
        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            // Arcing pulse spikes
            const spike = (i % 80 < 8) ? 1.0 : 0.05;
            d[i] = (Math.random() * 2 - 1) * spike;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(2800 + Math.random() * 600, now);
        f.Q.setValueAtTime(3.5, now);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.28, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + dur);
        noise.connect(f);
        f.connect(g);
        g.connect(this.masterGain);
        noise.start(now);
    }

    playEarthquake(duration = 3.5) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const bufSize = Math.floor(this.ctx.sampleRate * duration);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufSize; i++) {
            const white = Math.random() * 2 - 1;
            d[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = d[i];
            d[i] *= 3.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(110, now);
        filter.frequency.linearRampToValueAtTime(160, now + duration * 0.4);
        filter.frequency.linearRampToValueAtTime(60, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.65, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
    }

    playHelmetTap() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.09);

        const buzz = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        buzz.type = 'sawtooth';
        buzz.frequency.setValueAtTime(120, now + 0.04);
        bGain.gain.setValueAtTime(0.2, now + 0.04);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        buzz.connect(bGain);
        bGain.connect(this.masterGain);
        buzz.start(now + 0.04);
        buzz.stop(now + 0.13);
    }

    playOxygenRefill() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = 1.4;

        const bufSize = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.exponentialRampToValueAtTime(900, now + dur);
        filter.Q.setValueAtTime(3.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
    }

    playLilyWhisper() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 880.00, 1046.50];

        notes.forEach((freq, idx) => {
            const delay = idx * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);

            gain.gain.setValueAtTime(0.0001, now + delay);
            gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.2);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + delay);
            osc.stop(now + delay + 1.3);
        });
    }

    setTinnitus(level) {
        if (!this.tinnitusGain || !this.ctx) return;
        const target = Math.max(0.0001, Math.min(0.28, level));
        this.tinnitusGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
    }

    playHeavyCaveInThud() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Sub-bass impact thud
        const osc = this.ctx.createOscillator();
        const oGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(22, now + 0.65);
        oGain.gain.setValueAtTime(0.85, now);
        oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(oGain);
        oGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.72);

        // Crushing stone crunch noise
        const dur = 0.55;
        const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + dur);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        src.start(now);
    }

    playRockCollapse() {
        this.playHeavyCaveInThud();
    }

    playHeavyHeartbeat() {
        this.triggerHeartbeat(0.45);
    }

    playRaggedBreath() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const dur = 1.4;
        const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(650, now);
        filter.frequency.linearRampToValueAtTime(1100, now + 0.7);
        filter.frequency.linearRampToValueAtTime(450, now + dur);
        filter.Q.setValueAtTime(2.5, now);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.38, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        src.start(now);
    }

    playWhoosh() {
        if (!this.ctx) return;
        const bufSize = Math.floor(this.ctx.sampleRate * 0.35);
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufSize);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.35);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        src.start();
    }

    playPickaxeClang(isPerfect = true) {
        this.playPickaxeHit(isPerfect);
    }

    playSwimStroke() {
        this.playWaterStroke();
    }

    playBreathGasp() {
        this.playRaggedBreath();
    }

    playDeepInhale() {
        this.playOxygenRefill();
    }

    playTremorRumble() {
        this.playEarthquake(2.5);
    }

    stopCaveAmbience() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (this.ambienceGain) {
            try {
                this.ambienceGain.gain.cancelScheduledValues(now);
                this.ambienceGain.gain.setValueAtTime(this.ambienceGain.gain.value, now);
                this.ambienceGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
            } catch (e) {}
        }
        if (this.tinnitusGain) {
            try {
                this.tinnitusGain.gain.cancelScheduledValues(now);
                this.tinnitusGain.gain.setValueAtTime(0.0001, now);
            } catch (e) {}
        }
        if (this.breathingTimer) {
            clearTimeout(this.breathingTimer);
            this.breathingTimer = null;
        }
        if (this.heartbeatTimer) {
            clearTimeout(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    playMemoryMusicBox() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Tender, poignant music box motif (Lily's lullaby)
        const notes = [523.25, 659.25, 783.99, 1046.50, 880.00, 783.99, 659.25];
        notes.forEach((f, idx) => {
            const time = now + idx * 0.75;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, time);

            gain.gain.setValueAtTime(0.001, time);
            gain.gain.linearRampToValueAtTime(0.08, time + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(time);
            osc.stop(time + 1.7);
        });
    }

    playVictorySequence() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Fully mute and silence the underground cave drone, heavy breathing, and tinnitus!
        this.stopCaveAmbience();

        const chords = [261.63, 329.63, 392.00, 523.25];
        chords.forEach(f => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now);
            g.gain.setValueAtTime(0.01, now);
            g.gain.linearRampToValueAtTime(0.14, now + 1.5);
            g.gain.linearRampToValueAtTime(0.14, now + 6.0);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 9.5);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 9.8);
        });

        for (let b = 0; b < 6; b++) {
            const birdStart = now + 1.8 + b * 0.7 + Math.random() * 0.4;
            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bOsc.type = 'sine';
            bOsc.frequency.setValueAtTime(2600 + Math.random() * 300, birdStart);
            bOsc.frequency.exponentialRampToValueAtTime(3800, birdStart + 0.08);
            bOsc.frequency.exponentialRampToValueAtTime(2900, birdStart + 0.16);

            bGain.gain.setValueAtTime(0.001, birdStart);
            bGain.gain.linearRampToValueAtTime(0.15, birdStart + 0.04);
            bGain.gain.exponentialRampToValueAtTime(0.0001, birdStart + 0.18);

            bOsc.connect(bGain);
            bGain.connect(this.masterGain);
            bOsc.start(birdStart);
            bOsc.stop(birdStart + 0.2);
        }
    }
}

window.soundEngine = new SoundEngine();
