/**
 * CANARY: The Collapse - Master World Coordinator
 * Orchestrates 3 expansive, interconnected survival sectors across nearly 900 meters of subterranean terrain:
 * - Stage 1 (Depth -780m to -600m): The Collapsed Vein (Pickaxe breaches, rail obstacles, amber lanterns)
 * - Stage 2 (Depth -600m to -300m): The Abyssal Slide & Flooded Grotto (High-speed chute, 225m swimming lake, O2 geysers)
 * - Stage 3 (Depth -300m to 0m): The Vertical Ascent & Surface Breach (24m manual rope climb, seismic tremor, falling boulder dodging, Hatch B-4)
 */

class MineWorld {
    constructor(scene) {
        this.scene = scene;
        this.tunnelLength = 875; // Total depth span from +15 down to -865

        this.initTextures();
        this.initMaterials();

        // Atmospheric Global Ambient & Directional Lighting (Warm, High-Contrast & Readable)
        this.setupAtmosphericLighting();

        // Initialize 3 Distinct Survival Stages
        this.stage1 = new Stage1Vein(this.scene, this.materials);
        this.stage2 = new Stage2SlideAndGrotto(this.scene, this.materials);
        this.stage3 = new Stage3AscentAndBreach(this.scene, this.materials);

        // Expose unified arrays for gameplay event managers
        this.rubbles = this.stage1.rubbles;
        this.corpses = [...this.stage1.corpses, this.stage2.raftCorpse];
        this.airVents = this.stage2.airVents;
        this.rescueRope = this.stage3.rescueRope;
        this.emergencyO2Cache = this.stage3.emergencyO2Cache;
        this.escapeHatch = this.stage3.escapeHatch;
        this.mineCart = this.stage1.mineCart;
        this.chuteHatch = this.stage1.chuteHatch;

        // Dust motes particle field
        this.buildAtmosphericDust();
    }

    initTextures() {
        // High-contrast, authentic deep navy slate rock texture with golden pyrite flecks
        const rockCanvas = document.createElement('canvas');
        rockCanvas.width = 512; rockCanvas.height = 512;
        const rctx = rockCanvas.getContext('2d');
        
        // Deep navy slate base (dark navy, authentic mine strata)
        rctx.fillStyle = '#141c26';
        rctx.fillRect(0, 0, 512, 512);

        // Jagged granite facets & sedimentary bedding in dark navy tones
        for (let i = 0; i < 9000; i++) {
            const lum = 28 + Math.floor(Math.random() * 24);
            rctx.fillStyle = `rgb(${lum},${lum + 4},${lum + 12})`;
            rctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5 + Math.random() * 2.5, 1.5 + Math.random() * 2.5);
        }

        // Sharp rock fracture seams & deep chisels
        for (let i = 0; i < 45; i++) {
            rctx.strokeStyle = i % 3 === 0 ? 'rgba(8, 14, 22, 0.92)' : 'rgba(24, 38, 56, 0.75)';
            rctx.lineWidth = 1.0 + Math.random() * 2.2;
            rctx.beginPath();
            let curX = 0;
            let curY = Math.random() * 512;
            rctx.moveTo(curX, curY);
            while (curX < 512) {
                curX += 16 + Math.random() * 32;
                curY += (Math.random() - 0.5) * 26;
                rctx.lineTo(curX, curY);
            }
            rctx.stroke();
        }

        // Subterranean golden pyrite and amber mineral flecks
        for (let k = 0; k < 3200; k++) {
            const px = Math.random() * 512;
            const py = Math.random() * 512;
            if (Math.random() < 0.28) {
                rctx.fillStyle = 'rgba(255, 193, 7, 0.85)'; // Golden pyrite flecks
                rctx.fillRect(px, py, 2, 2);
            } else {
                const lum = 32 + Math.floor(Math.random() * 20);
                rctx.fillStyle = `rgb(${lum},${lum + 6},${lum + 16})`;
                rctx.fillRect(px, py, 1.5, 1.5);
            }
        }

        this.rockTexture = new THREE.CanvasTexture(rockCanvas);
        this.rockTexture.wrapS = THREE.RepeatWrapping;
        this.rockTexture.wrapT = THREE.RepeatWrapping;
        this.rockTexture.repeat.set(4, 25);

