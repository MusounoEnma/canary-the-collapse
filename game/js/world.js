/**
 * CANARY: The Collapse - 3D Extreme Undulating Cavern, Swimming Stage & Rescue Rope
 * Features:
 * - Clean solid boulder rubble (Zero vertex glitch/spike anomalies).
 * - Flooded underwater cavern sump stage for swimming.
 * - Vertical rescue rope stage for climbing up the cliff ledge.
 * - Gritty dark atmospheric coal & slate textures.
 */

class MineWorld {
    constructor(scene) {
        this.scene = scene;
        this.rubbleObjects = [];
        this.corpseObjects = [];
        this.dustParticles = null;
        this.bubbleParticles = null;
        this.hallucination = null;
        this.emergencyLights = [];
        this.escapeHatch = null;
        this.rescueRope = null;
        this.gearCrate = null;
        this.puddles = [];

        this.tunnelLength = 345;

        this.initTextures();
        this.buildSeamlessCavern();
        this.buildDetourChuteBranch();
        this.buildAtmosphere();
        this.buildInteractables();
        this.buildRescueRope();
        this.buildGearCrate();
        this.buildHallucination();
    }

    // -------------------------------------------------------------
    // EXTREME CURVE & ELEVATION FORMULAS (Continuous & Extended to -345m)
    // -------------------------------------------------------------
    getPathX(z) {
        if (z > -134) {
            return Math.sin(z * 0.045) * 3.8 + Math.sin(z * 0.02) * 1.8;
        }
        const x0 = Math.sin(-134 * 0.045) * 3.8 + Math.sin(-134 * 0.02) * 1.8;
        if (z > -190) {
            // Detour chute & flooded swimming sump
            const t = (-z - 134) / 56;
            const x1 = x0 - 2.8;
            return x0 - Math.sin(t * Math.PI) * 4.2 + t * (x1 - x0);
        }
        // Upper canyon shaft, low crawlspace & surface approach
        const x1 = x0 - 2.8;
        const t2 = -z - 190;
        return x1 + (Math.cos(t2 * 0.035) - 1.0) * 3.2 + Math.sin(t2 * 0.015) * 1.6;
    }

    getPathY(z) {
        if (z > -134) {
            return (-z / 140) * 8.0 + Math.sin(z * 0.08) * 1.5 + Math.cos(z * 0.04) * 1.0;
        }
        const y0 = (134 / 140) * 8.0 + Math.sin(-134 * 0.08) * 1.5 + Math.cos(-134 * 0.04) * 1.0;
        if (z > -160) {
            // Steep rockslide chute plunge down into water
            const t = (-z - 134) / 26;
            return y0 + t * (2.4 - y0) - Math.sin(t * Math.PI) * 0.6;
        }
        if (z > -182) {
            // Flooded swimming basin (water level is at y = 2.4)
            return 2.4 + Math.sin(z * 0.05) * 0.12;
        }
        if (z > -195) {
            // Shoreline gravel bank sloping smoothly up from water (y=2.4) to rescue rope base (y=3.6)
            const t = (-z - 182) / 13;
            return 2.4 + t * 1.2;
        }
        // Upper canyon ledge (climbed via rescue rope up to +10.5m)
        const t2 = -z - 195;
        const ascent = 10.5 + (t2 / 150) * 22.0;
        const ruggedness = Math.sin(t2 * 0.06) * 1.1;
        return ascent + ruggedness;
    }

