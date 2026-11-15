/**
 * CANARY: The Collapse - 3D Extreme Undulating Cavern & Dynamic Route Switch
 * Features:
 * - Extreme winding curves and steep incline drops.
 * - Dynamic steep slide chute leading into the flooded lower drainage drift.
 * - Gritty dark atmospheric coal & slate textures.
 * - Seamless 360-degree TubeGeometry.
 */

class MineWorld {
    constructor(scene) {
        this.scene = scene;
        this.rubbleObjects = [];
        this.corpseObjects = [];
        this.dustParticles = null;
        this.hallucination = null;
        this.emergencyLights = [];
        this.escapeHatch = null;
        this.puddles = [];

        this.tunnelLength = 280;

        this.initTextures();
        this.buildSeamlessCavern();
        this.buildAtmosphere();
        this.buildInteractables();
        this.buildHallucination();
    }

    // -------------------------------------------------------------
    // EXTREME CURVE & ELEVATION FORMULAS
    // -------------------------------------------------------------
    getPathX(z) {
        // Dramatic S-turns through tectonic fault lines
        if (z > -140) {
            return Math.sin(z * 0.045) * 5.8 + Math.sin(z * 0.02) * 3.4;
        } else if (z > -175) {
            // Sharp switchback hairpin curve in the lower drainage rift
            const t = (z - (-140)) / (-35);
            return (Math.sin(-140 * 0.045) * 5.8) + Math.sin(t * Math.PI) * 7.5;
        } else {
            // Ascending final canyon shaft towards surface
            return Math.cos(z * 0.035) * 5.2 + Math.sin(z * 0.012) * 2.5;
        }
    }

    getPathY(z) {
        // Extreme elevation profile:
        // z=0 to -140: Rolling hills and steep climbs (+8m)
        // z=-140 to -160: Steep rockslide chute drop (-6m plunged downward!)
        // z=-160 to -262: Massive arduous climb upward out of the abyss to surface (+28m ascent!)
        if (z > -140) {
            const climb = (-z / 140) * 9.5;
            const dips = Math.sin(z * 0.08) * 2.2 + Math.cos(z * 0.04) * 1.5;
            return climb + dips;
        } else if (z > -165) {
            // Steep rockslide plunge into lower drainage sump
            const t = (-z - 140) / 25; // 0 to 1
            const drop = (1 - t) * 9.5 + t * 2.8;
            return drop - Math.sin(t * Math.PI) * 2.5;
        } else {
            // Ascending final steep tunnel out of depth to surface (+24m)
            const t = (-z - 165) / 97; // 0 to 1
            const ascent = 2.8 + t * 23.5;
            const ruggedness = Math.sin(z * 0.07) * 1.4;
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

        // Sedimentary strata bands (coal seams & damp shale)
        for (let y = 0; y < 512; y += 3) {
            const noise = Math.sin(y * 0.06) * 14 + Math.random() * 20;
            const lum = 22 + Math.floor(noise * 0.7);
            const r = lum + Math.floor(Math.random() * 8);
            const g = lum + Math.floor(Math.random() * 5);
            const b = lum - 3;
            rctx.fillStyle = `rgb(${r},${g},${b})`;
            rctx.fillRect(0, y, 512, 2 + Math.random() * 3);
        }

        // Deep black coal fissures
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

        // Damp rock speckles & glistening pyrite specks
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
        const radius = 3.7;
        const radialSegments = 16;
        const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

        // Add jagged cavern roughness
        const posAttr = tubeGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const vz = posAttr.getZ(i);

            const bump = (Math.sin(vx * 2.2) * Math.cos(vy * 2.4) * Math.sin(vz * 1.7)) * 0.28;
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
            // In the steep slide zone (z=-140 to -160), rails are mangled and twisted!
            const isSlideZone = (z < -138 && z > -160);

            const x = this.getPathX(z);
            const y = this.getPathY(z);

            const nextX = this.getPathX(z - step);
            const nextY = this.getPathY(z - step);

            if (!isSlideZone) {
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
            } else {
                // Twisted broken rail segments in the slide chute
                if (Math.abs(z % 3.0) < step) {
                    const brokenRail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.5), railMat);
                    brokenRail.position.set(x + (Math.random() - 0.5) * 1.5, y + 0.1, z);
                    brokenRail.rotation.set(Math.random() * 0.8, Math.random() * 1.5, Math.random() * 0.8);
                    this.scene.add(brokenRail);
                }
            }