        // Weathered Dark Timber Texture
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 256; woodCanvas.height = 256;
        const wctx = woodCanvas.getContext('2d');
        wctx.fillStyle = '#2d1e16';
        wctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1500; i++) {
            const y = Math.random() * 256;
            wctx.fillStyle = `rgba(15, 8, 4, ${0.2 + Math.random() * 0.4})`;
            wctx.fillRect(0, y, 256, 1 + Math.random() * 3);
        }
        this.woodTexture = new THREE.CanvasTexture(woodCanvas);
        this.woodTexture.wrapS = THREE.RepeatWrapping;
        this.woodTexture.wrapT = THREE.RepeatWrapping;

        // Heavy Industrial Metal
        const metalCanvas = document.createElement('canvas');
        metalCanvas.width = 256; metalCanvas.height = 256;
        const mctx = metalCanvas.getContext('2d');
        mctx.fillStyle = '#263238';
        mctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1000; i++) {
            mctx.fillStyle = `rgba(180, 85, 20, ${Math.random() * 0.45})`;
            mctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 4 + Math.random() * 8);
        }
        this.metalTexture = new THREE.CanvasTexture(metalCanvas);
    }

    initMaterials() {
        this.materials = {
            rock: new THREE.MeshStandardMaterial({
                map: this.rockTexture,
                color: new THREE.Color(0x222e3e), // Deep navy slate rock (dark navy tone)
                roughness: 0.72,
                metalness: 0.16,
                side: THREE.DoubleSide
            }),
            wood: new THREE.MeshStandardMaterial({
                map: this.woodTexture,
                color: new THREE.Color(0x3e2723), // Warm weathered timber
                roughness: 0.88,
                metalness: 0.05,
                side: THREE.DoubleSide
            }),
            metal: new THREE.MeshStandardMaterial({
                map: this.metalTexture,
                color: new THREE.Color(0x455a64),
                roughness: 0.38,
                metalness: 0.88,
                side: THREE.DoubleSide
            })
        };
    }

    setupAtmosphericLighting() {
        // Deep navy ambient fill
        const ambientLight = new THREE.AmbientLight(0x0e1b2c, 0.60);
        this.scene.add(ambientLight);
    }

    buildAtmosphericDust() {
        const dustCount = 450;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount * 3; i += 3) {
            positions[i + 0] = (Math.random() - 0.5) * 16.0;
            positions[i + 1] = Math.random() * 8.0 - 2.0;
            positions[i + 2] = (Math.random() - 0.5) * 30.0;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffd54f,
            size: 0.055,
            transparent: true,
            opacity: 0.65,
            blending: THREE.AdditiveBlending
        });

        this.dustParticles = new THREE.Points(geo, mat);
        this.dustParticles.position.set(0, 0, 0); // Stays at world origin, never parented to player!
        this.scene.add(this.dustParticles);
    }

    // Unified Path Queries Across All 3 Stages
    getPathX(z) {
        if (z > -285) {
            return this.stage1.getPathX(z);
        } else if (z > -395) {
            const p = (-z - 285) / 110;
            return Math.sin(p * Math.PI * 2.5) * 4.2;
        } else if (z > -625) {
            return Math.sin(z * 0.02) * 3.5;
        } else {
            return this.stage3.getPathX(z);
        }
    }

    getPathY(z) {
        if (z > -285) {
            return this.stage1.getPathY(z);
        } else if (z > -395) {
            const p = (-z - 285) / 110;
            return THREE.MathUtils.lerp(4.5, -14.0, Math.pow(p, 1.2));
        } else if (z > -625) {
            return -14.0;
        } else {
            return this.stage3.getPathY(z);
        }
    }

    getGroundHeight(x, z) {
        if (z > -285) {
            return this.stage1.getPathY(z);
        } else if (z > -395) {
            const p = (-z - 285) / 110;
            return THREE.MathUtils.lerp(4.5, -14.0, Math.pow(p, 1.2));
        } else if (z > -625) {
            // Lake shore landing platform where player exits water at z <= -615
            if (z <= -615) {
                return -12.0;
            }
            // Under water grotto: water surface is at y = -12.2, floor is at y = -14.0
            return -14.0;
        } else {
            return this.stage3.getPathY(z);
        }
    }

    isWaterZone(z) {
        return z <= -395 && z >= -615;
    }

    getWaterHeightAt(x, z) {
        if (this.stage2 && this.stage2.getWaterHeightAt) {
            return this.stage2.getWaterHeightAt(x, z);
        }
        return -12.2;
    }

    isSlideZone(z) {
        return z <= -285 && z > -395;
    }

    isClimbZone(z) {
        return z <= -620 && z >= -632;
    }

    removeRubble(rubbleId) {
        const r = this.rubbles.find(x => x.id === rubbleId);
        if (!r) return;

        r.cleared = true;
        if (r.marker) r.marker.visible = false;

        // Spawn explosive debris
        if (window.pickaxeSystem) {
            window.pickaxeSystem.spawnRockShatterDebris(r.position, 0x4a443c);
        }

        // Animate rubble collapsing and clearing path
        let t = 0;
        const animCollapse = () => {
            t += 0.05;
            r.group.position.y -= 0.15;
            r.group.scale.multiplyScalar(0.92);
            if (t < 1.0) {
                requestAnimationFrame(animCollapse);
            } else {
                this.scene.remove(r.group);
            }
        };
        animCollapse();
    }

    update(delta, playerPos, oxygen) {
        // Natural, independent 3D dust particle drift (wraps around player volume in world space)
        if (this.dustParticles && playerPos) {
            const posAttr = this.dustParticles.geometry.attributes.position;
            const time = performance.now() * 0.001;
            const px = playerPos.x;
            const py = playerPos.y;
            const pz = playerPos.z;

            for (let i = 0; i < posAttr.count * 3; i += 3) {
                // Autonomous gentle 3D air currents
                posAttr.array[i + 1] -= delta * 0.22; // subtle downward settling
                posAttr.array[i + 0] += Math.sin(time * 0.8 + i) * 0.008;
                posAttr.array[i + 2] += Math.cos(time * 0.6 + i) * 0.008;

                // Infinite wrap box: 18m width, 8m height, 32m depth around player
                if (posAttr.array[i + 0] < px - 9.0) posAttr.array[i + 0] = px + 9.0;
                if (posAttr.array[i + 0] > px + 9.0) posAttr.array[i + 0] = px - 9.0;
                if (posAttr.array[i + 1] < py - 1.5) posAttr.array[i + 1] = py + 6.0;
                if (posAttr.array[i + 1] > py + 6.0) posAttr.array[i + 1] = py - 1.5;
                if (posAttr.array[i + 2] < pz - 16.0) posAttr.array[i + 2] = pz + 16.0;
                if (posAttr.array[i + 2] > pz + 16.0) posAttr.array[i + 2] = pz - 16.0;
            }
            posAttr.needsUpdate = true;
        }

        // Delegate updates to each stage
        this.stage1.update(delta, playerPos);
        this.stage2.update(delta, playerPos);
        this.stage3.update(delta, playerPos);
    }
}

window.MineWorld = MineWorld;
