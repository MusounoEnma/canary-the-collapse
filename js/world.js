/**
 * CANARY: The Collapse - 3D Curved & Ascending Mine Shaft Environment
 * Features:
 * - Winding S-curve tunnel path with natural climbing elevation (ascending from depth).
 * - Multi-layered textured earth, jagged rock strata, mud, and uneven mine floor.
 * - Dynamic path math functions used by Player Controller for smooth slope climbing & boundary checks.
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
        this.buildCurvedTunnel();
        this.buildAtmosphere();
        this.buildInteractables();
        this.buildHallucination();
    }

    // -------------------------------------------------------------
    // TUNNEL CURVATURE & ELEVATION FORMULAS
    // -------------------------------------------------------------
    // Horizontal winding curve X(z)
    getPathX(z) {
        // Smooth undulating S-curves through the mountain bedrock
        return Math.sin(z * 0.038) * 5.2 + Math.sin(z * 0.015) * 3.2;
    }

    // Vertical climbing elevation Y(z)
    getPathY(z) {
        // Player ascends from Y=0 at z=0 up to Y=+22.5 meters at the surface hatch
        const progress = Math.max(0, -z / this.tunnelLength);
        // Gentle stepped incline
        return progress * 22.5 + Math.sin(z * 0.05) * 0.35;
    }

    // Tangent slope angle in radians
    getPathPitch(z) {
        const delta = 0.5;
        const dy = this.getPathY(z - delta) - this.getPathY(z + delta);
        return Math.atan2(dy, delta * 2);
    }

    initTextures() {
        // 1. Earth & Stratified Rock Texture for Cave Walls
        const rockCanvas = document.createElement('canvas');
        rockCanvas.width = 512;
        rockCanvas.height = 512;
        const rctx = rockCanvas.getContext('2d');

        // Dark earthy brown-gray base
        rctx.fillStyle = '#211d18';
        rctx.fillRect(0, 0, 512, 512);

        // Sedimentary strata bands (soil, coal veins, gravel layers)
        for (let y = 0; y < 512; y += 4) {
            const noise = Math.sin(y * 0.06) * 15 + Math.sin(y * 0.18) * 8;
            const gray = Math.floor(28 + Math.random() * 24);
            const r = gray + Math.floor(Math.random() * 12);
            const g = gray + Math.floor(Math.random() * 8);
            const b = gray - 4;
            rctx.fillStyle = `rgb(${r},${g},${b})`;
            rctx.fillRect(0, y, 512, 3 + Math.random() * 3);
        }

        // Deep mineral veins & coal fractures
        for (let i = 0; i < 18; i++) {
            rctx.strokeStyle = i % 2 === 0 ? 'rgba(10, 8, 6, 0.75)' : 'rgba(85, 62, 45, 0.5)';
            rctx.lineWidth = 2 + Math.random() * 4;
            rctx.beginPath();
            let curX = 0;
            let curY = Math.random() * 512;
            rctx.moveTo(curX, curY);
            while (curX < 512) {
                curX += 20 + Math.random() * 30;
                curY += (Math.random() - 0.5) * 45;
                rctx.lineTo(curX, curY);
            }
            rctx.stroke();
        }

        // Mud and rock specks
        for (let k = 0; k < 3000; k++) {
            const px = Math.random() * 512;
            const py = Math.random() * 512;
            const lum = Math.floor(18 + Math.random() * 38);
            rctx.fillStyle = `rgb(${lum + 10},${lum + 5},${lum})`;
            rctx.fillRect(px, py, 1 + Math.random() * 4, 1 + Math.random() * 4);
        }

        this.rockTexture = new THREE.CanvasTexture(rockCanvas);
        this.rockTexture.wrapS = THREE.RepeatWrapping;
        this.rockTexture.wrapT = THREE.RepeatWrapping;
        this.rockTexture.repeat.set(4, 30);

        // 2. Weathered Timber Texture for Mine Supports
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 256;
        woodCanvas.height = 256;
        const wctx = woodCanvas.getContext('2d');
        wctx.fillStyle = '#3e2717';
        wctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1500; i++) {
            const y = Math.random() * 256;
            wctx.fillStyle = `rgba(20, 10, 4, ${0.15 + Math.random() * 0.35})`;
            wctx.fillRect(0, y, 256, 1 + Math.random() * 3);
        }
        this.woodTexture = new THREE.CanvasTexture(woodCanvas);
        this.woodTexture.wrapS = THREE.RepeatWrapping;
        this.woodTexture.wrapT = THREE.RepeatWrapping;

        // 3. Rusty Industrial Steel Texture
        const metalCanvas = document.createElement('canvas');
        metalCanvas.width = 256;
        metalCanvas.height = 256;
        const mctx = metalCanvas.getContext('2d');
        mctx.fillStyle = '#3c4043';
        mctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 1000; i++) {
            mctx.fillStyle = `rgba(165, 82, 35, ${Math.random() * 0.45})`; // Rust
            mctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 4 + Math.random() * 8);
        }
        this.metalTexture = new THREE.CanvasTexture(metalCanvas);
    }

    buildCurvedTunnel() {
        const segments = 150;
        const radius = 3.6;
        const zStep = this.tunnelLength / segments;

        const wallMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.94,
            metalness: 0.06,
            side: THREE.BackSide
        });

        const floorMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.88,
            metalness: 0.12
        });

        const woodMat = new THREE.MeshStandardMaterial({
            map: this.woodTexture,
            roughness: 0.86,
            color: 0x5a3e28
        });

        const railMat = new THREE.MeshStandardMaterial({
            map: this.metalTexture,
            metalness: 0.8,
            roughness: 0.35,
            color: 0x777777
        });

        // Build continuous curving tunnel segments
        for (let i = 0; i < segments; i++) {
            const z0 = -i * zStep + 8;
            const z1 = -(i + 1) * zStep + 8;

            const x0 = this.getPathX(z0);
            const x1 = this.getPathX(z1);

            const y0 = this.getPathY(z0);
            const y1 = this.getPathY(z1);

            // Tunnel Arch Segment (Tube mesh along the curve)
            const segLength = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
            const archGeo = new THREE.CylinderGeometry(radius, radius, segLength, 14, 1, true);
            archGeo.rotateZ(Math.PI / 2);
            archGeo.scale(-1, 1, 1);

            const archMesh = new THREE.Mesh(archGeo, wallMat);
            archMesh.position.set((x0 + x1) / 2, (y0 + y1) / 2 + 1.8, (z0 + z1) / 2);
            archMesh.lookAt(x1, y1 + 1.8, z1);
            this.scene.add(archMesh);

            // Mine Floor Segment with Earth Strata
            const floorGeo = new THREE.PlaneGeometry(6.4, segLength, 6, 1);
            floorGeo.rotateX(-Math.PI / 2);
            const floorMesh = new THREE.Mesh(floorGeo, floorMat);
            floorMesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
            floorMesh.lookAt(x1, y1, z1);
            floorMesh.receiveShadow = true;
            this.scene.add(floorMesh);

            // Rails following the ascending curves
            const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, segLength + 0.05), railMat);
            leftRail.position.set((x0 + x1) / 2 - 0.75, (y0 + y1) / 2 + 0.07, (z0 + z1) / 2);
            leftRail.lookAt(x1 - 0.75, y1 + 0.07, z1);
            this.scene.add(leftRail);

            const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, segLength + 0.05), railMat);
            rightRail.position.set((x0 + x1) / 2 + 0.75, (y0 + y1) / 2 + 0.07, (z0 + z1) / 2);
            rightRail.lookAt(x1 + 0.75, y1 + 0.07, z1);
            this.scene.add(rightRail);

            // Wooden Mine Sleepers / Ties across tracks
            if (i % 2 === 0) {
                const tie = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.24), woodMat);
                tie.position.set(x0, y0 + 0.04, z0);
                tie.lookAt(x1, y1 + 0.04, z1);
                this.scene.add(tie);
            }

            // Timber Frame Mine Arch Supports every 6-7 meters
            if (i % 4 === 0) {
                this.buildTimberArch(x0, y0, z0, x1, y1, z1, woodMat);
            }
        }

        // Wet Mud Puddles along the winding path
        const puddleGeo = new THREE.CircleGeometry(1.3, 16);
        puddleGeo.rotateX(-Math.PI / 2);
        const puddleMat = new THREE.MeshStandardMaterial({
            color: 0x0c0d10,
            roughness: 0.08,
            metalness: 0.75
        });

        const puddleZ = [-32, -92, -155, -205];
        puddleZ.forEach((pz, idx) => {
            const px = this.getPathX(pz) + (idx % 2 === 0 ? 0.4 : -0.4);
            const py = this.getPathY(pz) + 0.02;
            const p = new THREE.Mesh(puddleGeo, puddleMat);
            p.position.set(px, py, pz);
            p.scale.set(1.1 + Math.random() * 0.4, 1, 1.7 + Math.random() * 0.6);
            this.scene.add(p);
            this.puddles.push(p);
        });
    }

    buildTimberArch(x0, y0, z0, x1, y1, z1, woodMat) {
        const arch = new THREE.Group();
        const beamW = 5.4;
        const beamH = 3.3;
        const th = 0.32;

        // Left post
        const lp = new THREE.Mesh(new THREE.BoxGeometry(th, beamH, th), woodMat);
        lp.position.set(-beamW / 2, beamH / 2, 0);
        arch.add(lp);

        // Right post
        const rp = new THREE.Mesh(new THREE.BoxGeometry(th, beamH, th), woodMat);
        rp.position.set(beamW / 2, beamH / 2, 0);
        arch.add(rp);

        // Top crossbeam
        const cap = new THREE.Mesh(new THREE.BoxGeometry(beamW + 0.4, th, th), woodMat);
        cap.position.set(0, beamH, 0);
        arch.add(cap);

        // Braces
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
        // Floating Coal Dust Particles (Specks in flashlight)
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

        // Dim Flickering Emergency Lights along the winding shaft
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

            const pLight = new THREE.PointLight(idx % 2 === 0 ? 0xff9922 : 0xff2211, 0.7, 9.5, 2);
            pLight.position.set(0, -0.1, 0);
            lampGroup.add(pLight);

            lampGroup.position.set(lx, ly, lz);
            this.scene.add(lampGroup);

            this.emergencyLights.push({
                group: lampGroup,
                light: pLight,
                baseIntensity: idx % 2 === 0 ? 0.7 : 0.85,
                flickerSeed: Math.random() * 100
            });
        });

        // Industrial English Warning Signs along shaft
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
        s1.position.set(this.getPathX(z1) + 2.2, this.getPathY(z1) + 1.9, z1);
        s1.rotation.y = -Math.PI / 2;
        this.scene.add(s1);

        const s2 = new THREE.Mesh(signGeo, signMat);
        const z2 = -112;
        s2.position.set(this.getPathX(z2) - 2.2, this.getPathY(z2) + 1.9, z2);
        s2.rotation.y = Math.PI / 2;
        this.scene.add(s2);
    }

    buildInteractables() {
        // 1. RUBBLE OBSTACLES (Cave-ins requiring Precision Rhythm Pickaxe Breach)
        // Balanced health: 2-3 hits max for fast, snappy, satisfying progression!
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
                roughness: 0.95,
                color: 0x4a4742
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

            // Pulsing warning marker above rubble
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xffb300,
                wireframe: true,
                transparent: true,
                opacity: 0.4
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

        // 2. FALLEN MINER CORPSES (For looting spare O2 cylinders & flashlight batteries)
        const corpseConfigs = [
            { id: 1, z: -26, xOff: 1.5, name: "Tomas", role: "Shift Supervisor", o2Bonus: 35, note: "Emergency O2 cylinder has 35% capacity left. Badge reads: 'Tomas - Father of two'." },
            { id: 2, z: -95, xOff: -1.5, name: "Erik", role: "Driller", o2Bonus: 40, note: "Military high-pressure O2 canister (+40%). A photo of his family is tucked in his pocket." },
            { id: 3, z: -170, xOff: 1.4, name: "Budi", role: "Ventilation Technician", o2Bonus: 35, note: "Technician O2 canister (+35%) & Helmet backup battery." }
        ];

        corpseConfigs.forEach(cfg => {
            const cx = this.getPathX(cfg.z) + cfg.xOff;
            const cy = this.getPathY(cfg.z);
            const cGroup = new THREE.Group();

            // Torso
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d434d, roughness: 0.9 });
            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.9), bodyMat);
            torso.position.set(0, 0.15, 0);
            cGroup.add(torso);

            // Legs
            const legMat = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.9 });
            const legs = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.95), legMat);
            legs.position.set(0, 0.11, 0.85);
            cGroup.add(legs);

            // Miner Yellow Helmet
            const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.4, metalness: 0.2 });
            const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), helmetMat);
            helmet.position.set(0.42, 0.18, -0.6);
            helmet.scale.set(1, 0.75, 1.1);
            cGroup.add(helmet);

            // Spare Oxygen Cylinder
            const tankMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.7, roughness: 0.3 });
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 10), tankMat);
            tank.rotation.z = Math.PI / 2;
            tank.position.set(-0.45, 0.1, 0.1);
            cGroup.add(tank);

            // Valve indicator beacon light
            const valveLight = new THREE.PointLight(0x4caf50, 0.45, 3, 2);
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

        // 3. FINAL ESCAPE HATCH (Surface Access Shaft B-4) at z = -262
        this.buildEscapeHatch(-262);
    }

    buildEscapeHatch(z) {
        const hx = this.getPathX(z);
        const hy = this.getPathY(z);
        const hGroup = new THREE.Group();

        // Heavy concrete bunker wall sealing the tunnel head
        const wallMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.8,
            color: 0x333333
        });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 5.5, 1.2), wallMat);
        wall.position.set(0, 2.5, 0);
        hGroup.add(wall);

        // Emergency Steel Hatch Door (Industrial Red)
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

        // Heavy Rotary Wheel
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, metalness: 0.6, roughness: 0.4 });
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 10, 24), wheelMat);
        wheel.position.set(0, 2.0, 0.85);
        hGroup.add(wheel);

        // Emergency Strobe Beacon Light
        const strobeLight = new THREE.PointLight(0x00e676, 1.4, 14, 2);
        strobeLight.position.set(0, 3.8, 1.0);
        hGroup.add(strobeLight);

        // Ladder rungs to surface
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
        // Golden Translucent Silhouette of Lily (Appears during Hypoxia < 35%)
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

        const lilyLight = new THREE.PointLight(0xffea00, 0, 10, 2);
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
        // Animate dust particles hovering around player
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

        // Emergency light flickers
        const time = Date.now() * 0.005;
        this.emergencyLights.forEach(lamp => {
            const flicker = Math.sin(time + lamp.flickerSeed) * Math.cos(time * 2.3 + lamp.flickerSeed);
            lamp.light.intensity = Math.max(0.08, lamp.baseIntensity + flicker * 0.35);
        });

        // Rotate rubble danger markers
        this.rubbleObjects.forEach(r => {
            if (!r.cleared && r.marker) {
                r.marker.rotation.y += delta * 2.2;
                r.marker.rotation.x += delta * 1.1;
            }
        });

        // Rotate hatch wheel if escaping
        if (this.escapeHatch && this.escapeHatch.isOpening) {
            this.escapeHatch.wheel.rotation.z += delta * 4.0;
        }

        // Hypoxia Hallucination of Lily
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

    // Instantly remove rubble upon breach
    removeRubble(rubbleId) {
        const rubble = this.rubbleObjects.find(r => r.id === rubbleId);
        if (!rubble) return;
        // Instantly disable collision
        rubble.cleared = true;

        // Visual crumbling explosion downward
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
