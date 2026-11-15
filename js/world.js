/**
 * CANARY: The Collapse - 3D Mine Shaft Environment & World Builder
 * Fully procedural textures and atmospheric underground assets using Three.js.
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

        this.initTextures();
        this.buildTunnel();
        this.buildAtmosphere();
        this.buildInteractables();
        this.buildHallucination();
    }

    initTextures() {
        // Procedural Rock Texture for Tunnel Walls
        const rockCanvas = document.createElement('canvas');
        rockCanvas.width = 512;
        rockCanvas.height = 512;
        const rctx = rockCanvas.getContext('2d');

        rctx.fillStyle = '#1c1a17';
        rctx.fillRect(0, 0, 512, 512);

        // Cracks and stone noise
        for (let i = 0; i < 4000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const lum = Math.floor(25 + Math.random() * 35);
            rctx.fillStyle = `rgb(${lum},${lum - 3},${lum - 6})`;
            rctx.fillRect(x, y, 2 + Math.random() * 5, 2 + Math.random() * 4);
        }

        // Strata veins
        rctx.strokeStyle = 'rgba(10, 8, 6, 0.6)';
        rctx.lineWidth = 3;
        for (let j = 0; j < 8; j++) {
            rctx.beginPath();
            rctx.moveTo(0, j * 64 + Math.random() * 20);
            rctx.bezierCurveTo(150, j * 64 + Math.random() * 50, 350, j * 64 - Math.random() * 50, 512, j * 64 + Math.random() * 30);
            rctx.stroke();
        }

        this.rockTexture = new THREE.CanvasTexture(rockCanvas);
        this.rockTexture.wrapS = THREE.RepeatWrapping;
        this.rockTexture.wrapT = THREE.RepeatWrapping;
        this.rockTexture.repeat.set(8, 30);

        // Procedural Wood Texture for Mine Timber Supports
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 256;
        woodCanvas.height = 256;
        const wctx = woodCanvas.getContext('2d');
        wctx.fillStyle = '#422817';
        wctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 2000; i++) {
            const y = Math.random() * 256;
            wctx.fillStyle = `rgba(30, 16, 8, ${0.1 + Math.random() * 0.25})`;
            wctx.fillRect(0, y, 256, 1 + Math.random() * 3);
        }
        this.woodTexture = new THREE.CanvasTexture(woodCanvas);
        this.woodTexture.wrapS = THREE.RepeatWrapping;
        this.woodTexture.wrapT = THREE.RepeatWrapping;

        // Procedural Metal Texture for Rails & Hatch
        const metalCanvas = document.createElement('canvas');
        metalCanvas.width = 256;
        metalCanvas.height = 256;
        const mctx = metalCanvas.getContext('2d');
        mctx.fillStyle = '#3a3d40';
        mctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 800; i++) {
            mctx.fillStyle = `rgba(140, 80, 40, ${Math.random() * 0.4})`; // Rust patches
            mctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 4 + Math.random() * 8);
        }
        this.metalTexture = new THREE.CanvasTexture(metalCanvas);
    }

    buildTunnel() {
        const tunnelLength = 290;
        const tunnelRadius = 3.6;

        // Tunnel Inverted Cylinder (Arched Mine Corridor)
        const tunnelGeo = new THREE.CylinderGeometry(tunnelRadius, tunnelRadius, tunnelLength, 24, 60, true);
        tunnelGeo.rotateZ(Math.PI / 2);
        // Flip normals inward so we see the inside of tunnel
        tunnelGeo.scale(-1, 1, 1);

        const tunnelMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.92,
            metalness: 0.08,
            side: THREE.BackSide
        });

        const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
        tunnelMesh.position.set(0, 1.8, -tunnelLength / 2 + 10);
        tunnelMesh.receiveShadow = true;
        this.scene.add(tunnelMesh);

        // Uneven Mine Floor
        const floorGeo = new THREE.PlaneGeometry(6.4, tunnelLength, 12, 120);
        floorGeo.rotateX(-Math.PI / 2);
        // Add subtle rugged bumpiness to floor
        const posAttr = floorGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const z = posAttr.getY(i);
            const x = posAttr.getX(i);
            const bump = (Math.sin(x * 2.5) * Math.cos(z * 1.5)) * 0.07;
            posAttr.setY(i, bump);
        }
        floorGeo.computeVertexNormals();

        const floorMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.88,
            metalness: 0.12
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.position.set(0, 0, -tunnelLength / 2 + 10);
        floorMesh.receiveShadow = true;
        this.scene.add(floorMesh);

        // Wooden Support Arches (Mine Timber Sets) along the tunnel
        const woodMat = new THREE.MeshStandardMaterial({
            map: this.woodTexture,
            roughness: 0.85,
            color: 0x5a3e28
        });

        const beamThickness = 0.32;
        const beamHeight = 3.4;
        const beamWidth = 5.6;

        for (let z = 5; z > -tunnelLength + 15; z -= 7) {
            const archGroup = new THREE.Group();

            // Left Post
            const leftPostGeo = new THREE.BoxGeometry(beamThickness, beamHeight, beamThickness);
            const leftPost = new THREE.Mesh(leftPostGeo, woodMat);
            leftPost.position.set(-beamWidth / 2, beamHeight / 2, 0);
            archGroup.add(leftPost);

            // Right Post
            const rightPost = new THREE.Mesh(leftPostGeo, woodMat);
            rightPost.position.set(beamWidth / 2, beamHeight / 2, 0);
            archGroup.add(rightPost);

            // Top Crossbar (Cap)
            const capGeo = new THREE.BoxGeometry(beamWidth + 0.4, beamThickness, beamThickness);
            const cap = new THREE.Mesh(capGeo, woodMat);
            cap.position.set(0, beamHeight, 0);
            archGroup.add(cap);

            // Diagonal corner braces
            const braceGeo = new THREE.BoxGeometry(0.2, 1.0, 0.2);
            const leftBrace = new THREE.Mesh(braceGeo, woodMat);
            leftBrace.position.set(-beamWidth / 2 + 0.4, beamHeight - 0.4, 0);
            leftBrace.rotation.z = Math.PI / 4;
            archGroup.add(leftBrace);

            const rightBrace = new THREE.Mesh(braceGeo, woodMat);
            rightBrace.position.set(beamWidth / 2 - 0.4, beamHeight - 0.4, 0);
            rightBrace.rotation.z = -Math.PI / 4;
            archGroup.add(rightBrace);

            archGroup.position.set(0, 0, z);
            this.scene.add(archGroup);
        }

        // Mine Cart Iron Rails & Wooden Ties along floor
        this.buildTracks(tunnelLength);
    }

    buildTracks(tunnelLength) {
        const railMat = new THREE.MeshStandardMaterial({
            map: this.metalTexture,
            metalness: 0.8,
            roughness: 0.3,
            color: 0x777777
        });
        const tieMat = new THREE.MeshStandardMaterial({
            map: this.woodTexture,
            roughness: 0.9,
            color: 0x3d2b1f
        });

        // Left & Right Rails
        const railGeo = new THREE.BoxGeometry(0.08, 0.1, tunnelLength);
        const leftRail = new THREE.Mesh(railGeo, railMat);
        leftRail.position.set(-0.75, 0.08, -tunnelLength / 2 + 10);
        this.scene.add(leftRail);

        const rightRail = new THREE.Mesh(railGeo, railMat);
        rightRail.position.set(0.75, 0.08, -tunnelLength / 2 + 10);
        this.scene.add(rightRail);

        // Ties (sleepers) every 1.4m
        const tieGeo = new THREE.BoxGeometry(2.0, 0.08, 0.22);
        for (let z = 8; z > -tunnelLength + 12; z -= 1.4) {
            const tie = new THREE.Mesh(tieGeo, tieMat);
            tie.position.set(0, 0.04, z);
            this.scene.add(tie);
        }

        // Wet puddles on floor with dark reflective surface
        const puddleGeo = new THREE.CircleGeometry(1.2, 16);
        puddleGeo.rotateX(-Math.PI / 2);
        const puddleMat = new THREE.MeshStandardMaterial({
            color: 0x0a0c0e,
            roughness: 0.1,
            metalness: 0.7
        });

        const puddleZ = [-35, -95, -165, -215];
        puddleZ.forEach((pz, idx) => {
            const p = new THREE.Mesh(puddleGeo, puddleMat);
            p.position.set(idx % 2 === 0 ? 0.4 : -0.5, 0.02, pz);
            p.scale.set(1.0 + Math.random() * 0.5, 1, 1.8 + Math.random() * 0.8);
            this.scene.add(p);
            this.puddles.push(p);
        });
    }

    buildAtmosphere() {
        // Floating Coal Dust Particles (Specks in flashlight)
        const dustCount = 800;
        const dustGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 8;
            positions[i + 1] = Math.random() * 3.5;
            positions[i + 2] = (Math.random() - 0.5) * 60;
        }

        dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const dustMat = new THREE.PointsMaterial({
            color: 0xd4af37,
            size: 0.06,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending
        });

        this.dustParticles = new THREE.Points(dustGeo, dustMat);
        this.scene.add(this.dustParticles);

        // Dim Flickering Emergency Lights in Tunnel (Yellow/Red)
        const lampPositions = [-25, -75, -125, -180, -235];
        lampPositions.forEach((lz, idx) => {
            const lampGroup = new THREE.Group();

            // Lamp Cage Mesh
            const cageGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.35, 8);
            const cageMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0xffaa33 : 0xff3322, wireframe: true });
            const cage = new THREE.Mesh(cageGeo, cageMat);
            lampGroup.add(cage);

            // Light bulb
            const bulbGeo = new THREE.SphereGeometry(0.09, 8, 8);
            const bulbMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0xffaa44 : 0xff4433 });
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            lampGroup.add(bulb);

            // Point Light
            const pLight = new THREE.PointLight(idx % 2 === 0 ? 0xff9922 : 0xff2211, 0.6, 9, 2);
            pLight.position.set(0, -0.1, 0);
            lampGroup.add(pLight);

            lampGroup.position.set(idx % 2 === 0 ? 1.6 : -1.6, 2.8, lz);
            this.scene.add(lampGroup);

            this.emergencyLights.push({
                group: lampGroup,
                light: pLight,
                baseIntensity: idx % 2 === 0 ? 0.65 : 0.85,
                flickerSeed: Math.random() * 100
            });
        });

        // Emergency Signs on Wall
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
        sctx.font = 'bold 24px monospace';
        sctx.textAlign = 'center';
        sctx.fillText('SHAFT 07 // B-4', 128, 45);
        sctx.font = 'bold 18px monospace';
        sctx.fillText('KELUAR / SURFACE ➔', 128, 85);
        sctx.font = '12px monospace';
        sctx.fillText('KEDALAMAN: 780 METER', 128, 108);

        const signTex = new THREE.CanvasTexture(signCanvas);
        const signGeo = new THREE.PlaneGeometry(1.6, 0.8);
        const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 });

        const s1 = new THREE.Mesh(signGeo, signMat);
        s1.position.set(2.4, 2.0, -15);
        s1.rotation.y = -Math.PI / 2;
        this.scene.add(s1);

        const s2 = new THREE.Mesh(signGeo, signMat);
        s2.position.set(-2.4, 2.0, -110);
        s2.rotation.y = Math.PI / 2;
        this.scene.add(s2);
    }

    buildInteractables() {
        // 1. RUBBLE OBSTACLES (Cave-ins requiring Precision Rhythm Pickaxe Breach)
        const rubbleConfigs = [
            { id: 1, z: -55, health: 3, name: "Runtuhan Batuan Sekis Shaft 07" },
            { id: 2, z: -135, health: 4, name: "Runtuhan Pilar Penyangga Tengah" },
            { id: 3, z: -215, health: 4, name: "Bongkahan Granit Gerbang Darurat" }
        ];

        rubbleConfigs.forEach(cfg => {
            const group = new THREE.Group();
            const rockMat = new THREE.MeshStandardMaterial({
                map: this.rockTexture,
                roughness: 0.95,
                color: 0x4a4742
            });

            // Pile of jagged rocks blocking the corridor
            for (let i = 0; i < 22; i++) {
                const size = 0.6 + Math.random() * 0.9;
                const rGeo = new THREE.DodecahedronGeometry(size, 1);
                // Distort vertices for rugged boulder feel
                const pos = rGeo.attributes.position;
                for (let k = 0; k < pos.count; k++) {
                    pos.setX(k, pos.getX(k) * (0.8 + Math.random() * 0.4));
                    pos.setY(k, pos.getY(k) * (0.8 + Math.random() * 0.4));
                }
                rGeo.computeVertexNormals();

                const rockMesh = new THREE.Mesh(rGeo, rockMat);
                rockMesh.position.set(
                    (Math.random() - 0.5) * 4.6,
                    Math.random() * 2.8,
                    (Math.random() - 0.5) * 2.2
                );
                rockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                rockMesh.castShadow = true;
                rockMesh.receiveShadow = true;
                group.add(rockMesh);
            }

            // Warning danger icon / indicator above rubble
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                wireframe: true,
                transparent: true,
                opacity: 0.35
            });
            const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), glowMat);
            marker.position.set(0, 2.8, 0);
            group.add(marker);

            group.position.set(0, 0, cfg.z);
            this.scene.add(group);

            this.rubbleObjects.push({
                id: cfg.id,
                name: cfg.name,
                z: cfg.z,
                maxHealth: cfg.health,
                currentHealth: cfg.health,
                cleared: false,
                group: group,
                marker: marker
            });
        });

        // 2. FALLEN MINER CORPSES (For looting spare O2 tanks & flashlight batteries)
        const corpseConfigs = [
            { id: 1, z: -28, x: 1.8, name: "Tomas", role: "Shift Supervisor", o2Bonus: 35, note: "Tabung O2 darurat masih terisi 35%. Lencana: 'Tomas - Ayah dari 2 anak'." },
            { id: 2, z: -98, x: -1.7, name: "Erik", role: "Driller", o2Bonus: 40, note: "Tabung O2 militer cadangan (+40%). Foto keluarganya terselip di saku." },
            { id: 3, z: -175, x: 1.6, name: "Budi", role: "Ventilation Tech", o2Bonus: 35, note: "Tabung O2 teknisi (+35%) & Baterai cadangan helm tambang." }
        ];

        corpseConfigs.forEach(cfg => {
            const cGroup = new THREE.Group();

            // Body clothes (Miner jumpsuit - dirty dark blue/orange)
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d434d, roughness: 0.9 });
            const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.9), bodyMat);
            torso.position.set(0, 0.15, 0);
            cGroup.add(torso);

            // Legs
            const legMat = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.9 });
            const legs = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.95), legMat);
            legs.position.set(0, 0.11, 0.85);
            cGroup.add(legs);

            // Yellow Miner Helmet fallen nearby
            const helmetMat = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.4, metalness: 0.2 });
            const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), helmetMat);
            helmet.position.set(0.42, 0.18, -0.6);
            helmet.scale.set(1, 0.75, 1.1);
            cGroup.add(helmet);

            // Spare Oxygen Cylinder next to corpse
            const tankMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.7, roughness: 0.3 });
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 10), tankMat);
            tank.rotation.z = Math.PI / 2;
            tank.position.set(-0.45, 0.1, 0.1);
            cGroup.add(tank);

            // Subtle pulsing beacon light on oxygen tank valve
            const valveLight = new THREE.PointLight(0x4caf50, 0.4, 3, 2);
            valveLight.position.set(-0.45, 0.2, 0.1);
            cGroup.add(valveLight);

            cGroup.position.set(cfg.x, 0, cfg.z);
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
                pos: new THREE.Vector3(cfg.x, 0, cfg.z)
            });
        });

        // 3. FINAL ESCAPE HATCH (Surface Access Shaft B-4) at z = -265
        this.buildEscapeHatch(-265);
    }

    buildEscapeHatch(z) {
        const hGroup = new THREE.Group();

        // Massive Concrete Bunker Wall sealing the shaft end
        const wallMat = new THREE.MeshStandardMaterial({
            map: this.rockTexture,
            roughness: 0.8,
            color: 0x333333
        });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 1.2), wallMat);
        wall.position.set(0, 2.5, 0);
        hGroup.add(wall);

        // Heavy Reinforced Steel Hatch Door
        const hatchMat = new THREE.MeshStandardMaterial({
            map: this.metalTexture,
            color: 0xd32f2f, // Industrial Danger Red
            roughness: 0.4,
            metalness: 0.8
        });

        const door = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 24), hatchMat);
        door.rotateX(Math.PI / 2);
        door.position.set(0, 2.0, 0.65);
        hGroup.add(door);

        // Emergency Valve Handwheel
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0xffeb3b, metalness: 0.6, roughness: 0.4 });
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 10, 24), wheelMat);
        wheel.position.set(0, 2.0, 0.85);
        hGroup.add(wheel);

        // Emergency Strobe Light above hatch
        const strobeLight = new THREE.PointLight(0x00ff88, 1.2, 12, 2);
        strobeLight.position.set(0, 3.8, 1.0);
        hGroup.add(strobeLight);

        // Ladder to surface
        const ladderMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });
        for (let y = 0.5; y < 4.2; y += 0.45) {
            const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), ladderMat);
            rung.rotateZ(Math.PI / 2);
            rung.position.set(2.2, y, 0.7);
            hGroup.add(rung);
        }

        hGroup.position.set(0, 0, z);
        this.scene.add(hGroup);

        this.escapeHatch = {
            group: hGroup,
            wheel: wheel,
            light: strobeLight,
            z: z,
            isOpening: false,
            openProgress: 0
        };
    }

    buildHallucination() {
        // Golden Translucent Silhouette of Lily (Appears during Hypoxia < 35%)
        const hGroup = new THREE.Group();

        // Shimmering Golden Material
        const goldMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        // Little girl silhouette mesh
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), goldMat);
        head.position.set(0, 1.35, 0);
        hGroup.add(head);

        // Hair pigtails
        const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), goldMat);
        p1.position.set(-0.28, 1.45, -0.05);
        hGroup.add(p1);
        const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), goldMat);
        p2.position.set(0.28, 1.45, -0.05);
        hGroup.add(p2);

        // Summer dress silhouette
        const dress = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 16), goldMat);
        dress.position.set(0, 0.75, 0);
        hGroup.add(dress);

        // Waving arm
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.48, 8), goldMat);
        arm.position.set(0.38, 1.05, 0);
        arm.rotation.z = -Math.PI / 3;
        hGroup.add(arm);

        // Warm Golden Glow Light around Lily
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
            targetZ: -40,
            active: false,
            dissolving: false,
            time: 0
        };
    }

    update(delta, playerPos, oxygen) {
        // Animate dust specks hovering around player
        if (this.dustParticles && playerPos) {
            this.dustParticles.position.set(playerPos.x, 0, playerPos.z);
            const posAttr = this.dustParticles.geometry.attributes.position;
            for (let i = 1; i < posAttr.count * 3; i += 3) {
                posAttr.array[i] += Math.sin(Date.now() * 0.0015 + i) * 0.003;
                if (posAttr.array[i] > 3.6) posAttr.array[i] = 0.1;
                if (posAttr.array[i] < 0) posAttr.array[i] = 3.5;
            }
            posAttr.needsUpdate = true;
        }

        // Animate flickering tunnel emergency lights
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

        // Rotate escape hatch wheel if opening
        if (this.escapeHatch && this.escapeHatch.isOpening) {
            this.escapeHatch.wheel.rotation.z += delta * 4.0;
        }

        // Hypoxia Hallucination of Lily (< 35% O2)
        this.updateHallucination(delta, playerPos, oxygen);
    }

    updateHallucination(delta, playerPos, oxygen) {
        if (!this.hallucination || !playerPos) return;
        const h = this.hallucination;
        h.time += delta;

        // Animate waving arm
        if (h.arm) {
            h.arm.rotation.z = -Math.PI / 3 + Math.sin(h.time * 6) * 0.35;
        }

        // Determine if hallucination should trigger
        if (oxygen < 35 && !h.active && !h.dissolving) {
            // Spawn Lily 22m ahead of player
            h.group.position.set(0, 0, playerPos.z - 22);
            h.active = true;
            if (window.soundEngine) {
                window.soundEngine.playLilyWhisper();
            }
        }

        if (h.active) {
            // Fade in golden glow
            h.materials[0].opacity = Math.min(0.85, h.materials[0].opacity + delta * 1.2);
            h.light.intensity = Math.min(1.8, h.light.intensity + delta * 2.5);

            // Floating bobbing motion
            h.group.position.y = Math.sin(h.time * 2.8) * 0.15;

            // Distance to player
            const dist = playerPos.distanceTo(h.group.position);
            if (dist < 7.5 || oxygen >= 35) {
                // Dissolve when approached!
                this.dissolveHallucination();
            }
        } else if (h.dissolving) {
            // Fade out rapidly into air
            h.materials[0].opacity = Math.max(0, h.materials[0].opacity - delta * 2.5);
            h.light.intensity = Math.max(0, h.light.intensity - delta * 4.0);
            h.group.position.y += delta * 1.2; // Float up to heaven
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
        if (window.soundEngine) {
            window.soundEngine.playLilyWhisper();
        }
    }

    // Clear Rubble after Pickaxe breach
    removeRubble(rubbleId) {
        const rubble = this.rubbleObjects.find(r => r.id === rubbleId);
        if (!rubble) return;
        rubble.cleared = true;
        
        // Collapse animation / sink into ground
        let progress = 0;
        const sinkInterval = setInterval(() => {
            progress += 0.05;
            rubble.group.position.y -= 0.15;
            rubble.group.scale.multiplyScalar(0.95);
            if (progress >= 1.0) {
                clearInterval(sinkInterval);
                this.scene.remove(rubble.group);
            }
        }, 30);
    }
}

window.MineWorld = MineWorld;