    initTextures() {
        const rockCanvas = document.createElement('canvas');
        rockCanvas.width = 1024;
        rockCanvas.height = 1024;
        const rctx = rockCanvas.getContext('2d');

        // Dark charcoal-slate base matching the collapse boulders
        rctx.fillStyle = '#181512';
        rctx.fillRect(0, 0, 1024, 1024);

        // Sedimentary strata bedding & mineral grain
        for (let y = 0; y < 1024; y += 2) {
            const noise = Math.sin(y * 0.04) * 22 + Math.random() * 26;
            const lum = 24 + Math.floor(noise * 0.55);
            const r = lum + Math.floor(Math.random() * 6);
            const g = lum + Math.floor(Math.random() * 4);
            const b = lum - 3;
            rctx.fillStyle = `rgb(${r},${g},${b})`;
            rctx.fillRect(0, y, 1024, 2 + Math.random() * 2);
        }

        // Deep jagged fracture lines & chisel breaks
        for (let i = 0; i < 65; i++) {
            rctx.strokeStyle = i % 3 === 0 ? 'rgba(5, 4, 3, 0.98)' : 'rgba(55, 45, 36, 0.65)';
            rctx.lineWidth = 2 + Math.random() * 4.5;
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

        // Chipped rock facets & micro-fissures
        for (let k = 0; k < 12000; k++) {
            const px = Math.random() * 1024;
            const py = Math.random() * 1024;
            const lum = Math.floor(16 + Math.random() * 36);
            rctx.fillStyle = `rgb(${lum + 6},${lum + 3},${lum})`;
            rctx.fillRect(px, py, 2 + Math.random() * 3, 2 + Math.random() * 3);
        }

        this.rockTexture = new THREE.CanvasTexture(rockCanvas);
        this.rockTexture.wrapS = THREE.RepeatWrapping;
        this.rockTexture.wrapT = THREE.RepeatWrapping;
        this.rockTexture.repeat.set(6, 90);

        // Weathered Dark Timber
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 256;
        woodCanvas.height = 256;
        const wctx = woodCanvas.getContext('2d');
        wctx.fillStyle = '#2c1e13';
        wctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1500; i++) {
            const y = Math.random() * 256;
            wctx.fillStyle = `rgba(15, 8, 4, ${0.15 + Math.random() * 0.35})`;
            wctx.fillRect(0, y, 256, 1 + Math.random() * 3);
        }
        this.woodTexture = new THREE.CanvasTexture(woodCanvas);
        this.woodTexture.wrapS = THREE.RepeatWrapping;
        this.woodTexture.wrapT = THREE.RepeatWrapping;

        // Metal
        const metalCanvas = document.createElement('canvas');
        metalCanvas.width = 256;
        metalCanvas.height = 256;
        const mctx = metalCanvas.getContext('2d');
        mctx.fillStyle = '#343639';
        mctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1000; i++) {
            mctx.fillStyle = `rgba(150, 75, 30, ${Math.random() * 0.45})`;
            mctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 4 + Math.random() * 8);
        }
        this.metalTexture = new THREE.CanvasTexture(metalCanvas);
    }

    buildSeamlessCavern() {
        const points = [];
        for (let z = 12; z >= -this.tunnelLength - 5; z -= 2.0) {
            points.push(new THREE.Vector3(this.getPathX(z), this.getPathY(z) + 1.5, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        this.cavernCurve = curve;

        const tubularSegments = 420;
        const radius = 2.45; // Narrow, claustrophobic, authentic mine shaft!
        const radialSegments = 16;
        const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

        // Multi-octave faceted rock displacement matching the rubble cave-in boulders!
        const posAttr = tubeGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            let vx = posAttr.getX(i);
            let vy = posAttr.getY(i);
            let vz = posAttr.getZ(i);

            // Chiseled, jagged stone facets
            const bump = (
                Math.sin(vx * 2.2 + vz * 0.8) * 0.22 +
                Math.cos(vy * 2.8 + vx * 1.4) * 0.16 +
                Math.sin(vz * 3.2) * 0.10
            );
            posAttr.setX(i, vx + bump);
            posAttr.setY(i, vy + bump);

            // Carve visible gaping crevice opening in left cavern wall for side drainage chute (z = -128 to -136)
            if (vz <= -128 && vz >= -136) {
                const pathX = this.getPathX(vz);
                if (vx < pathX) {
                    const t = Math.sin(((-vz - 128) / 8) * Math.PI);
                    posAttr.setX(i, vx - t * 2.8); // Pulls left wall outward into a wide visible breach
                }
            }

            // Low crawlspace constriction at z = -228 to -265 (MUST CROUCH [C] TO PASS!)
            if (vz <= -228 && vz >= -265) {
                const t = Math.sin(((-vz - 228) / 37) * Math.PI);
                const groundY = this.getPathY(vz);
                if (vy > groundY + 1.25) {
                    posAttr.setY(i, vy - t * 1.15); // Compresses ceiling down to 1.25m!
                }
            }
        }
        tubeGeo.computeVertexNormals();

        const cavernMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            color: new THREE.Color(0x3e3730), // Dark charcoal-stone tone matching rubble!
            roughness: 0.90,
            metalness: 0.12,
            side: THREE.DoubleSide
        });

        const cavernMesh = new THREE.Mesh(tubeGeo, cavernMat);
        cavernMesh.receiveShadow = true;
        this.scene.add(cavernMesh);

        this.buildTracks();
        this.buildSubmergedWaterVolume();
    }

    // Submerged Flooded Tunnel Stage (Swimming section: z = -160 to -182)
    buildSubmergedWaterVolume() {
        // Deep murky water plane covering the swimming basin (z = -160 to -182)
        const waterGeo = new THREE.PlaneGeometry(6.2, 23.0, 10, 20);
        waterGeo.rotateX(-Math.PI / 2);

        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x0a2228,
            roughness: 0.08,
            metalness: 0.85,
            transparent: true,
            opacity: 0.82
        });

        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        const midZ = -171;
        waterMesh.position.set(this.getPathX(midZ), 2.45, midZ);
        this.scene.add(waterMesh);

        // Underwater bubble particles
        const bubbleCount = 200;
        const bubbleGeo = new THREE.BufferGeometry();
        const bPos = new Float32Array(bubbleCount * 3);
        for (let i = 0; i < bubbleCount * 3; i += 3) {
            bPos[i] = this.getPathX(midZ) + (Math.random() - 0.5) * 5;
            bPos[i + 1] = this.getPathY(midZ) + Math.random() * 2.2;
            bPos[i + 2] = midZ + (Math.random() - 0.5) * 18;
        }
        bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));

        const bubbleMat = new THREE.PointsMaterial({
            color: 0x80deea,
            size: 0.08,
            transparent: true,
            opacity: 0.6
        });
        this.bubbleParticles = new THREE.Points(bubbleGeo, bubbleMat);
        this.scene.add(this.bubbleParticles);
    }

    // Physical side cavern bypass chute (z = -130 to -162)
    buildDetourChuteBranch() {
        // Dedicated side cavern tube for the emergency drainage chute (z = -130 to -162)
        const chutePoints = [];
        for (let cz = -130; cz >= -162; cz -= 2) {
            const t = (-cz - 130) / 32; // 0 to 1
            const cx = this.getPathX(-130) - 1.2 - Math.sin(t * Math.PI) * 4.2 - (t * 1.6);
            const cy = this.getPathY(-130) + 1.6 - (t * 6.5);
            chutePoints.push(new THREE.Vector3(cx, cy, cz));
        }
        const chuteCurve = new THREE.CatmullRomCurve3(chutePoints);
        const chuteGeo = new THREE.TubeGeometry(chuteCurve, 36, 3.2, 14, false);
        const chuteMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.94,
            metalness: 0.08,
            side: THREE.DoubleSide
        });
        const chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
        chuteMesh.receiveShadow = true;
        this.scene.add(chuteMesh);

        // 1. Chute Entrance Portal Archway (z = -131 on the left wall)
        const archGroup = new THREE.Group();
        const archX = this.getPathX(-131) - 2.1;
        const archY = this.getPathY(-131);
        const archZ = -131;

        const woodMat = new THREE.MeshStandardMaterial({
            map: this.woodTexture,
            roughness: 0.9,
            metalness: 0.1
        });

        // Left & right rugged timber uprights
        const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), woodMat);
        leftPost.position.set(-1.4, 1.6, 0);
        leftPost.rotation.z = 0.08;
        archGroup.add(leftPost);

        const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), woodMat);
        rightPost.position.set(1.4, 1.6, 0);
        rightPost.rotation.z = -0.08;
        archGroup.add(rightPost);

        // Top lintel crossbeam
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.4, 0.4), woodMat);
        lintel.position.set(0, 3.1, 0);
        archGroup.add(lintel);

        // Broken warning barrier slats across lower opening
        const slatMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
        const lowerSlat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.08), slatMat);
        lowerSlat.position.set(-0.2, 0.5, 0.1);
        lowerSlat.rotation.z = -0.15;
        archGroup.add(lowerSlat);

        // 2. Large Illuminated Industrial Detour Sign
        const dCanvas = document.createElement('canvas');
        dCanvas.width = 512;
        dCanvas.height = 256;
        const dctx = dCanvas.getContext('2d');
        dctx.fillStyle = '#b71c1c';
        dctx.fillRect(0, 0, 512, 256);
        dctx.lineWidth = 10;
        dctx.strokeStyle = '#ffeb3b';
        dctx.strokeRect(10, 10, 492, 236);

        dctx.fillStyle = '#ffffff';
        dctx.font = 'bold 36px monospace';
        dctx.textAlign = 'center';
        dctx.fillText('◄ EMERGENCY BYPASS', 256, 75);

        dctx.fillStyle = '#ffeb3b';
        dctx.font = 'bold 30px monospace';
        dctx.fillText('DRAINAGE CHUTE', 256, 135);

        dctx.fillStyle = '#ffffff';
        dctx.font = 'bold 22px monospace';
        dctx.fillText('CAUTION: STEEP INCLINE // WATER SUMP', 256, 195);

        const dTex = new THREE.CanvasTexture(dCanvas);
        const signMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2.2, 1.1),
            new THREE.MeshStandardMaterial({ map: dTex, roughness: 0.4 })
        );
        signMesh.position.set(0, 2.3, 0.22);
        archGroup.add(signMesh);

        // 3. Flashing Amber Hazard Beacon above the sign
        const beaconLight = new THREE.PointLight(0xffa000, 2.2, 16, 2);
        beaconLight.position.set(0, 3.5, 0.4);
        archGroup.add(beaconLight);

        const beaconGlobe = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0xffa000, emissive: 0xffa000, emissiveIntensity: 1.5 })
        );
        beaconGlobe.position.set(0, 3.5, 0.4);
        archGroup.add(beaconGlobe);

        archGroup.position.set(archX, archY, archZ);
        archGroup.rotation.y = Math.PI / 6; // Angled facing the approaching player
        this.scene.add(archGroup);

        this.chuteArchGroup = archGroup;
        this.chuteBeacon = beaconLight;

        // Chute Interior Spotlight angled shining out through the fissure
        const cSpot = new THREE.SpotLight(0xffb74d, 1.2, 18, Math.PI / 4, 0.5, 1.2);
        cSpot.position.set(archX - 2.5, archY + 1.8, archZ - 3);
        const cSpotTarget = new THREE.Object3D();
        cSpotTarget.position.set(archX, archY + 1.2, archZ);
        this.scene.add(cSpot);
        this.scene.add(cSpotTarget);
        cSpot.target = cSpotTarget;
        this.chuteInteriorLight = cSpot;

        this.emergencyLights.push({
            group: archGroup,
            light: beaconLight,
            type: 'amber',
            baseIntensity: 2.2,
            flickerSeed: 42
        });

        // 4. Directional Chevron Markings on the Floor pointing Left
        const arrowCanvas = document.createElement('canvas');
        arrowCanvas.width = 256;
        arrowCanvas.height = 128;
        const actx = arrowCanvas.getContext('2d');
        actx.fillStyle = 'rgba(0,0,0,0)';
        actx.fillRect(0, 0, 256, 128);
        actx.fillStyle = '#ffd54f';
        actx.font = 'bold 50px sans-serif';
        actx.textAlign = 'center';
        actx.fillText('◄ ◄ ◄', 128, 80);

        const arrowTex = new THREE.CanvasTexture(arrowCanvas);
        const arrowMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 0.8),
            new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, opacity: 0.85 })
        );
        arrowMesh.rotation.x = -Math.PI / 2;
        arrowMesh.position.set(this.getPathX(-131) - 0.7, this.getPathY(-131) + 0.05, -131);
        this.scene.add(arrowMesh);

        // 5. Twisted, Mangled Rails at Bedrock Wall (z = -133)
        const bendRailMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.9, roughness: 0.3 });
        for (let side of [-0.75, 0.75]) {
            const bentRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 1.4), bendRailMat);
            bentRail.position.set(this.getPathX(-133) + side, this.getPathY(-133) + 0.35, -133);
            bentRail.rotation.x = -Math.PI / 5; // Bent violently upwards!
            this.scene.add(bentRail);
        }
    }

    // Visually illuminate and expose the left-wall fissure when pickaxe shatters
    revealChuteOpening() {
        if (this.chuteRevealed) return;
        this.chuteRevealed = true;

        if (this.chuteBeacon) {
            this.chuteBeacon.intensity = 4.8;
            this.chuteBeacon.color.setHex(0xffca28);
        }
        if (this.chuteInteriorLight) {
            this.chuteInteriorLight.intensity = 5.5;
            this.chuteInteriorLight.color.setHex(0xffd54f);
        }

        // Add prominent illuminated holographic chevron banner at the opening
        if (this.chuteArchGroup) {
            const flareCanvas = document.createElement('canvas');
            flareCanvas.width = 512;
            flareCanvas.height = 128;
            const fctx = flareCanvas.getContext('2d');
            fctx.fillStyle = '#ff9800';
            fctx.fillRect(0, 0, 512, 128);
            fctx.fillStyle = '#000';
            fctx.font = 'bold 32px monospace';
            fctx.textAlign = 'center';
            fctx.fillText('◄◄ BYPASS OPEN // DRAINAGE CHUTE ◄◄', 256, 75);

            const flareTex = new THREE.CanvasTexture(flareCanvas);
            const flareBanner = new THREE.Mesh(
                new THREE.PlaneGeometry(2.6, 0.65),
                new THREE.MeshBasicMaterial({ map: flareTex, transparent: true, opacity: 0.95 })
            );
            flareBanner.position.set(0, 0.95, 0.35);
            this.chuteArchGroup.add(flareBanner);
        }

        // Shower of falling rock chips breaking from the left wall
        const chipGeo = new THREE.DodecahedronGeometry(0.18, 0);
        const chipMat = new THREE.MeshStandardMaterial({ map: this.rockTexture, color: 0x444444 });
        for (let i = 0; i < 14; i++) {
            const chip = new THREE.Mesh(chipGeo, chipMat);
            const cx = this.getPathX(-131) - 1.2 - Math.random() * 1.5;
            const cy = this.getPathY(-131) + 2.2 + Math.random() * 0.8;
            const cz = -131 + (Math.random() - 0.5) * 2.5;
            chip.position.set(cx, cy, cz);
            this.scene.add(chip);

            let vy = -(0.5 + Math.random() * 2.0);
            const interval = setInterval(() => {
                chip.position.y += vy * 0.03;
                chip.rotation.x += 0.12;
                chip.rotation.z += 0.15;
                if (chip.position.y <= this.getPathY(cz) + 0.1) {
                    clearInterval(interval);
                }
            }, 30);
        }
    }

    // Spawn falling boulders crashing down during the final climax earthquake
    spawnClimaxFallingBoulders(playerPos) {
        if (!playerPos) return;
        const boulderCount = 10;
        const bMat = new THREE.MeshStandardMaterial({ map: this.rockTexture, roughness: 0.9, color: 0x3a3630 });

        for (let i = 0; i < boulderCount; i++) {
            const size = 0.5 + Math.random() * 0.6;
            const bGeo = new THREE.DodecahedronGeometry(size, 0);
            const bMesh = new THREE.Mesh(bGeo, bMat);

            const ox = (Math.random() - 0.5) * 2.2;
            const oz = (Math.random() - 0.5) * 3.5;
            const startY = playerPos.y + 4.5 + i * 0.4;

            bMesh.position.set(playerPos.x + ox, startY, playerPos.z + oz);
            bMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            this.scene.add(bMesh);

            let vy = 0;
            const fallTimer = setInterval(() => {
                vy -= 0.65;
                bMesh.position.y += vy * 0.03;
                bMesh.rotation.x += 0.1;
                bMesh.rotation.y += 0.15;

                const ground = this.getPathY(bMesh.position.z);
                if (bMesh.position.y <= ground + size * 0.7) {
                    clearInterval(fallTimer);
                    bMesh.position.y = ground + size * 0.5;
                }
            }, 25);
        }
    }

    // Vertical Rescue Climbing Rope at Cliff Ledge (z = -195)
    buildRescueRope() {
        const ropeZ = -195;
        const ropeX = this.getPathX(ropeZ);
        const lowerY = 3.6; // Dry gravel bank after swimming
        const upperY = 10.5; // Upper canyon ledge!
        const climbH = upperY - lowerY; // 6.9 meters vertical

        const ropeGroup = new THREE.Group();

        // Thick braided hemp rescue rope (Cylinder)
        const ropeMat = new THREE.MeshStandardMaterial({
            color: 0x8d6e63,
            roughness: 0.9,
            metalness: 0.1
        });
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, climbH + 0.5, 8), ropeMat);
        rope.position.set(0, climbH / 2, 0);
        ropeGroup.add(rope);

        // Rope climbing knots / grip rungs every 0.75m
        const knotMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        for (let y = 0.5; y < climbH; y += 0.75) {
            const knot = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 12), knotMat);
            knot.rotation.x = Math.PI / 2;
            knot.position.set(0, y, 0);
            ropeGroup.add(knot);
        }

        // Heavy steel anchor bolt & carabiner in ceiling
        const anchorMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8 });
        const anchor = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16), anchorMat);
        anchor.position.set(0, climbH + 0.1, 0);
        ropeGroup.add(anchor);

        // Emergency beacon pulsing at the top of the rope
        const ropeBeacon = new THREE.PointLight(0xffb300, 1.4, 12, 2);
        ropeBeacon.position.set(0, climbH - 0.2, 0.5);
        ropeGroup.add(ropeBeacon);

        // Warning sign at base of rope
        const ropeSignCanvas = document.createElement('canvas');
        ropeSignCanvas.width = 256;
        ropeSignCanvas.height = 128;
        const rctx = ropeSignCanvas.getContext('2d');
        rctx.fillStyle = '#00695c';
        rctx.fillRect(0, 0, 256, 128);
        rctx.strokeStyle = '#fff';
        rctx.lineWidth = 4;
        rctx.strokeRect(5, 5, 246, 118);
        rctx.fillStyle = '#fff';
        rctx.font = 'bold 18px monospace';
        rctx.textAlign = 'center';
        rctx.fillText('RESCUE ROPE #04', 128, 42);
        rctx.fillStyle = '#ffeb3b';
        rctx.font = 'bold 14px monospace';
        rctx.fillText('CLIMB TO UPPER LEDGE', 128, 75);
        rctx.fillText('➔ SURFACE ACCESS', 128, 102);

        const signMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1.4, 0.7),
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(ropeSignCanvas) })
        );
        signMesh.position.set(1.1, 1.2, 0);
        signMesh.rotation.y = -Math.PI / 4;
        ropeGroup.add(signMesh);

        ropeGroup.position.set(ropeX, lowerY, ropeZ);
        this.scene.add(ropeGroup);

        this.rescueRope = {
            group: ropeGroup,
            x: ropeX,
            lowerY: lowerY,
            upperY: upperY,
            z: ropeZ,
            isClimbed: false
        };
    }

    buildTracks() {
        const railMat = new THREE.MeshStandardMaterial({
            map: this.metalTexture,
            metalness: 0.8,
            roughness: 0.35,
            color: 0x777777
        });
        const tieMat = new THREE.MeshStandardMaterial({
            map: this.woodTexture,
            roughness: 0.85,
            color: 0x4a3220
        });

        const step = 1.4;
        for (let z = 10; z >= -this.tunnelLength + 10; z -= step) {
            const isSlideOrSwim = (z < -138 && z > -182);

            const x = this.getPathX(z);
            const y = this.getPathY(z);

            const nextX = this.getPathX(z - step);
            const nextY = this.getPathY(z - step);

            if (!isSlideOrSwim) {
                const tie = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.09, 0.25), tieMat);
                tie.position.set(x, y + 0.05, z);
                tie.lookAt(nextX, nextY + 0.05, z - step);
                this.scene.add(tie);

                const segLen = Math.hypot(nextX - x, nextY - y, step);

                const lr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, segLen + 0.05), railMat);
                lr.position.set((x + nextX) / 2 - 0.75, (y + nextY) / 2 + 0.09, z - step / 2);
                lr.lookAt(nextX - 0.75, nextY + 0.09, z - step);
                this.scene.add(lr);

                const rr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, segLen + 0.05), railMat);
                rr.position.set((x + nextX) / 2 + 0.75, (y + nextY) / 2 + 0.09, z - step / 2);
                rr.lookAt(nextX + 0.75, nextY + 0.09, z - step);
                this.scene.add(rr);
            }

            if (Math.abs(z % 6.5) < step && !isSlideOrSwim) {
                this.buildTimberArch(x, y, z, nextX, nextY, z - step, tieMat);
            }
        }

        // Flooded Puddles in dips
        const puddleGeo = new THREE.CircleGeometry(1.6, 20);
        puddleGeo.rotateX(-Math.PI / 2);
        const puddleMat = new THREE.MeshStandardMaterial({
            color: 0x0c0e12,
            roughness: 0.04,
            metalness: 0.85
        });

        const puddleZ = [-34, -72, -118, -215];
        puddleZ.forEach((pz, idx) => {
            const px = this.getPathX(pz) + (idx % 2 === 0 ? 0.35 : -0.35);
            const py = this.getPathY(pz) + 0.03;
            const p = new THREE.Mesh(puddleGeo, puddleMat);
            p.position.set(px, py, pz);
            p.scale.set(1.3, 1, 1.9);
            this.scene.add(p);
            this.puddles.push(p);
        });
    }

    buildTimberArch(x0, y0, z0, x1, y1, z1, woodMat) {
        const arch = new THREE.Group();
        const beamW = 3.6;
        const beamH = 2.65;
        const th = 0.28;

        const lp = new THREE.Mesh(new THREE.BoxGeometry(th, beamH, th), woodMat);
        lp.position.set(-beamW / 2, beamH / 2, 0);
        arch.add(lp);

        const rp = new THREE.Mesh(new THREE.BoxGeometry(th, beamH, th), woodMat);
        rp.position.set(beamW / 2, beamH / 2, 0);
        arch.add(rp);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(beamW + 0.3, th, th), woodMat);
        cap.position.set(0, beamH, 0);
        arch.add(cap);

        const lb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), woodMat);
        lb.position.set(-beamW / 2 + 0.28, beamH - 0.28, 0);
        lb.rotation.z = Math.PI / 4;
        arch.add(lb);

        const rb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), woodMat);
        rb.position.set(beamW / 2 - 0.28, beamH - 0.28, 0);
        rb.rotation.z = -Math.PI / 4;
        arch.add(rb);

        arch.position.set(x0, y0, z0);
        arch.lookAt(x1, y1, z1);
        this.scene.add(arch);
    }

    buildAtmosphere() {
        const dustCount = 850;
        const dustGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 5.5;
            positions[i + 1] = 0.4 + Math.random() * 2.6;
            // Spread dust along Z, keeping at least 1.5m away from player eye
            const rz = (Math.random() - 0.5) * 50;
            positions[i + 2] = Math.abs(rz) < 1.5 ? (rz < 0 ? -2.0 : 2.0) : rz;
        }

        dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Circular soft radial gradient texture to completely eliminate square point glitches!
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 64;
        pCanvas.height = 64;
        const pctx = pCanvas.getContext('2d');
        const grad = pctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 225, 140, 1.0)');
        grad.addColorStop(0.35, 'rgba(212, 175, 55, 0.55)');
        grad.addColorStop(0.7, 'rgba(160, 125, 35, 0.18)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        pctx.fillStyle = grad;
        pctx.fillRect(0, 0, 64, 64);
        const dustTexture = new THREE.CanvasTexture(pCanvas);

        const dustMat = new THREE.PointsMaterial({
            map: dustTexture,
            color: 0xffd54f,
            size: 0.048,
            transparent: true,
            opacity: 0.38,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.dustParticles = new THREE.Points(dustGeo, dustMat);
        this.scene.add(this.dustParticles);

        // Industrial utility lamps & Red Emergency Alarm Klaxons throughout the shaft (Extended to -345m)
        const lampConfigs = [
            { z: -2, type: 'amber' },       // Starting cavern entrance
            { z: -6, type: 'amber' },       // Starting drift illumination
            { z: -14, type: 'amber' },
            { z: -28, type: 'red_alarm' },
            { z: -44, type: 'amber' },
            { z: -62, type: 'red_alarm' },
            { z: -80, type: 'amber' },
            { z: -98, type: 'red_alarm' },
            { z: -116, type: 'amber' },
            { z: -130, type: 'amber' },
            { z: -134, type: 'red_alarm' }, // Right at the monolithic bedrock wall
            { z: -138, type: 'amber' },     // Detour entrance chute
            { z: -152, type: 'red_alarm' }, // Lower drainage rift
            { z: -168, type: 'amber' },     // Flooded sump basin
            { z: -184, type: 'amber' },     // Gravel shoreline
            { z: -195, type: 'red_alarm' }, // Rescue rope zone
            { z: -208, type: 'amber' },     // Emergency gear locker
            { z: -226, type: 'amber' },     // Crawlspace entrance
            { z: -246, type: 'red_alarm' }, // Crawlspace constriction
            { z: -266, type: 'amber' },     // Crawlspace exit
            { z: -285, type: 'red_alarm' }, // Granite surface barrier
            { z: -306, type: 'amber' },     // Hypoxia ascent
            { z: -326, type: 'amber' },     // Final stretch
            { z: -338, type: 'red_alarm' }  // Surface Hatch B-4
        ];

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x1f2226,
            roughness: 0.5,
            metalness: 0.8
        });

        lampConfigs.forEach((cfg, idx) => {
            const lz = cfg.z;
            const isLeft = (idx % 2 === 0);
            const sideSign = isLeft ? 1 : -1;
            const lx = this.getPathX(lz) + (sideSign * 1.55);
            const ly = this.getPathY(lz) + 2.05;

            const lampGroup = new THREE.Group();
            const isRed = (cfg.type === 'red_alarm');
            const colorHex = isRed ? 0xff2222 : 0xffb020;

            // 1. Heavy Wall Mount Baseplate & Conduit Pipe bolted into rock
            const basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.28), darkMetalMat);
            basePlate.position.set(sideSign * 0.35, 0.2, 0);
            lampGroup.add(basePlate);

            // Horizontal curved mounting arm / pipe from wall to lamp
            const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), darkMetalMat);
            arm.rotation.z = sideSign * Math.PI / 2;
            arm.position.set(sideSign * 0.15, 0.2, 0);
            lampGroup.add(arm);

            // Vertical socket
            const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8), darkMetalMat);
            socket.position.set(0, 0.15, 0);
            lampGroup.add(socket);

            // 2. Heavy Industrial Cast-Iron Lamp Cap / Hood
            const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.09, 12), darkMetalMat);
            hood.position.set(0, 0.08, 0);
            lampGroup.add(hood);

            // 3. Glowing Glass Globe (Solid, smooth, emissive - NO WIREFRAME BUG!)
            const glassMat = new THREE.MeshStandardMaterial({
                color: colorHex,
                emissive: colorHex,
                emissiveIntensity: isRed ? 1.5 : 1.1,
                roughness: 0.2,
                metalness: 0.1,
                transparent: true,
                opacity: 0.88
            });
            const globe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 12), glassMat);
            globe.position.set(0, -0.06, 0);
            lampGroup.add(globe);

            // 4. Solid Protective Steel Cage Bars (Solid thin metal struts, not wireframe)
            for (let b = 0; b < 4; b++) {
                const angle = (b * Math.PI) / 2;
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 6), darkMetalMat);
                bar.position.set(Math.cos(angle) * 0.13, -0.06, Math.sin(angle) * 0.13);
                lampGroup.add(bar);
            }
            const guardRing = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 12), darkMetalMat);
            guardRing.position.set(0, -0.19, 0);
            lampGroup.add(guardRing);

            // 5. Point Light
            const pLight = new THREE.PointLight(colorHex, isRed ? 1.6 : 1.1, isRed ? 15 : 12, 2);
            pLight.position.set(0, -0.08, 0);
            lampGroup.add(pLight);

            lampGroup.position.set(lx, ly, lz);
            this.scene.add(lampGroup);

            this.emergencyLights.push({
                group: lampGroup,
                light: pLight,
                type: cfg.type,
                baseIntensity: isRed ? 1.6 : 1.1,
                flickerSeed: Math.random() * 100
            });
        });

        this.buildSigns();
    }

    buildSigns() {
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 256;
        signCanvas.height = 128;
        const sctx = signCanvas.getContext('2d');

        sctx.fillStyle = '#b71c1c';
        sctx.fillRect(0, 0, 256, 128);
        sctx.lineWidth = 6;
        sctx.strokeStyle = '#ffffff';
        sctx.strokeRect(6, 6, 244, 116);

        sctx.fillStyle = '#ffffff';
        sctx.font = 'bold 22px monospace';
        sctx.textAlign = 'center';
        sctx.fillText('SHAFT 07 // B-4', 128, 42);
        sctx.font = 'bold 17px monospace';
        sctx.fillText('SURFACE EXIT ➔', 128, 80);
        sctx.font = '12px monospace';
        sctx.fillText('DEPTH: 780m TO 0m', 128, 106);

        const signTex = new THREE.CanvasTexture(signCanvas);
        const signGeo = new THREE.PlaneGeometry(1.6, 0.8);
        const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 });

        const s1 = new THREE.Mesh(signGeo, signMat);
        const z1 = -16;
        s1.position.set(this.getPathX(z1) + 2.1, this.getPathY(z1) + 1.9, z1);
        s1.rotation.y = -Math.PI / 2;
        this.scene.add(s1);
    }

    buildGearCrate() {
        // Abandoned Foreman's Emergency Rescue Gear Locker at Upper Canyon Ledge (z = -208)
        const z = -208;
        const x = this.getPathX(z) + 1.2;
        const y = this.getPathY(z);

        const group = new THREE.Group();

        // Heavy industrial high-visibility yellow reinforced equipment chest
        const chestMat = new THREE.MeshStandardMaterial({
            color: 0xfbc02d,
            roughness: 0.45,
            metalness: 0.5
        });
        const chest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.7), chestMat);
        chest.position.set(0, 0.35, 0);
        group.add(chest);

        // Black corner protectors
        const cornerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        for (let dx of [-0.58, 0.58]) {
            for (let dy of [0.05, 0.65]) {
                const corner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.72), cornerMat);
                corner.position.set(dx, dy, 0);
                group.add(corner);
            }
        }

        // Heavy Carbide Crowbar lying on top of chest
        const barMat = new THREE.MeshStandardMaterial({
            color: 0x37474f,
            metalness: 0.9,
            roughness: 0.25
        });
        const crowbar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 8), barMat);
        crowbar.rotation.z = Math.PI / 4;
        crowbar.position.set(0, 0.76, 0);
        group.add(crowbar);

        // Glowing locator light
        const crateBeacon = new THREE.PointLight(0xffd54f, 1.2, 7.0, 2);
        crateBeacon.position.set(0, 1.0, 0);
        group.add(crateBeacon);

        // Stencil sign canvas
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EMERGENCY GEAR', 128, 45);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('CARBIDE CROWBAR', 128, 78);
        ctx.fillText('SHAFT 07 RESCUE', 128, 105);

        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.45),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
        );
        sign.position.set(0, 0.38, 0.36);
        group.add(sign);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.gearCrate = {
            group: group,
            crowbar: crowbar,
            x: x,
            y: y,
            z: z,
            beacon: crateBeacon,
            retrieved: false
        };
    }

    buildInteractables() {
        // 1. RUBBLE OBSTACLES - CLEAN SOLID LOW-POLY BOULDERS (Zero spiky glitch anomaly!)
        const rubbleConfigs = [
            { id: 1, z: -52, health: 2, name: "Schist Rock Cave-in (Upper Shaft)", isBedrock: false },
            { id: 2, z: -134, health: 999, name: "Monolithic Ironstone Intrusion (Shaft 07 Main Drift)", isBedrock: true },
            { id: 3, z: -285, health: 2, name: "Granite Surface Gate Barrier", requiresCrowbar: true }
        ];

        rubbleConfigs.forEach(cfg => {
            const rx = cfg.isBedrock ? (this.getPathX(cfg.z) + 0.6) : this.getPathX(cfg.z);
            const ry = this.getPathY(cfg.z);
            const group = new THREE.Group();

            const rockMat = new THREE.MeshStandardMaterial({
                map: this.rockTexture,
                roughness: 0.90,
                metalness: 0.1,
                color: cfg.isBedrock ? 0x2e2b26 : 0x4e4a44
            });

            // Realistic solid low-poly boulders
            const rockCount = cfg.isBedrock ? 28 : 18;
            for (let i = 0; i < rockCount; i++) {
                const s = 0.7 + (i % 5) * 0.24 + (cfg.isBedrock ? 0.35 : 0);
                const rGeo = new THREE.DodecahedronGeometry(s, 0);
                const rockMesh = new THREE.Mesh(rGeo, rockMat);

                const ox = ((i % 5) - 2) * 0.9 + (Math.sin(i) * 0.4);
                const oy = Math.floor(i / 5) * 0.85 + 0.3;
                const oz = ((i % 3) - 1) * 0.7;

                rockMesh.position.set(ox, oy, oz);
                rockMesh.rotation.set(i * 0.5, i * 0.8, i * 0.3);
                rockMesh.castShadow = true;
                group.add(rockMesh);
            }

            group.position.set(rx, ry, cfg.z);
            this.scene.add(group);

            this.rubbleObjects.push({
                id: cfg.id,
                name: cfg.name,
                z: cfg.z,
                x: rx,
                y: ry,
                isBedrock: cfg.isBedrock === true,
                requiresCrowbar: cfg.requiresCrowbar === true,
                maxHealth: cfg.health,
                currentHealth: cfg.health,
                cleared: false,
                group: group
            });
        });

        // 2. FALLEN MINER CORPSES
        const corpseConfigs = [
            { id: 1, z: -26, xOff: 1.4, name: "Tomas", role: "Shift Supervisor", o2Bonus: 35, note: "Emergency O2 cylinder has 35% capacity left. Badge reads: 'Tomas - Father of two'." },
            { id: 2, z: -95, xOff: -1.4, name: "Erik", role: "Driller", o2Bonus: 40, note: "Military high-pressure O2 canister (+40%). A photo of his family is tucked in his pocket." }
        ];

        corpseConfigs.forEach(cfg => {
            const cx = this.getPathX(cfg.z) + cfg.xOff;
            const cy = this.getPathY(cfg.z);
            const cGroup = new THREE.Group();

            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d434d, roughness: 0.9 });
            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.9), bodyMat);
            torso.position.set(0, 0.15, 0);
            cGroup.add(torso);

            const legMat = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.9 });
            const legs = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.95), legMat);
            legs.position.set(0, 0.11, 0.85);
            cGroup.add(legs);

            const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.4, metalness: 0.2 });
            const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), helmetMat);
            helmet.position.set(0.42, 0.18, -0.6);
            helmet.scale.set(1, 0.75, 1.1);
            cGroup.add(helmet);

            const tankMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.7, roughness: 0.3 });
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 10), tankMat);
            tank.rotation.z = Math.PI / 2;
            tank.position.set(-0.45, 0.1, 0.1);
            cGroup.add(tank);

            const valveLight = new THREE.PointLight(0x4caf50, 0.5, 3.5, 2);
            valveLight.position.set(-0.45, 0.22, 0.1);
            cGroup.add(valveLight);

            cGroup.position.set(cx, cy, cfg.z);
            cGroup.rotation.y = (Math.random() - 0.5) * 0.6;
            this.scene.add(cGroup);

            this.corpseObjects.push({
                id: cfg.id,
                name: cfg.name,
                role: cfg.role,
                note: cfg.note,
                o2Bonus: cfg.o2Bonus,
                looted: false,
                group: cGroup,
                valveLight: valveLight,
                pos: new THREE.Vector3(cx, cy, cfg.z)
            });
        });

        // 3. FINAL ESCAPE HATCH (Surface Access Shaft B-4 at z = -340)
        this.buildEscapeHatch(-340);
    }

    buildEscapeHatch(z) {
        const hx = this.getPathX(z);
        const hy = this.getPathY(z);
        const hGroup = new THREE.Group();

        const wallMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.85,
            color: 0x333333
        });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 1.8), wallMat);
        wall.position.set(0, 2.5, 0);
        hGroup.add(wall);

        const hatchMat = new THREE.MeshStandardMaterial({
            map: this.metalTexture,
            color: 0xd32f2f,
            roughness: 0.35,
            metalness: 0.85
        });

        const door = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 24), hatchMat);
        door.rotateX(Math.PI / 2);
        door.position.set(0, 2.0, 0.65);
        hGroup.add(door);

        const wheelMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, metalness: 0.6, roughness: 0.4 });
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 10, 24), wheelMat);
        wheel.position.set(0, 2.0, 0.85);
        hGroup.add(wheel);

        const strobeLight = new THREE.PointLight(0x00e676, 2.2, 18, 2);
        strobeLight.position.set(0, 3.8, 1.0);
        hGroup.add(strobeLight);

        // Radiant morning sun rays streaming through surface hatch seams
        const sunRayGeo = new THREE.CylinderGeometry(0.4, 2.4, 12, 16, 1, true);
        sunRayGeo.rotateX(Math.PI / 2);
        const sunRayMat = new THREE.MeshBasicMaterial({
            color: 0xffe57f,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const sunRay = new THREE.Mesh(sunRayGeo, sunRayMat);
        sunRay.position.set(0, 2.0, 5.5);
        hGroup.add(sunRay);

        const sunLight = new THREE.SpotLight(0xfff8e1, 7.5, 35, Math.PI / 3.5, 0.5, 1.2);
        sunLight.position.set(0, 2.2, 0.8);
        const sunTarget = new THREE.Object3D();
        sunTarget.position.set(0, 1.6, 15.0);
        hGroup.add(sunLight);
        hGroup.add(sunTarget);
        sunLight.target = sunTarget;

        const ladderMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
        for (let y = 0.5; y < 4.4; y += 0.45) {
            const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), ladderMat);
            rung.rotateZ(Math.PI / 2);
            rung.position.set(2.2, y, 0.7);
            hGroup.add(rung);
        }

        hGroup.position.set(hx, hy, z);
        this.scene.add(hGroup);

        this.escapeHatch = {
            group: hGroup,
            wheel: wheel,
            light: strobeLight,
            x: hx,
            y: hy,
            z: z,
            isOpening: false
        };
    }

    buildHallucination() {
        const hGroup = new THREE.Group();

        const goldMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), goldMat);
        head.position.set(0, 1.35, 0);
        hGroup.add(head);

        const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), goldMat);
        p1.position.set(-0.28, 1.45, -0.05);
        hGroup.add(p1);
        const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), goldMat);
        p2.position.set(0.28, 1.45, -0.05);
        hGroup.add(p2);

        const dress = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 16), goldMat);
        dress.position.set(0, 0.75, 0);
        hGroup.add(dress);

        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.48, 8), goldMat);
        arm.position.set(0.38, 1.05, 0);
        arm.rotation.z = -Math.PI / 3;
        hGroup.add(arm);

        const lilyLight = new THREE.PointLight(0xffea00, 0, 16, 2);
        lilyLight.position.set(0, 1.2, 0);
        hGroup.add(lilyLight);

        // Shimmering golden dust sparkles halo around Lily
        const sparkGeo = new THREE.BufferGeometry();
        const sparkPos = [];
        for (let i = 0; i < 48; i++) {
            sparkPos.push(
                (Math.random() - 0.5) * 1.5,
                Math.random() * 1.9,
                (Math.random() - 0.5) * 1.5
            );
        }
        sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(sparkPos, 3));
        const sparkMat = new THREE.PointsMaterial({
            color: 0xfff59d,
            size: 0.14,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const sparks = new THREE.Points(sparkGeo, sparkMat);
        hGroup.add(sparks);

        hGroup.position.set(0, 0, -40);
        this.scene.add(hGroup);

        this.hallucination = {
            group: hGroup,
            materials: [goldMat, sparkMat],
            light: lilyLight,
            arm: arm,
            active: false,
            dissolving: false,
            boostGiven: false,
            cooldown: 0,
            time: 0
        };
    }

    update(delta, playerPos, oxygen) {
        if (this.dustParticles && playerPos) {
            this.dustParticles.position.set(playerPos.x, playerPos.y, playerPos.z);
            const posAttr = this.dustParticles.geometry.attributes.position;
            for (let i = 0; i < posAttr.count * 3; i += 3) {
                posAttr.array[i + 1] += Math.sin(Date.now() * 0.0015 + i) * 0.003;
                if (posAttr.array[i + 1] > 3.2) posAttr.array[i + 1] = 0.2;
                if (posAttr.array[i + 1] < 0) posAttr.array[i + 1] = 3.0;

                // Keep particles at least 1.5m away from player eye in Z so they NEVER expand into huge squares
                const pz = posAttr.array[i + 2];
                if (Math.abs(pz) < 1.5) {
                    posAttr.array[i + 2] = (Math.random() < 0.5 ? -1 : 1) * (2.2 + Math.random() * 24.0);
                }
            }
            posAttr.needsUpdate = true;
        }

        // Animate underwater bubbles
        if (this.bubbleParticles) {
            const bAttr = this.bubbleParticles.geometry.attributes.position;
            for (let i = 1; i < bAttr.count * 3; i += 3) {
                bAttr.array[i] += delta * 1.5;
                if (bAttr.array[i] > 4.2) {
                    bAttr.array[i] = 0.8;
                }
            }
            bAttr.needsUpdate = true;
        }

        const time = Date.now() * 0.005;
        const isTremor = window.eventManager && window.eventManager.isEarthquakeShaking;

        this.emergencyLights.forEach(lamp => {
            if (isTremor) {
                // Violent electrical brownout & surge glitching during tremors
                const glitch = Math.random() < 0.35 ? 0.04 : (Math.random() < 0.2 ? 2.5 : lamp.baseIntensity * 0.5);
                lamp.light.intensity = glitch;
                if (Math.random() < 0.035 && window.soundEngine) {
                    window.soundEngine.playElectricalGlitch();
                }
            } else if (lamp.type === 'red_alarm') {
                // Pulsating industrial red emergency alarm beacon
                const pulse = Math.sin(time * 4.0 + lamp.flickerSeed);
                const strobe = pulse > 0.2 ? 1.65 : 0.22;
                lamp.light.intensity = strobe;
            } else {
                // Warm tungsten filament hum and subtle flicker
                const flicker = Math.sin(time + lamp.flickerSeed) * Math.cos(time * 2.3 + lamp.flickerSeed);
                lamp.light.intensity = Math.max(0.15, lamp.baseIntensity + flicker * 0.25);
            }
        });

        this.rubbleObjects.forEach(r => {
            if (!r.cleared && r.marker) {
                r.marker.rotation.y += delta * 2.2;
                r.marker.rotation.x += delta * 1.1;
            }
        });

        if (this.escapeHatch && this.escapeHatch.isOpening) {
            this.escapeHatch.wheel.rotation.z += delta * 4.0;
        }

        this.updateHallucination(delta, playerPos, oxygen);
    }

    updateHallucination(delta, playerPos, oxygen) {
        if (!this.hallucination || !playerPos) return;
        const h = this.hallucination;
        h.time += delta;
        if (h.cooldown > 0) {
            h.cooldown -= delta;
        }

        if (h.arm) {
            h.arm.rotation.z = -Math.PI / 3 + Math.sin(h.time * 6) * 0.35;
        }

        // Dedicated Waterlogged Golden Lily Scene in flooded cavern (Senter Mati Total)
        if (h.isWaterScene && h.active) {
            h.materials.forEach(m => m.opacity = 0.95);
            // Ethereal golden beacon illumination in pitch darkness
            h.light.intensity = 3.4 + Math.sin(h.time * 3.2) * 0.45;
            const baseY = this.getPathY(h.group.position.z);
            h.group.position.y = baseY + 1.1 + Math.sin(h.time * 2.2) * 0.12;

            const horizDist = Math.hypot(playerPos.x - h.group.position.x, playerPos.z - h.group.position.z);
            // Touching / colliding with golden Lily in water boosts oxygen!
            if (horizDist < 3.5) {
                this.dissolveHallucination(true);
            } else if (horizDist < 5.0 || playerPos.z <= -176) {
                this.dissolveHallucination(false);
            }
            return;
        }

        // Spawn golden Lily apparition:
        // 1. In final desperate stretch (z between -275 and -324) to guide player and provide vital breath!
        // 2. Or whenever oxygen drops critically low (< 38%)
        const inFinalStretch = (playerPos.z <= -275 && playerPos.z >= -324);
        const shouldSpawnLily = (inFinalStretch || oxygen < 38);

        if (shouldSpawnLily && !h.active && !h.dissolving && (h.cooldown || 0) <= 0) {
            const spawnOffset = inFinalStretch ? 16 : 22;
            const spawnZ = Math.max(-324, playerPos.z - spawnOffset);
            const spawnX = this.getPathX(spawnZ);
            const spawnY = this.getPathY(spawnZ) + 0.2;
            h.group.position.set(spawnX, spawnY, spawnZ);
            h.active = true;
            h.boostGiven = false;
            h.materials.forEach(m => m.opacity = 0.1);
            h.light.intensity = 0.2;
            h.time = 0;
            if (window.soundEngine) window.soundEngine.playLilyWhisper();
        }

        if (h.active) {
            h.materials.forEach(m => {
                m.opacity = Math.min(0.92, m.opacity + delta * 1.5);
            });
            h.light.intensity = Math.min(2.8, h.light.intensity + delta * 3.0);

            const baseY = this.getPathY(h.group.position.z);
            h.group.position.y = baseY + 0.2 + Math.sin(h.time * 2.8) * 0.15;

            const horizDist = Math.hypot(playerPos.x - h.group.position.x, playerPos.z - h.group.position.z);
            // Player collides with / reaches Lily's golden apparition ("menabrak tanda mas anaknya")
            if (horizDist < 3.5) {
                this.dissolveHallucination(true);
            } else if (playerPos.z < h.group.position.z - 4.0) {
                this.dissolveHallucination(false);
            }
        } else if (h.dissolving) {
            h.materials.forEach(m => {
                m.opacity = Math.max(0, m.opacity - delta * 2.5);
            });
            h.light.intensity = Math.max(0, h.light.intensity - delta * 4.0);
            h.group.position.y += delta * 1.2;
            if (h.materials[0].opacity <= 0) {
                h.dissolving = false;
                h.active = false;
                h.isWaterScene = false;
                h.cooldown = 16.0; // Cooldown before next apparition
            }
        } else {
            h.materials.forEach(m => m.opacity = 0);
            h.light.intensity = 0;
        }
    }

    // Visually illuminate and expose the left-wall fissure when pickaxe shatters
    revealChuteOpening() {
        if (this.chuteRevealed) return;
        this.chuteRevealed = true;

        if (this.chuteBeacon) {
            this.chuteBeacon.intensity = 4.8;
            this.chuteBeacon.color.setHex(0xffca28);
        }
        if (this.chuteInteriorLight) {
            this.chuteInteriorLight.intensity = 5.5;
            this.chuteInteriorLight.color.setHex(0xffd54f);
        }

        // Add prominent illuminated holographic chevron banner at the opening
        if (this.chuteArchGroup) {
            const flareCanvas = document.createElement('canvas');
            flareCanvas.width = 512;
            flareCanvas.height = 128;
            const fctx = flareCanvas.getContext('2d');
            fctx.fillStyle = '#ff9800';
            fctx.fillRect(0, 0, 512, 128);
            fctx.fillStyle = '#000';
            fctx.font = 'bold 32px monospace';
            fctx.textAlign = 'center';
            fctx.fillText('◄◄ BYPASS OPEN // DRAINAGE CHUTE ◄◄', 256, 75);

            const flareTex = new THREE.CanvasTexture(flareCanvas);
            const flareBanner = new THREE.Mesh(
                new THREE.PlaneGeometry(2.6, 0.65),
                new THREE.MeshBasicMaterial({ map: flareTex, transparent: true, opacity: 0.95 })
            );
            flareBanner.position.set(0, 0.95, 0.35);
            this.chuteArchGroup.add(flareBanner);
        }

        // Shower of falling rock chips breaking from the left wall
        const chipGeo = new THREE.DodecahedronGeometry(0.18, 0);
        const chipMat = new THREE.MeshStandardMaterial({ map: this.rockTexture, color: 0x444444 });
        for (let i = 0; i < 14; i++) {
            const chip = new THREE.Mesh(chipGeo, chipMat);
            const cx = this.getPathX(-131) - 1.2 - Math.random() * 1.5;
            const cy = this.getPathY(-131) + 2.2 + Math.random() * 0.8;
            const cz = -131 + (Math.random() - 0.5) * 2.5;
            chip.position.set(cx, cy, cz);
            this.scene.add(chip);

            let vy = -(0.5 + Math.random() * 2.0);
            const interval = setInterval(() => {
                chip.position.y += vy * 0.03;
                chip.rotation.x += 0.12;
                chip.rotation.z += 0.15;
                if (chip.position.y <= this.getPathY(cz) + 0.1) {
                    clearInterval(interval);
                }
            }, 30);
        }
    }

    // Spawn falling boulders crashing down during the final climax earthquake
    spawnClimaxFallingBoulders(playerPos) {
        if (!playerPos) return;
        const boulderCount = 10;
        const bMat = new THREE.MeshStandardMaterial({ map: this.rockTexture, roughness: 0.9, color: 0x3a3630 });

        for (let i = 0; i < boulderCount; i++) {
            const size = 0.5 + Math.random() * 0.6;
            const bGeo = new THREE.DodecahedronGeometry(size, 0);
            const bMesh = new THREE.Mesh(bGeo, bMat);

            const ox = (Math.random() - 0.5) * 2.2;
            const oz = (Math.random() - 0.5) * 3.5;
            const startY = playerPos.y + 4.5 + i * 0.4;

            bMesh.position.set(playerPos.x + ox, startY, playerPos.z + oz);
            bMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            this.scene.add(bMesh);

            let vy = 0;
            const fallTimer = setInterval(() => {
                vy -= 0.65;
                bMesh.position.y += vy * 0.03;
                bMesh.rotation.x += 0.1;
                bMesh.rotation.y += 0.15;

                const ground = this.getPathY(bMesh.position.z);
                if (bMesh.position.y <= ground + size * 0.7) {
                    clearInterval(fallTimer);
                    bMesh.position.y = ground + size * 0.5;
                }
            }, 25);
        }
    }

    spawnWaterLilyScene() {
        if (!this.hallucination) return;
        const h = this.hallucination;
        const lz = -172;
        const lx = this.getPathX(lz);
        const ly = this.getPathY(lz) + 1.25;

        h.group.position.set(lx, ly, lz);
        h.active = true;
        h.isWaterScene = true;
        h.dissolving = false;
        h.boostGiven = false;
        h.time = 0;
        h.materials.forEach(m => m.opacity = 0.95);

        // The ONLY light in the flooded cavern: Lily's warm golden aura
        h.light.color.setHex(0xffea00);
        h.light.intensity = 3.6;
        h.light.distance = 28;

        if (window.soundEngine) window.soundEngine.playLilyWhisper();
    }

    dissolveHallucination(boostOxygen = false) {
        if (!this.hallucination) return;
        const h = this.hallucination;
        if (!h.active) return;
        h.active = false;
        h.dissolving = true;

        if (boostOxygen && !h.boostGiven && window.gamePlayer) {
            h.boostGiven = true;
            const boostAmount = 14.0; // Sedikit menaikkan oksigen tapi bermakna (+14%)
            window.gamePlayer.oxygen = Math.min(100.0, window.gamePlayer.oxygen + boostAmount);
            if (window.soundEngine) {
                window.soundEngine.playRaggedBreath();
                window.soundEngine.playLilyWhisper();
            }
            if (window.eventManager) {
                window.eventManager.showNotification("✨ LILY'S GOLDEN PRESENCE RESTORES VITAL OXYGEN (+14% O₂)");
            }
        } else {
            if (window.soundEngine) window.soundEngine.playLilyWhisper();
        }
    }

    removeRubble(rubbleId) {
        const rubble = this.rubbleObjects.find(r => r.id === rubbleId);
        if (!rubble) return;
        rubble.cleared = true;

        let progress = 0;
        const sinkInterval = setInterval(() => {
            progress += 0.08;
            rubble.group.position.y -= 0.22;
            rubble.group.scale.multiplyScalar(0.92);
            if (progress >= 1.0) {
                clearInterval(sinkInterval);
                this.scene.remove(rubble.group);
            }
        }, 25);
    }

    retrieveCrowbar() {
        if (!this.gearCrate || this.gearCrate.retrieved) return;
        this.gearCrate.retrieved = true;
        if (this.gearCrate.crowbar) {
            this.gearCrate.group.remove(this.gearCrate.crowbar);
        }
        if (this.gearCrate.beacon) {
            this.gearCrate.beacon.intensity = 0.2;
        }
    }

    // Visually illuminate and expose the left-wall fissure when pickaxe shatters
    revealChuteOpening() {
        if (this.chuteRevealed) return;
        this.chuteRevealed = true;

        if (this.chuteBeacon) {
            this.chuteBeacon.intensity = 4.8;
            this.chuteBeacon.color.setHex(0xffca28);
        }
        if (this.chuteInteriorLight) {
            this.chuteInteriorLight.intensity = 5.5;
            this.chuteInteriorLight.color.setHex(0xffd54f);
        }

        // Add prominent illuminated holographic chevron banner at the opening
        if (this.chuteArchGroup) {
            const flareCanvas = document.createElement('canvas');
            flareCanvas.width = 512;
            flareCanvas.height = 128;
            const fctx = flareCanvas.getContext('2d');
            fctx.fillStyle = '#ff9800';
            fctx.fillRect(0, 0, 512, 128);
            fctx.fillStyle = '#000';
            fctx.font = 'bold 32px monospace';
            fctx.textAlign = 'center';
            fctx.fillText('◄◄ BYPASS OPEN // DRAINAGE CHUTE ◄◄', 256, 75);

            const flareTex = new THREE.CanvasTexture(flareCanvas);
            const flareBanner = new THREE.Mesh(
                new THREE.PlaneGeometry(2.6, 0.65),
                new THREE.MeshBasicMaterial({ map: flareTex, transparent: true, opacity: 0.95 })
            );
            flareBanner.position.set(0, 0.95, 0.35);
            this.chuteArchGroup.add(flareBanner);
        }

        // Shower of falling rock chips breaking from the left wall
        const chipGeo = new THREE.DodecahedronGeometry(0.18, 0);
        const chipMat = new THREE.MeshStandardMaterial({ map: this.rockTexture, color: 0x444444 });
        for (let i = 0; i < 14; i++) {
            const chip = new THREE.Mesh(chipGeo, chipMat);
            const cx = this.getPathX(-131) - 1.2 - Math.random() * 1.5;
            const cy = this.getPathY(-131) + 2.2 + Math.random() * 0.8;
            const cz = -131 + (Math.random() - 0.5) * 2.5;
            chip.position.set(cx, cy, cz);
            this.scene.add(chip);

            let vy = -(0.5 + Math.random() * 2.0);
            const interval = setInterval(() => {
                chip.position.y += vy * 0.03;
                chip.rotation.x += 0.12;
                chip.rotation.z += 0.15;
                if (chip.position.y <= this.getPathY(cz) + 0.1) {
                    clearInterval(interval);
                }
            }, 30);
        }
    }

    // Spawn falling boulders crashing down during the final climax earthquake
    spawnClimaxFallingBoulders(playerPos) {
        if (!playerPos) return;
        const boulderCount = 10;
        const bMat = new THREE.MeshStandardMaterial({ map: this.rockTexture, roughness: 0.9, color: 0x3a3630 });

        for (let i = 0; i < boulderCount; i++) {
            const size = 0.5 + Math.random() * 0.6;
            const bGeo = new THREE.DodecahedronGeometry(size, 0);
            const bMesh = new THREE.Mesh(bGeo, bMat);

            const ox = (Math.random() - 0.5) * 2.2;
            const oz = (Math.random() - 0.5) * 3.5;
            const startY = playerPos.y + 4.5 + i * 0.4;

            bMesh.position.set(playerPos.x + ox, startY, playerPos.z + oz);
            bMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            this.scene.add(bMesh);

            let vy = 0;
            const fallTimer = setInterval(() => {
                vy -= 0.65;
                bMesh.position.y += vy * 0.03;
                bMesh.rotation.x += 0.1;
                bMesh.rotation.y += 0.15;

                const ground = this.getPathY(bMesh.position.z);
                if (bMesh.position.y <= ground + size * 0.7) {
                    clearInterval(fallTimer);
                    bMesh.position.y = ground + size * 0.5;
                }
            }, 25);
        }
    }
}

window.MineWorld = MineWorld;
