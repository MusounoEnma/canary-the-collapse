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
        this.escapeHatch = this.stage3.escapeHatch;
        this.mineCart = this.stage1.mineCart;
        this.chuteHatch = this.stage1.chuteHatch;

        // Dust motes particle field
        this.buildAtmosphericDust();
    }

    initTextures() {
        // High-readability warm sedimentary rock texture
        const rockCanvas = document.createElement('canvas');
        rockCanvas.width = 1024; rockCanvas.height = 1024;
        const rctx = rockCanvas.getContext('2d');
        rctx.fillStyle = '#2d2720'; // Warm stone base
        rctx.fillRect(0, 0, 1024, 1024);

        // Sedimentary strata bedding & mineral grain
        for (let y = 0; y < 1024; y += 2) {
            const noise = Math.sin(y * 0.04) * 26 + Math.random() * 32;
            const lum = 42 + Math.floor(noise * 0.55);
            rctx.fillStyle = `rgb(${lum + 12},${lum + 8},${lum})`;
            rctx.fillRect(0, y, 1024, 2 + Math.random() * 2);
        }

        // Jagged quartz and iron-vein fracture lines
        for (let i = 0; i < 70; i++) {
            rctx.strokeStyle = i % 4 === 0 ? 'rgba(255, 183, 77, 0.45)' : 'rgba(15, 12, 10, 0.85)';
            rctx.lineWidth = 2 + Math.random() * 3.5;
            rctx.beginPath();
            let curX = 0;
            let curY = Math.random() * 1024;
            rctx.moveTo(curX, curY);
            while (curX < 1024) {
                curX += 20 + Math.random() * 35;
                curY += (Math.random() - 0.5) * 45;
                rctx.lineTo(curX, curY);
            }
            rctx.stroke();
        }

        this.rockTexture = new THREE.CanvasTexture(rockCanvas);
        this.rockTexture.wrapS = THREE.RepeatWrapping;
        this.rockTexture.wrapT = THREE.RepeatWrapping;
        this.rockTexture.repeat.set(4, 80);

        // Weathered Dark Timber Texture
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 256; woodCanvas.height = 256;
        const wctx = woodCanvas.getContext('2d');
        wctx.fillStyle = '#3e2723';
        wctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1500; i++) {
            const y = Math.random() * 256;
            wctx.fillStyle = `rgba(20, 10, 5, ${0.15 + Math.random() * 0.35})`;
            wctx.fillRect(0, y, 256, 1 + Math.random() * 3);
        }
        this.woodTexture = new THREE.CanvasTexture(woodCanvas);
        this.woodTexture.wrapS = THREE.RepeatWrapping;
        this.woodTexture.wrapT = THREE.RepeatWrapping;

        // Heavy Industrial Metal
        const metalCanvas = document.createElement('canvas');
        metalCanvas.width = 256; metalCanvas.height = 256;
        const mctx = metalCanvas.getContext('2d');
        mctx.fillStyle = '#455a64';
        mctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1000; i++) {
            mctx.fillStyle = `rgba(180, 85, 35, ${Math.random() * 0.45})`;
            mctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 4 + Math.random() * 8);
        }
        this.metalTexture = new THREE.CanvasTexture(metalCanvas);
    }

    initMaterials() {
        this.materials = {
            rock: new THREE.MeshStandardMaterial({
                map: this.rockTexture,
                roughness: 0.88,
                metalness: 0.12
            }),
            wood: new THREE.MeshStandardMaterial({
                map: this.woodTexture,
                roughness: 0.85,
                metalness: 0.05
            }),
            metal: new THREE.MeshStandardMaterial({
                map: this.metalTexture,
                roughness: 0.45,
                metalness: 0.82
            })
        };
    }

    setupAtmosphericLighting() {
        // Boosted global ambient light for sharp visibility and high readability
        const ambientLight = new THREE.AmbientLight(0xfff3e0, 0.45);
        this.scene.add(ambientLight);

        // Soft subterranean directional bounce
        const dirLight = new THREE.DirectionalLight(0xffecb3, 0.35);
        dirLight.position.set(0, 25, 0);
        this.scene.add(dirLight);
    }

    buildAtmosphericDust() {
        const dustCount = 450;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount * 3; i += 3) {
            positions[i + 0] = (Math.random() - 0.5) * 8.0;
            positions[i + 1] = Math.random() * 6.0;
            positions[i + 2] = (Math.random() - 0.5) * 20.0;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffd54f,
            size: 0.055,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.dustParticles = new THREE.Points(geo, mat);
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
            // Under water grotto: water surface is at y = -12.2, floor is at y = -14.0
            return -14.0;
        } else {
            return this.stage3.getPathY(z);
        }
    }

    isWaterZone(z) {
        return z <= -395 && z >= -615;
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
        // Follow player with floating dust motes
        if (this.dustParticles && playerPos) {
            this.dustParticles.position.set(playerPos.x, playerPos.y, playerPos.z);
            const posAttr = this.dustParticles.geometry.attributes.position;
            for (let i = 1; i < posAttr.count * 3; i += 3) {
                posAttr.array[i] += Math.sin(performance.now() * 0.001 + i) * 0.004;
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
