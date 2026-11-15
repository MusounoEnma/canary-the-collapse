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

        this.tunnelLength = 280;

        this.initTextures();
        this.buildSeamlessCavern();
        this.buildAtmosphere();
        this.buildInteractables();
        this.buildRescueRope();
        this.buildGearCrate();
        this.buildHallucination();
    }

    // -------------------------------------------------------------
    // EXTREME CURVE & ELEVATION FORMULAS
    // -------------------------------------------------------------
    getPathX(z) {
        if (z > -134) {
            return Math.sin(z * 0.045) * 5.8 + Math.sin(z * 0.02) * 3.4;
        } else if (z > -178) {
            // Curves through the detour bypass chute into flooded rift
            const startX = Math.sin(-134 * 0.045) * 5.8 + Math.sin(-134 * 0.02) * 3.4;
            const t = (z - (-134)) / (-44);
            return startX - Math.sin(t * Math.PI) * 4.8;
        } else {
            // Ascending final canyon shaft towards surface
            return Math.cos(z * 0.035) * 5.2 + Math.sin(z * 0.012) * 2.5;
        }
    }

    getPathY(z) {
        if (z > -134) {
            const climb = (-z / 140) * 9.5;
            const dips = Math.sin(z * 0.08) * 2.2 + Math.cos(z * 0.04) * 1.5;
            return climb + dips;
        } else if (z > -180) {
            // Detour chute plunge into flooded swimming sump basin
            const t = (-z - 134) / 46;
            return 8.2 - (t * 6.5) - Math.sin(t * Math.PI) * 1.2;
        } else {
            // Upper cliff ledge after rope climb: ascends up to +28m at surface hatch
            const t = (-z - 180) / 82;
            const ascent = 9.8 + t * 18.0;
            const ruggedness = Math.sin(z * 0.07) * 1.2;
            return ascent + ruggedness;
        }
    }

    initTextures() {
        const rockCanvas = document.createElement('canvas');
        rockCanvas.width = 512;
        rockCanvas.height = 512;
        const rctx = rockCanvas.getContext('2d');

        // Dark gritty charcoal slate base
        rctx.fillStyle = '#171411';
        rctx.fillRect(0, 0, 512, 512);

        for (let y = 0; y < 512; y += 3) {
            const noise = Math.sin(y * 0.06) * 14 + Math.random() * 20;
            const lum = 22 + Math.floor(noise * 0.7);
            const r = lum + Math.floor(Math.random() * 8);
            const g = lum + Math.floor(Math.random() * 5);
            const b = lum - 3;
            rctx.fillStyle = `rgb(${r},${g},${b})`;
            rctx.fillRect(0, y, 512, 2 + Math.random() * 3);
        }

        for (let i = 0; i < 30; i++) {
            rctx.strokeStyle = i % 2 === 0 ? 'rgba(6, 5, 4, 0.95)' : 'rgba(70, 50, 35, 0.45)';
            rctx.lineWidth = 2 + Math.random() * 4;
            rctx.beginPath();
            let curX = 0;
            let curY = Math.random() * 512;
            rctx.moveTo(curX, curY);
            while (curX < 512) {
                curX += 18 + Math.random() * 32;
                curY += (Math.random() - 0.5) * 40;
                rctx.lineTo(curX, curY);
            }
            rctx.stroke();
        }

        for (let k = 0; k < 4500; k++) {
            const px = Math.random() * 512;
            const py = Math.random() * 512;
            const lum = Math.floor(14 + Math.random() * 32);
            rctx.fillStyle = `rgb(${lum + 8},${lum + 4},${lum})`;
            rctx.fillRect(px, py, 2 + Math.random() * 2, 2 + Math.random() * 2);
        }

        this.rockTexture = new THREE.CanvasTexture(rockCanvas);
        this.rockTexture.wrapS = THREE.RepeatWrapping;
        this.rockTexture.wrapT = THREE.RepeatWrapping;
        this.rockTexture.repeat.set(5, 50);

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
            points.push(new THREE.Vector3(this.getPathX(z), this.getPathY(z) + 1.8, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        this.cavernCurve = curve;

        const tubularSegments = 300;
        const radius = 3.75;
        const radialSegments = 16;
        const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

        // Smooth natural rock bump (Zero spikes)
        const posAttr = tubeGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const vz = posAttr.getZ(i);

            const bump = (Math.sin(vx * 1.8) * Math.cos(vy * 2.0) * Math.sin(vz * 1.4)) * 0.22;
            posAttr.setX(i, vx + bump);
            posAttr.setY(i, vy + bump);
        }
        tubeGeo.computeVertexNormals();

        const cavernMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.94,
            metalness: 0.08,
            side: THREE.BackSide
        });

        const cavernMesh = new THREE.Mesh(tubeGeo, cavernMat);
        cavernMesh.receiveShadow = true;
        this.scene.add(cavernMesh);

        this.buildTracks();
        this.buildSubmergedWaterVolume();
    }

    // Submerged Flooded Tunnel Stage (Swimming section: z=-160 to -178)
    buildSubmergedWaterVolume() {
        // Deep murky water plane covering the swimming basin
        const waterGeo = new THREE.PlaneGeometry(7.0, 22.0, 10, 20);
        waterGeo.rotateX(-Math.PI / 2);

        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x0a2228,
            roughness: 0.08,
            metalness: 0.85,
            transparent: true,
            opacity: 0.82
        });

        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        // Positioned at swimming basin elevation
        const midZ = -169;
        waterMesh.position.set(this.getPathX(midZ), this.getPathY(midZ) + 1.25, midZ);
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

    // Vertical Rescue Climbing Rope at Cliff Ledge (z = -180)
    buildRescueRope() {
        const ropeZ = -180;
        const ropeX = this.getPathX(ropeZ);
        const lowerY = this.getPathY(ropeZ);
        const upperY = lowerY + 7.5; // 7.5 meters climb to upper ledge!

        const ropeGroup = new THREE.Group();

        // Thick braided hemp rescue rope (Cylinder)
        const ropeMat = new THREE.MeshStandardMaterial({
            color: 0x8d6e63,
            roughness: 0.9,
            metalness: 0.1
        });
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 7.8, 8), ropeMat);
        rope.position.set(0, 3.9, 0);
        ropeGroup.add(rope);

        // Rope climbing knots / grip rungs every 0.8m
        const knotMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        for (let y = 0.5; y < 7.5; y += 0.75) {
            const knot = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 12), knotMat);
            knot.rotation.x = Math.PI / 2;
            knot.position.set(0, y, 0);
            ropeGroup.add(knot);
        }

        // Heavy steel anchor bolt & carabiner in ceiling
        const anchorMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.8 });
        const anchor = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 16), anchorMat);
        anchor.position.set(0, 7.8, 0);
        ropeGroup.add(anchor);

        // Emergency beacon pulsing at the top of the rope
        const ropeBeacon = new THREE.PointLight(0xffb300, 1.2, 10, 2);
        ropeBeacon.position.set(0, 7.6, 0.5);
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
        signMesh.position.set(1.4, 2.0, 0);
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
        const beamW = 5.2;
        const beamH = 3.3;
        const th = 0.32;

        const lp = new THREE.Mesh(new THREE.BoxGeometry(th, beamH, th), woodMat);
        lp.position.set(-beamW / 2, beamH / 2, 0);
        arch.add(lp);

        const rp = new THREE.Mesh(new THREE.BoxGeometry(th, beamH, th), woodMat);
        rp.position.set(beamW / 2, beamH / 2, 0);
        arch.add(rp);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(beamW + 0.4, th, th), woodMat);
        cap.position.set(0, beamH, 0);
        arch.add(cap);

        const lb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), woodMat);
        lb.position.set(-beamW / 2 + 0.35, beamH - 0.35, 0);
        lb.rotation.z = Math.PI / 4;
        arch.add(lb);

        const rb = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.2), woodMat);
        rb.position.set(beamW / 2 - 0.35, beamH - 0.35, 0);
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
            positions[i] = (Math.random() - 0.5) * 8;
            positions[i + 1] = Math.random() * 3.6;
            positions[i + 2] = (Math.random() - 0.5) * 60;
        }

        dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const dustMat = new THREE.PointsMaterial({
            color: 0xd4af37,
            size: 0.065,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending
        });

        this.dustParticles = new THREE.Points(dustGeo, dustMat);
        this.scene.add(this.dustParticles);

        // Industrial utility lamps & Red Emergency Alarm Klaxons throughout the shaft
        const lampConfigs = [
            { z: -12, type: 'amber' },
            { z: -25, type: 'red_alarm' },
            { z: -42, type: 'amber' },
            { z: -60, type: 'red_alarm' },
            { z: -78, type: 'amber' },
            { z: -96, type: 'red_alarm' },
            { z: -114, type: 'amber' },
            { z: -130, type: 'amber' },
            { z: -134, type: 'red_alarm' }, // Right at the monolithic bedrock wall
            { z: -138, type: 'amber' },     // Detour entrance chute
            { z: -152, type: 'red_alarm' }, // Lower drainage rift
            { z: -165, type: 'amber' },
            { z: -176, type: 'red_alarm' }, // Rescue rope zone
            { z: -192, type: 'amber' },
            { z: -208, type: 'red_alarm' },
            { z: -224, type: 'amber' },
            { z: -242, type: 'red_alarm' },
            { z: -258, type: 'amber' }
        ];

        lampConfigs.forEach((cfg, idx) => {
            const lz = cfg.z;
            const lx = this.getPathX(lz) + (idx % 2 === 0 ? 1.75 : -1.75);
            const ly = this.getPathY(lz) + 2.7;

            const lampGroup = new THREE.Group();
            const isRed = (cfg.type === 'red_alarm');
            const colorHex = isRed ? 0xff1744 : 0xffb300;

            const cage = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14, 0.14, 0.32, 8),
                new THREE.MeshBasicMaterial({ color: colorHex, wireframe: true })
            );
            lampGroup.add(cage);

            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({ color: colorHex })
            );
            lampGroup.add(bulb);

            const pLight = new THREE.PointLight(colorHex, isRed ? 1.3 : 0.85, isRed ? 14 : 11, 2);
            pLight.position.set(0, -0.1, 0);
            lampGroup.add(pLight);

            lampGroup.position.set(lx, ly, lz);
            this.scene.add(lampGroup);

            this.emergencyLights.push({
                group: lampGroup,
                light: pLight,
                type: cfg.type,
                baseIntensity: isRed ? 1.3 : 0.85,
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

        // Warning sign before steep chute
        const warnCanvas = document.createElement('canvas');
        warnCanvas.width = 256;
        warnCanvas.height = 128;
        const wctx = warnCanvas.getContext('2d');
        wctx.fillStyle = '#ff8f00';
        wctx.fillRect(0, 0, 256, 128);
        wctx.strokeStyle = '#000';
        wctx.lineWidth = 5;
        wctx.strokeRect(6, 6, 244, 116);
        wctx.fillStyle = '#000';
        wctx.font = 'bold 20px monospace';
        wctx.textAlign = 'center';
        wctx.fillText('⚠ STEEP PRECIPICE ⚠', 128, 45);
        wctx.font = 'bold 16px monospace';
        wctx.fillText('FLOODED RIFT AHEAD', 128, 78);
        wctx.fillText('SLIPPERY DEBRIS', 128, 105);

        const warnTex = new THREE.CanvasTexture(warnCanvas);
        const s2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshStandardMaterial({ map: warnTex }));
        const z2 = -137;
        s2.position.set(this.getPathX(z2) - 1.8, this.getPathY(z2) + 1.9, z2);
        s2.rotation.y = Math.PI / 3;
        this.scene.add(s2);

        // Illuminated Bypass Detour Sign at z = -135
        const detourCanvas = document.createElement('canvas');
        detourCanvas.width = 256;
        detourCanvas.height = 128;
        const dctx = detourCanvas.getContext('2d');
        dctx.fillStyle = '#d84315';
        dctx.fillRect(0, 0, 256, 128);
        dctx.strokeStyle = '#fff';
        dctx.lineWidth = 5;
        dctx.strokeRect(6, 6, 244, 116);
        dctx.fillStyle = '#fff';
        dctx.font = 'bold 18px monospace';
        dctx.textAlign = 'center';
        dctx.fillText('◄ EMERGENCY BYPASS', 128, 40);
        dctx.fillStyle = '#ffeb3b';
        dctx.font = 'bold 14px monospace';
        dctx.fillText('SUMP DRAINAGE CHUTE', 128, 75);
        dctx.fillText('MAIN DRIFT CHOKED', 128, 102);

        const detourTex = new THREE.CanvasTexture(detourCanvas);
        const detourSign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshStandardMaterial({ map: detourTex }));
        const zd = -135;
        detourSign.position.set(this.getPathX(zd) - 1.9, this.getPathY(zd) + 2.2, zd);
        detourSign.rotation.y = Math.PI / 4;
        this.scene.add(detourSign);
    }

    buildGearCrate() {
        // Abandoned Foreman's Emergency Rescue Gear Locker at Upper Canyon Ledge (z = -190)
        const z = -190;
        const x = this.getPathX(z) + 1.6;
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
        this.scene.add(s2);
    }

    buildInteractables() {
        // 1. RUBBLE OBSTACLES - CLEAN SOLID LOW-POLY BOULDERS (Zero spiky glitch anomaly!)
        const rubbleConfigs = [
            { id: 1, z: -52, health: 2, name: "Schist Rock Cave-in (Upper Shaft)", isBedrock: false },
            { id: 2, z: -134, health: 999, name: "Monolithic Ironstone Intrusion (Shaft 07 Main Drift)", isBedrock: true },
            { id: 3, z: -215, health: 2, name: "Granite Surface Gate Barrier", requiresCrowbar: true }
        ];

        rubbleConfigs.forEach(cfg => {
            const rx = this.getPathX(cfg.z);
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

            // Warning marker above rubble
            const glowMat = new THREE.MeshBasicMaterial({
                color: cfg.isBedrock ? 0xff1744 : 0xffb300,
                wireframe: true,
                transparent: true,
                opacity: 0.5
            });
            const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), glowMat);
            marker.position.set(0, 2.7, 0);
            group.add(marker);

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
                group: group,
                marker: marker
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

        // 3. FINAL ESCAPE HATCH (Surface Access Shaft B-4)
        this.buildEscapeHatch(-262);
    }

    buildEscapeHatch(z) {
        const hx = this.getPathX(z);
        const hy = this.getPathY(z);
        const hGroup = new THREE.Group();

        const wallMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.8,
            color: 0x444444
        });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 1.2), wallMat);
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

        const strobeLight = new THREE.PointLight(0x00e676, 1.8, 16, 2);
        strobeLight.position.set(0, 3.8, 1.0);
        hGroup.add(strobeLight);

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

        const lilyLight = new THREE.PointLight(0xffea00, 0, 12, 2);
        lilyLight.position.set(0, 1.2, 0);
        hGroup.add(lilyLight);

        hGroup.position.set(0, 0, -40);
        this.scene.add(hGroup);

        this.hallucination = {
            group: hGroup,
            materials: [goldMat],
            light: lilyLight,
            arm: arm,
            active: false,
            dissolving: false,
            time: 0
        };
    }

    update(delta, playerPos, oxygen) {
        if (this.dustParticles && playerPos) {
            this.dustParticles.position.set(playerPos.x, playerPos.y, playerPos.z);
            const posAttr = this.dustParticles.geometry.attributes.position;
            for (let i = 1; i < posAttr.count * 3; i += 3) {
                posAttr.array[i] += Math.sin(Date.now() * 0.0015 + i) * 0.003;
                if (posAttr.array[i] > 3.6) posAttr.array[i] = 0.1;
                if (posAttr.array[i] < 0) posAttr.array[i] = 3.5;
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

        if (h.arm) {
            h.arm.rotation.z = -Math.PI / 3 + Math.sin(h.time * 6) * 0.35;
        }

        if (oxygen < 35 && !h.active && !h.dissolving) {
            const spawnZ = playerPos.z - 22;
            const spawnX = this.getPathX(spawnZ);
            const spawnY = this.getPathY(spawnZ);
            h.group.position.set(spawnX, spawnY, spawnZ);
            h.active = true;
            if (window.soundEngine) window.soundEngine.playLilyWhisper();
        }

        if (h.active) {
            h.materials[0].opacity = Math.min(0.85, h.materials[0].opacity + delta * 1.2);
            h.light.intensity = Math.min(1.8, h.light.intensity + delta * 2.5);

            const baseY = this.getPathY(h.group.position.z);
            h.group.position.y = baseY + Math.sin(h.time * 2.8) * 0.15;

            const dist = playerPos.distanceTo(h.group.position);
            if (dist < 7.5 || oxygen >= 35) {
                this.dissolveHallucination();
            }
        } else if (h.dissolving) {
            h.materials[0].opacity = Math.max(0, h.materials[0].opacity - delta * 2.5);
            h.light.intensity = Math.max(0, h.light.intensity - delta * 4.0);
            h.group.position.y += delta * 1.2;
            if (h.materials[0].opacity <= 0) {
                h.dissolving = false;
                h.active = false;
            }
        } else {
            h.materials[0].opacity = 0;
            h.light.intensity = 0;
        }
    }

    dissolveHallucination() {
        if (!this.hallucination) return;
        this.hallucination.active = false;
        this.hallucination.dissolving = true;
        if (window.soundEngine) window.soundEngine.playLilyWhisper();
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
}

window.MineWorld = MineWorld;