            if (Math.abs(z % 6.5) < step && !isSlideZone) {
                this.buildTimberArch(x, y, z, nextX, nextY, z - step, tieMat);
            }
        }

        // Flooded Puddle Pools in the lowest sumps
        const puddleGeo = new THREE.CircleGeometry(1.6, 20);
        puddleGeo.rotateX(-Math.PI / 2);
        const puddleMat = new THREE.MeshStandardMaterial({
            color: 0x0c0e12,
            roughness: 0.04,
            metalness: 0.85
        });

        // Puddles located in dips, especially the flooded landing pool after the slide at z = -162!
        const puddleZ = [-34, -72, -118, -162, -215];
        puddleZ.forEach((pz, idx) => {
            const px = this.getPathX(pz) + (idx % 2 === 0 ? 0.35 : -0.35);
            const py = this.getPathY(pz) + 0.03;
            const p = new THREE.Mesh(puddleGeo, puddleMat);
            p.position.set(px, py, pz);
            p.scale.set(pz === -162 ? 2.2 : 1.3, 1, pz === -162 ? 3.0 : 1.9);
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

        // Emergency Amber Lights
        const lampPositions = [-25, -75, -125, -178, -232];
        lampPositions.forEach((lz, idx) => {
            const lx = this.getPathX(lz) + (idx % 2 === 0 ? 1.6 : -1.6);
            const ly = this.getPathY(lz) + 2.7;

            const lampGroup = new THREE.Group();

            const cage = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14, 0.14, 0.32, 8),
                new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0xffaa33 : 0xff3322, wireframe: true })
            );
            lampGroup.add(cage);

            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 8, 8),
                new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0xffaa44 : 0xff4433 })
            );
            lampGroup.add(bulb);

            const pLight = new THREE.PointLight(idx % 2 === 0 ? 0xffaa33 : 0xff3322, 0.9, 11, 2);
            pLight.position.set(0, -0.1, 0);
            lampGroup.add(pLight);

            lampGroup.position.set(lx, ly, lz);
            this.scene.add(lampGroup);

            this.emergencyLights.push({
                group: lampGroup,
                light: pLight,
                baseIntensity: idx % 2 === 0 ? 0.85 : 0.95,
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

        // Warning sign right before the steep rockslide chute at z = -138
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
        wctx.fillText('⚠ STEEP CHUTE ⚠', 128, 45);
        wctx.font = 'bold 16px monospace';
        wctx.fillText('COLLAPSE HAZARD', 128, 78);
        wctx.fillText('SLIPPERY PRECIPICE', 128, 105);

        const warnTex = new THREE.CanvasTexture(warnCanvas);
        const s2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.75), new THREE.MeshStandardMaterial({ map: warnTex }));
        const z2 = -137;
        s2.position.set(this.getPathX(z2) - 1.8, this.getPathY(z2) + 1.9, z2);
        s2.rotation.y = Math.PI / 3;
        this.scene.add(s2);
    }

    buildInteractables() {
        // 1. RUBBLE OBSTACLES
        // Rubble 1 at z = -52
        // Rubble 2 at z = -128 (Right before the rockslide chute)
        // Rubble 3 at z = -208 (Final barrier in the canyon shaft)
        const rubbleConfigs = [
            { id: 1, z: -52, health: 2, name: "Schist Rock Cave-in (Upper Shaft)" },
            { id: 2, z: -128, health: 2, name: "Fractured Fault Boulder Block" },
            { id: 3, z: -208, health: 2, name: "Granite Surface Gate Barrier" }
        ];

        rubbleConfigs.forEach(cfg => {
            const rx = this.getPathX(cfg.z);
            const ry = this.getPathY(cfg.z);
            const group = new THREE.Group();

            const rockMat = new THREE.MeshStandardMaterial({
                map: this.rockTexture,
                roughness: 0.92,
                color: 0x5a554e
            });

            for (let i = 0; i < 24; i++) {
                const size = 0.65 + Math.random() * 0.85;
                const rGeo = new THREE.DodecahedronGeometry(size, 1);
                const pos = rGeo.attributes.position;
                for (let k = 0; k < pos.count; k++) {
                    pos.setX(k, pos.getX(k) * (0.8 + Math.random() * 0.4));
                    pos.setY(k, pos.getY(k) * (0.8 + Math.random() * 0.4));
                }
                rGeo.computeVertexNormals();

                const rockMesh = new THREE.Mesh(rGeo, rockMat);
                rockMesh.position.set(
                    (Math.random() - 0.5) * 4.4,
                    Math.random() * 2.7,
                    (Math.random() - 0.5) * 2.0
                );
                rockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                rockMesh.castShadow = true;
                group.add(rockMesh);
            }

            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xffb300,
                wireframe: true,
                transparent: true,
                opacity: 0.45
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
                maxHealth: cfg.health,
                currentHealth: cfg.health,
                cleared: false,
                group: group,
                marker: marker
            });
        });

        // 2. FALLEN MINER CORPSES (Only in the first half of the mine!)
        // In the final stretch (z < -140), NO MORE CORPSES OR O2 AID EXISTS!
        // The player must survive strictly on remaining air!
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

        const time = Date.now() * 0.005;
        this.emergencyLights.forEach(lamp => {
            const flicker = Math.sin(time + lamp.flickerSeed) * Math.cos(time * 2.3 + lamp.flickerSeed);
            lamp.light.intensity = Math.max(0.1, lamp.baseIntensity + flicker * 0.35);
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
}

window.MineWorld = MineWorld;
