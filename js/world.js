/**
 * CANARY: The Collapse - 3D Continuous Cave Tunnel & Environment
 * Uses Three.js TubeGeometry & CatmullRomCurve3 for a seamless 360-degree enclosing cavern.
 * Eliminates segment clipping, wall blocking bugs, and black void gaps.
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
    // CURVE & ELEVATION FORMULAS
    // -------------------------------------------------------------
    getPathX(z) {
        // Natural gentle S-curves
        return Math.sin(z * 0.038) * 4.8 + Math.sin(z * 0.015) * 2.8;
    }

    getPathY(z) {
        // Continuous upward slope from Y=0 at z=0 up to Y=+22.5m at z=-265m
        const progress = Math.max(0, -z / this.tunnelLength);
        return progress * 22.5 + Math.sin(z * 0.05) * 0.3;
    }

    initTextures() {
        // 1. High-Contrast Rocky Cavern Wall Texture
        const rockCanvas = document.createElement('canvas');
        rockCanvas.width = 512;
        rockCanvas.height = 512;
        const rctx = rockCanvas.getContext('2d');

        // Dark earthy brown stone base
        rctx.fillStyle = '#322c25';
        rctx.fillRect(0, 0, 512, 512);

        // Sedimentary strata bands
        for (let y = 0; y < 512; y += 4) {
            const lum = 40 + Math.floor(Math.sin(y * 0.05) * 15 + Math.random() * 25);
            rctx.fillStyle = `rgb(${lum + 8},${lum + 2},${lum - 6})`;
            rctx.fillRect(0, y, 512, 3 + Math.random() * 3);
        }

        // Deep mineral veins & jagged cracks
        for (let i = 0; i < 22; i++) {
            rctx.strokeStyle = i % 2 === 0 ? 'rgba(15, 12, 10, 0.85)' : 'rgba(110, 80, 55, 0.6)';
            rctx.lineWidth = 2 + Math.random() * 4;
            rctx.beginPath();
            let curX = 0;
            let curY = Math.random() * 512;
            rctx.moveTo(curX, curY);
            while (curX < 512) {
                curX += 20 + Math.random() * 35;
                curY += (Math.random() - 0.5) * 40;
                rctx.lineTo(curX, curY);
            }
            rctx.stroke();
        }

        // Granular stone noise
        for (let k = 0; k < 4500; k++) {
            const px = Math.random() * 512;
            const py = Math.random() * 512;
            const l = Math.floor(25 + Math.random() * 45);
            rctx.fillStyle = `rgb(${l + 12},${l + 6},${l})`;
            rctx.fillRect(px, py, 2 + Math.random() * 3, 2 + Math.random() * 3);
        }

        this.rockTexture = new THREE.CanvasTexture(rockCanvas);
        this.rockTexture.wrapS = THREE.RepeatWrapping;
        this.rockTexture.wrapT = THREE.RepeatWrapping;
        this.rockTexture.repeat.set(6, 40);

        // 2. Weathered Timber Texture
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 256;
        woodCanvas.height = 256;
        const wctx = woodCanvas.getContext('2d');
        wctx.fillStyle = '#4a3220';
        wctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1500; i++) {
            const y = Math.random() * 256;
            wctx.fillStyle = `rgba(25, 15, 8, ${0.15 + Math.random() * 0.35})`;
            wctx.fillRect(0, y, 256, 1 + Math.random() * 3);
        }
        this.woodTexture = new THREE.CanvasTexture(woodCanvas);
        this.woodTexture.wrapS = THREE.RepeatWrapping;
        this.woodTexture.wrapT = THREE.RepeatWrapping;

        // 3. Rusty Metal Texture
        const metalCanvas = document.createElement('canvas');
        metalCanvas.width = 256;
        metalCanvas.height = 256;
        const mctx = metalCanvas.getContext('2d');
        mctx.fillStyle = '#4a4d50';
        mctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1200; i++) {
            mctx.fillStyle = `rgba(180, 90, 40, ${Math.random() * 0.5})`;
            mctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 4 + Math.random() * 8);
        }
        this.metalTexture = new THREE.CanvasTexture(metalCanvas);
    }

    buildSeamlessCavern() {
        // Build CatmullRom spline path along the entire shaft length
        const points = [];
        for (let z = 12; z >= -this.tunnelLength - 5; z -= 3) {
            points.push(new THREE.Vector3(this.getPathX(z), this.getPathY(z) + 1.8, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        this.cavernCurve = curve;

        // TubeGeometry: Generates a hollow, enclosing 360-degree cavern tube
        const tubularSegments = 240;
        const radius = 3.6;
        const radialSegments = 16;
        const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

        // Add natural rocky cavern roughness & jagged rock walls
        const posAttr = tubeGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const vz = posAttr.getZ(i);

            // Perlin-style trigonometric stone bump
            const bump = (Math.sin(vx * 2.2) * Math.cos(vy * 2.5) * Math.sin(vz * 1.8)) * 0.28;
            posAttr.setX(i, vx + bump);
            posAttr.setY(i, vy + bump);
        }
        tubeGeo.computeVertexNormals();

        // Cavern Material with DoubleSide rendering
        const cavernMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.90,
            metalness: 0.08,
            side: THREE.BackSide // Shows interior cavern walls surrounding the player
        });

        const cavernMesh = new THREE.Mesh(tubeGeo, cavernMat);
        cavernMesh.receiveShadow = true;
        this.scene.add(cavernMesh);

        // Minecart Rails & Wooden Ties along Cavern Floor
        this.buildTracks();
    }

    buildTracks() {
        const railMat = new THREE.MeshStandardMaterial({
            map: this.metalTexture,
            metalness: 0.8,
            roughness: 0.35,
            color: 0x888888
        });
        const tieMat = new THREE.MeshStandardMaterial({
            map: this.woodTexture,
            roughness: 0.85,
            color: 0x5a3e28
        });

        const step = 1.4;
        for (let z = 10; z >= -this.tunnelLength + 10; z -= step) {
            const x = this.getPathX(z);
            const y = this.getPathY(z);

            const nextX = this.getPathX(z - step);
            const nextY = this.getPathY(z - step);

            // Wooden Tie (Sleeper) across track
            const tie = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.09, 0.25), tieMat);
            tie.position.set(x, y + 0.05, z);
            tie.lookAt(nextX, nextY + 0.05, z - step);
            this.scene.add(tie);

            // Left & Right Rails
            const segLen = Math.hypot(nextX - x, nextY - y, step);

            const lr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, segLen + 0.05), railMat);
            lr.position.set((x + nextX) / 2 - 0.75, (y + nextY) / 2 + 0.09, z - step / 2);
            lr.lookAt(nextX - 0.75, nextY + 0.09, z - step);
            this.scene.add(lr);

            const rr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, segLen + 0.05), railMat);
            rr.position.set((x + nextX) / 2 + 0.75, (y + nextY) / 2 + 0.09, z - step / 2);
            rr.lookAt(nextX + 0.75, nextY + 0.09, z - step);
            this.scene.add(rr);

            // Timber Frame Mine Arches every 6.5 meters
            if (Math.abs(z % 6.5) < step) {
                this.buildTimberArch(x, y, z, nextX, nextY, z - step, tieMat);
            }
        }

        // Wet Mud Puddles
        const puddleGeo = new THREE.CircleGeometry(1.4, 16);
        puddleGeo.rotateX(-Math.PI / 2);
        const puddleMat = new THREE.MeshStandardMaterial({
            color: 0x121418,
            roughness: 0.08,
            metalness: 0.8
        });

        const puddleZ = [-32, -92, -155, -205];
        puddleZ.forEach((pz, idx) => {
            const px = this.getPathX(pz) + (idx % 2 === 0 ? 0.3 : -0.3);
            const py = this.getPathY(pz) + 0.03;
            const p = new THREE.Mesh(puddleGeo, puddleMat);
            p.position.set(px, py, pz);
            p.scale.set(1.1 + Math.random() * 0.4, 1, 1.8 + Math.random() * 0.5);
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

        // Emergency Amber Lights along cavern
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

        const s2 = new THREE.Mesh(signGeo, signMat);
        const z2 = -112;
        s2.position.set(this.getPathX(z2) - 2.1, this.getPathY(z2) + 1.9, z2);
        s2.rotation.y = Math.PI / 2;
        this.scene.add(s2);
    }

    buildInteractables() {
        // 1. RUBBLE OBSTACLES (Cave-ins requiring Precision Rhythm Pickaxe Breach)
        const rubbleConfigs = [
            { id: 1, z: -52, health: 2, name: "Schist Rock Cave-in (Shaft 07)" },
            { id: 2, z: -130, health: 2, name: "Collapsed Central Timber Rubble" },
            { id: 3, z: -208, health: 3, name: "Granite Emergency Gate Boulders" }
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

            // Pile of jagged boulders
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

            // Warning marker above rubble
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

        // 2. FALLEN MINER CORPSES
        const corpseConfigs = [
            { id: 1, z: -26, xOff: 1.4, name: "Tomas", role: "Shift Supervisor", o2Bonus: 35, note: "Emergency O2 cylinder has 35% capacity left. Badge reads: 'Tomas - Father of two'." },
            { id: 2, z: -95, xOff: -1.4, name: "Erik", role: "Driller", o2Bonus: 40, note: "Military high-pressure O2 canister (+40%). A photo of his family is tucked in his pocket." },
            { id: 3, z: -170, xOff: 1.3, name: "Budi", role: "Ventilation Technician", o2Bonus: 35, note: "Technician O2 canister (+35%) & Helmet backup battery." }
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
            const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), helmetMat);
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
