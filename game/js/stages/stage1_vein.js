/**
 * CANARY: The Collapse - Stage 1: The Collapsed Vein (Depth -780m to -600m)
 * Features extended 300m mine corridor, high-contrast amber lantern arrays,
 * derailed minecart push interaction, 2 pickaxe rubble breaches, and Ore Chute entrance.
 */

class Stage1Vein {
    constructor(scene, materials) {
        this.scene = scene;
        this.materials = materials;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.rubbles = [];
        this.corpses = [];
        this.mineCart = null;
        this.lanterns = [];
        this.rotatingBeacons = [];
        this.chuteHatch = null;

        this.buildCorridor();
        this.buildRearCaveInWall();
        this.buildStartingAtmosphericProps();
        this.buildRailsAndTimber();
        this.buildAmberLanterns();
        this.buildObstacles();
    }

    buildRearCaveInWall() {
        // Massive, impassable boulder cave-in sealing the shaft completely behind player at z = 4.0
        const wallGroup = new THREE.Group();
        wallGroup.position.set(this.getPathX(4.0), this.getPathY(4.0), 4.0);

        // Circular stone bulkhead
        const plugGeo = new THREE.CylinderGeometry(2.8, 2.8, 1.2, 16);
        plugGeo.rotateX(Math.PI / 2);
        const plug = new THREE.Mesh(plugGeo, this.materials.rock);
        plug.position.set(0, 1.5, 0);
        wallGroup.add(plug);

        // Broken, shattered timber cross-beams pinned under rock
        for (let i = 0; i < 6; i++) {
            const beamGeo = new THREE.BoxGeometry(0.24, 0.24, 2.8 + Math.random() * 0.8);
            const beam = new THREE.Mesh(beamGeo, this.materials.wood);
            beam.position.set((Math.random() - 0.5) * 1.8, 0.8 + Math.random() * 1.6, (Math.random() - 0.5) * 0.4);
            beam.rotation.set(Math.random() * 0.5, Math.random() * 0.5, (Math.random() - 0.5) * 1.2);
            wallGroup.add(beam);
        }

        // 14 fallen massive granite boulders blocking the entrance
        for (let i = 0; i < 14; i++) {
            const bGeo = new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.45, 0);
            const boulder = new THREE.Mesh(bGeo, this.materials.rock);
            boulder.position.set(
                (Math.random() - 0.5) * 3.2,
                0.3 + Math.random() * 2.2,
                -0.4 - Math.random() * 0.8
            );
            boulder.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            wallGroup.add(boulder);
        }

        // Metal Warning Sign pinned to timbers: SHAFT 07 ISOLATED // COLLAPSED
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 256; signCanvas.height = 80;
        const sctx = signCanvas.getContext('2d');
        sctx.fillStyle = '#d50000'; // Warning red
        sctx.fillRect(0, 0, 256, 80);
        sctx.fillStyle = '#ffffff';
        sctx.font = 'bold 18px monospace';
        sctx.textAlign = 'center';
        sctx.fillText('⚠ SHAFT 07 COLLAPSE ⚠', 128, 30);
        sctx.font = '13px monospace';
        sctx.fillText('PASSAGE SEALED // EVACUATE UPWARD', 128, 55);
        const signTex = new THREE.CanvasTexture(signCanvas);
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), signMat);
        sign.position.set(0, 2.2, -0.7);
        sign.rotation.z = -0.08;
        wallGroup.add(sign);

        this.group.add(wallGroup);
    }

    buildStartingAtmosphericProps() {
        // Enrich the starting zone (z = 2 to z = -35) with detailed mine assets
        const propsGroup = new THREE.Group();

        // 1. Heavy industrial high-voltage conduit cables running along left wall
        for (let side of [-1.55, 1.55]) {
            const cablePoints = [];
            for (let z = 3; z >= -60; z -= 3) {
                cablePoints.push(new THREE.Vector3(this.getPathX(z) + side, this.getPathY(z) + 2.2 + Math.sin(z * 0.3) * 0.08, z));
            }
            const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
            const cableGeo = new THREE.TubeGeometry(cableCurve, 40, 0.045, 6, false);
            const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
            const cable = new THREE.Mesh(cableGeo, cableMat);
            propsGroup.add(cable);
        }

        // 2. Discarded heavy battery crates and toolboxes near start
        for (let z of [-4, -12, -22]) {
            const crateX = this.getPathX(z) + (z % 2 === 0 ? 1.25 : -1.25);
            const crateY = this.getPathY(z);

            // Steel toolbox crate
            const crateGeo = new THREE.BoxGeometry(0.7, 0.5, 0.55);
            const crateMat = new THREE.MeshStandardMaterial({ color: 0xf57f17, metalness: 0.8, roughness: 0.3 });
            const crate = new THREE.Mesh(crateGeo, crateMat);
            crate.position.set(crateX, crateY + 0.28, z);
            crate.rotation.y = Math.random() * 0.6;
            propsGroup.add(crate);

            // Small glowing green LED indicator
            const ledGeo = new THREE.SphereGeometry(0.04, 6, 6);
            const ledMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(crateX, crateY + 0.56, z);
            propsGroup.add(led);

            // Loose rock chunks scattered beside the crate
            for (let k = 0; k < 4; k++) {
                const rGeo = new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.14, 0);
                const rMesh = new THREE.Mesh(rGeo, this.materials.rock);
                rMesh.position.set(crateX + (Math.random() - 0.5) * 0.6, crateY + 0.1, z + (Math.random() - 0.5) * 0.6);
                propsGroup.add(rMesh);
            }
        }

        // 3. Fallen Miner Safety Helmet with blinking red beacon at z = -8
        const helmetX = this.getPathX(-8) - 0.65;
        const helmetY = this.getPathY(-8);
        const helmetGeo = new THREE.SphereGeometry(0.18, 10, 10);
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.4 });
        const helmet = new THREE.Mesh(helmetGeo, helmetMat);
        helmet.position.set(helmetX, helmetY + 0.12, -8);
        propsGroup.add(helmet);

        const beacon = new THREE.PointLight(0xff1744, 1.2, 3.5);
        beacon.position.set(helmetX, helmetY + 0.35, -8);
        propsGroup.add(beacon);

        // 4. Directional distance plaque: ◄ HATCH B-4: 865 METERS UPWARD
        const dirCanvas = document.createElement('canvas');
        dirCanvas.width = 256; dirCanvas.height = 64;
        const dctx = dirCanvas.getContext('2d');
        dctx.fillStyle = '#ffb300';
        dctx.fillRect(0, 0, 256, 64);
        dctx.fillStyle = '#000000';
        dctx.font = 'bold 18px monospace';
        dctx.textAlign = 'center';
        dctx.fillText('◄ EMERGENCY ESCAPE', 128, 28);
        dctx.font = '13px monospace';
        dctx.fillText('SURFACE ACCESS: 865m', 128, 50);
        const dirTex = new THREE.CanvasTexture(dirCanvas);
        const dirSign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4), new THREE.MeshBasicMaterial({ map: dirTex }));
        dirSign.position.set(this.getPathX(-15) - 1.45, this.getPathY(-15) + 1.8, -15);
        dirSign.rotation.y = Math.PI / 2.2;
        propsGroup.add(dirSign);

        this.group.add(propsGroup);
    }

    buildCorridor() {
        // Continuous, seamless 3D cavern tube enclosing the entire 300m shaft
        const points = [];
        for (let z = 16; z >= -286; z -= 2.0) {
            points.push(new THREE.Vector3(this.getPathX(z), this.getPathY(z) + 1.4, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const tubularSegments = 160;
        const radius = 2.65; // Authentic, spacious mining drift
        const radialSegments = 16;
        const tubeGeo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

        // Multi-octave faceted rock displacement for organic jagged stone walls
        const posAttr = tubeGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            let vx = posAttr.getX(i);
            let vy = posAttr.getY(i);
            let vz = posAttr.getZ(i);

            const bump = (
                Math.sin(vx * 2.2 + vz * 0.8) * 0.22 +
                Math.cos(vy * 2.8 + vx * 1.4) * 0.16 +
                Math.sin(vz * 3.2) * 0.10
            );
            posAttr.setX(i, vx + bump);
            posAttr.setY(i, vy + bump);
        }
        tubeGeo.computeVertexNormals();

        const cavernMesh = new THREE.Mesh(tubeGeo, this.materials.rock);
        cavernMesh.receiveShadow = true;
        this.group.add(cavernMesh);

        // Smooth ground walking bed with gravel ballast
        const floorPoints = [];
        for (let z = 16; z >= -286; z -= 3.0) {
            floorPoints.push(new THREE.Vector3(this.getPathX(z), this.getPathY(z) + 0.05, z));
        }
        const floorCurve = new THREE.CatmullRomCurve3(floorPoints);
        const floorGeo = new THREE.TubeGeometry(floorCurve, 100, 1.8, 6, false);
        floorGeo.scale(1.0, 0.08, 1.0); // Flatten into walking track
        const floorMesh = new THREE.Mesh(floorGeo, this.materials.rock);
        this.group.add(floorMesh);
    }

    getPathX(z) {
        return Math.sin(z * 0.025) * 1.8;
    }

    getPathY(z) {
        // Starts at y = 0, gently grades upwards to y = 4.5 at chute entrance
        return THREE.MathUtils.lerp(0, 4.5, Math.min(1.0, Math.max(0, -z / 280)));
    }

    buildRailsAndTimber() {
        const step = 2.0;
        for (let z = 12; z >= -275; z -= step) {
            const x = this.getPathX(z);
            const y = this.getPathY(z);

            // Wooden Cross-tie every 2 meters
            const tieGeo = new THREE.BoxGeometry(2.0, 0.12, 0.28);
            const tie = new THREE.Mesh(tieGeo, this.materials.wood);
            tie.position.set(x, y + 0.06, z);
            tie.matrixAutoUpdate = false;
            tie.updateMatrix();
            this.group.add(tie);

            // Dense Timber Support Arch every 6.0 meters
            if (Math.abs(z % 6.0) < step) {
                this.buildTimberArch(x, y, z);
            }

            // Side heaps of blasted rock & ore rubble every 12 meters
            if (Math.abs(z % 12.0) < step) {
                for (let side of [-1.55, 1.55]) {
                    const oreGeo = new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.35, 0);
                    const oreMesh = new THREE.Mesh(oreGeo, this.materials.rock);
                    oreMesh.position.set(x + side, y + 0.25, z + (Math.random() - 0.5) * 0.8);
                    oreMesh.matrixAutoUpdate = false;
                    oreMesh.updateMatrix();
                    this.group.add(oreMesh);
                }
            }
        }

        // Continuous High-Tension Steel Rails
        for (let side of [-0.62, 0.62]) {
            const points = [];
            for (let z = 14; z >= -278; z -= 3.0) {
                points.push(new THREE.Vector3(this.getPathX(z) + side, this.getPathY(z) + 0.14, z));
            }
            const railCurve = new THREE.CatmullRomCurve3(points);
            const railGeo = new THREE.TubeGeometry(railCurve, 90, 0.038, 5, false);
            const rail = new THREE.Mesh(railGeo, this.materials.metal);
            rail.matrixAutoUpdate = false;
            rail.updateMatrix();
            this.group.add(rail);
        }
    }

    buildTimberArch(x, y, z) {
        const arch = new THREE.Group();
        arch.position.set(x, y, z);

        // Heavy vertical posts
        const postGeo = new THREE.BoxGeometry(0.24, 3.2, 0.24);
        const leftPost = new THREE.Mesh(postGeo, this.materials.wood);
        leftPost.position.set(-1.6, 1.6, 0);
        const rightPost = new THREE.Mesh(postGeo, this.materials.wood);
        rightPost.position.set(1.6, 1.6, 0);

        // Cross beam
        const beamGeo = new THREE.BoxGeometry(3.5, 0.26, 0.26);
        const beam = new THREE.Mesh(beamGeo, this.materials.wood);
        beam.position.set(0, 3.1, 0);

        // Diagonal knee-braces for authentic reinforced mine drift look
        for (let side of [-1, 1]) {
            const braceGeo = new THREE.BoxGeometry(0.18, 0.75, 0.18);
            const brace = new THREE.Mesh(braceGeo, this.materials.wood);
            brace.position.set(side * 1.3, 2.75, 0);
            brace.rotation.z = side * Math.PI / 4;
            arch.add(brace);
        }

        arch.add(leftPost);
        arch.add(rightPost);
        arch.add(beam);

        arch.matrixAutoUpdate = false;
        arch.updateMatrix();
        this.group.add(arch);
    }

    createRotatingBeacon(x, y, z, isRed = true) {
        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(x, y, z);

        const mainColor = isRed ? 0xff1744 : 0xffb300;
        const glowColor = isRed ? 0xff5252 : 0xffd54f;

        // 1. Heavy industrial cast-iron mounting base
        const baseGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.10, 12);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.85, roughness: 0.3 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.05, 0);
        beaconGroup.add(base);

        // 2. Protective metal cage bars around glass dome
        const cageGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.28, 8, 1, true);
        const cageMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2, wireframe: true });
        const cage = new THREE.Mesh(cageGeo, cageMat);
        cage.position.set(0, 0.20, 0);
        beaconGroup.add(cage);

        // 3. Smooth, translucent colored glass dome
        const domeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12);
        const domeMat = new THREE.MeshStandardMaterial({
            color: mainColor,
            transparent: true,
            opacity: 0.65,
            roughness: 0.2,
            metalness: 0.15
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, 0.20, 0);
        beaconGroup.add(dome);

        // Rounded top of dome
        const capGeo = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const cap = new THREE.Mesh(capGeo, domeMat);
        cap.position.set(0, 0.31, 0);
        beaconGroup.add(cap);

        // 4. Smooth, radiant incandescent inner bulb
        const bulbGeo = new THREE.SphereGeometry(0.07, 10, 10);
        const bulbMat = new THREE.MeshBasicMaterial({ color: mainColor });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(0, 0.20, 0);
        beaconGroup.add(bulb);

        // 5. Soft glowing aura sphere inside dome (smooth spherical glow without any corong!)
        const auraGeo = new THREE.SphereGeometry(0.16, 10, 10);
        const auraMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.position.set(0, 0.20, 0);
        beaconGroup.add(aura);

        // 6. Smooth industrial point light radiating from bulb
        const light = new THREE.PointLight(mainColor, 3.2, 28, 1.25);
        light.position.set(0, 0.20, 0);
        beaconGroup.add(light);

        this.group.add(beaconGroup);

        return {
            group: beaconGroup,
            dome: dome,
            domeMat: domeMat,
            bulb: bulb,
            bulbMat: bulbMat,
            aura: aura,
            auraMat: auraMat,
            light: light,
            isRed: isRed,
            baseColor: mainColor,
            glowColor: glowColor,
            baseIntensity: 3.2
        };
    }

    buildAmberLanterns() {
        // Authentic industrial mine safety lanterns & red hazard beacons every 18m
        for (let z = 5; z >= -270; z -= 18) {
            const x = this.getPathX(z) + 1.45;
            const y = this.getPathY(z) + 2.5;

            const lanternGroup = new THREE.Group();
            lanternGroup.position.set(x, y, z);

            // Heavy cast-iron cage fixture
            const cageGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.32, 6);
            const cageMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2 });
            const cage = new THREE.Mesh(cageGeo, cageMat);
            lanternGroup.add(cage);

            // Alternating warm yellow mine lantern and red hazard warning beacon
            const isRedWarning = (z === -72 || z === -144 || z === -252);
            const bulbColor = isRedWarning ? 0xff1744 : 0xffb300;
            const bulbGeo = new THREE.SphereGeometry(0.12, 8, 8);
            const bulbMat = new THREE.MeshBasicMaterial({ color: bulbColor });
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            lanternGroup.add(bulb);

            lanternGroup.matrixAutoUpdate = false;
            lanternGroup.updateMatrix();
            this.group.add(lanternGroup);
        }

        // Build 8 Industrial Revolving Emergency & Hazard Beacons (Rotating sweeping beams & flashing strobes)
        const beaconConfigs = [
            { z: -15, isRed: false, side: 1, speed: 3.5 }, // Amber revolving hazard beacon
            { z: -42, isRed: true, side: -1, speed: 5.2 }, // Red flashing emergency siren
            { z: -76, isRed: true, side: 1, speed: 5.6 },  // Red siren directly at collapsed rubble!
            { z: -110, isRed: false, side: -1, speed: 3.4 }, // Amber revolving beacon
            { z: -145, isRed: true, side: 1, speed: 5.2 }, // Red siren at derailed cart
            { z: -180, isRed: false, side: -1, speed: 3.6 }, // Amber revolving beacon
            { z: -220, isRed: true, side: 1, speed: 5.4 }, // Red emergency siren
            { z: -268, isRed: true, side: -1, speed: 5.8 } // Red siren marking chute escape
        ];

        for (const bc of beaconConfigs) {
            const bx = this.getPathX(bc.z) + (bc.side * 1.42);
            const by = this.getPathY(bc.z) + 2.35;
            this.rotatingBeacons.push(this.createRotatingBeacon(bx, by, bc.z, bc.isRed, bc.speed));
        }

        // Strategic warm yellow mine lights & red emergency beacons along Stage 1
        const lightPositions = [
            { z: 5, color: 0xffb300, intensity: 3.4, dist: 42 },
            { z: -35, color: 0xffa000, intensity: 3.2, dist: 38 },
            { z: -72, color: 0xff1744, intensity: 3.8, dist: 36 },
            { z: -105, color: 0xffb300, intensity: 3.2, dist: 40 },
            { z: -140, color: 0xffa000, intensity: 3.2, dist: 38 },
            { z: -175, color: 0xff1744, intensity: 3.6, dist: 36 },
            { z: -210, color: 0xffb300, intensity: 3.2, dist: 40 },
            { z: -245, color: 0xffa000, intensity: 3.2, dist: 38 },
            { z: -275, color: 0xff1744, intensity: 3.6, dist: 36 }
        ];
        for (const lp of lightPositions) {
            const zLight = new THREE.PointLight(lp.color, lp.intensity, lp.dist, 1.15);
            zLight.position.set(this.getPathX(lp.z), this.getPathY(lp.z) + 2.5, lp.z);
            this.group.add(zLight);
        }
    }

    buildObstacles() {
        // Obstacle 1: First Rubble Cave-in at z = -80
        this.rubbles.push(this.createRubbleBarrier(
            'rubble_vein_1',
            this.getPathX(-80),
            this.getPathY(-80),
            -80,
            'Collapsed Arch Rubble (Depth 750m)'
        ));

        // Derailed Minecart Obstacle at z = -145 (Pushable)
        this.buildDerailedCart(this.getPathX(-145), this.getPathY(-145), -145);

        // Miner 1: Yuri Koval at z = -65
        this.corpses.push(this.createMinerCorpse(
            'miner_koval',
            'Yuri Koval // Shift Supervisor',
            'Found pinned beneath a fallen support beam with a functional O2 filter.\n\n"His notebook is open to a page with scribbled coordinates: \'The lower ore chute connects to the water reservoir... it might be our only way out if Shaft 07 caves in completely.\'"',
            this.getPathX(-65) - 0.9,
            this.getPathY(-65),
            -65,
            30 // gives 30% oxygen
        ));

        // Obstacle 2: Second Rubble Cave-in at z = -210
        this.rubbles.push(this.createRubbleBarrier(
            'rubble_vein_2',
            this.getPathX(-210),
            this.getPathY(-210),
            -210,
            'Massive Granite Cave-in (Depth 680m)'
        ));

        // Miner 2: Elena Rostova at z = -225
        this.corpses.push(this.createMinerCorpse(
            'miner_elena',
            'Dr. Elena Rostova // Geologist',
            'Died holding an emergency beacon and high-capacity respirator canister.\n\n"\'Seismic readings show tectonic shifts increasing every hour. The fissure ahead drops into an underground cavern reservoir. The bedrock is fractured—if you break through the rock blockage, the cave floor will collapse right into the grotto below!\'"',
            this.getPathX(-225) + 0.9,
            this.getPathY(-225),
            -225,
            40 // gives 40% oxygen
        ));

        // Obstacle 3: Fractured Bedrock Wall blocking the chasm drop at z = -278 (Destroy with pickaxe to trigger collapse!)
        this.rubbles.push(this.createRubbleBarrier(
            'rubble_chasm_collapse',
            this.getPathX(-278),
            this.getPathY(-278),
            -278,
            'Fractured Chasm Bedrock (Depth 640m)'
        ));

        // Natural Cavern Chasm Rim at z = -280
        this.buildNaturalChasmEntrance(this.getPathX(-280), this.getPathY(-280), -280);
    }

    createRubbleBarrier(id, x, y, z, name) {
        const group = new THREE.Group();
        group.position.set(x, y, z);

        const boulderCount = 22;
        const meshes = [];
        for (let i = 0; i < boulderCount; i++) {
            const s = 0.45 + Math.random() * 0.55;
            const geo = new THREE.DodecahedronGeometry(s, 0);
            const mat = this.materials.rock.clone();
            mat.roughness = 0.95;
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                (Math.random() - 0.5) * 3.2,
                0.3 + Math.random() * 2.2,
                (Math.random() - 0.5) * 1.5
            );
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            group.add(mesh);
            meshes.push(mesh);
        }

        // Revolving Red Emergency Alarm Siren on the rubble barrier archway
        const rubbleBeacon = this.createRotatingBeacon(-1.3, 2.2, 0.4, true, 5.8);
        this.rotatingBeacons.push(rubbleBeacon);

        // Green sweet-spot interactive marker beacon
        const beaconGeo = new THREE.RingGeometry(0.18, 0.28, 16);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x69f0ae, side: THREE.DoubleSide });
        const marker = new THREE.Mesh(beaconGeo, beaconMat);
        marker.position.set(0, 1.4, 0.8);
        group.add(marker);

        this.group.add(group);

        return {
            id: id,
            name: name,
            group: group,
            meshes: meshes,
            marker: marker,
            position: new THREE.Vector3(x, y, z),
            cleared: false,
            hitsRemaining: 3
        };
    }

    buildDerailedCart(x, y, z) {
        const cartGroup = new THREE.Group();
        cartGroup.position.set(x, y + 0.45, z);
        cartGroup.rotation.y = 0.42; // Tilted across the track
        cartGroup.rotation.z = -0.18;

        // Metal hopper body
        const bodyGeo = new THREE.BoxGeometry(1.4, 0.9, 2.1);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.8, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        cartGroup.add(body);

        // Flanged iron wheels
        for (let dx of [-0.68, 0.68]) {
            for (let dz of [-0.72, 0.72]) {
                const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.12, 12);
                wheelGeo.rotateZ(Math.PI / 2);
                const wheelMat = new THREE.MeshStandardMaterial({ color: 0x263238, metalness: 0.9 });
                const wheel = new THREE.Mesh(wheelGeo, wheelMat);
                wheel.position.set(dx, -0.42, dz);
                cartGroup.add(wheel);
            }
        }

        // Interactive Push prompt marker
        const markerGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(0, 0.9, 0);
        cartGroup.add(marker);

        this.group.add(cartGroup);

        this.mineCart = {
            group: cartGroup,
            marker: marker,
            position: new THREE.Vector3(x, y, z),
            isPushed: false,
            pushProgress: 0
        };
    }

    createMinerCorpse(id, name, noteText, x, y, z, oxygenBonus) {
        const corpseGroup = new THREE.Group();
        corpseGroup.position.set(x, y, z);

        // Miner body in high-visibility orange jumpsuit
        const torsoGeo = new THREE.BoxGeometry(0.55, 0.35, 0.95);
        const suitMat = new THREE.MeshStandardMaterial({ color: 0xd84315, roughness: 0.9 });
        const torso = new THREE.Mesh(torsoGeo, suitMat);
        torso.position.set(0, 0.2, 0);
        corpseGroup.add(torso);

        // Yellow safety helmet
        const helmetGeo = new THREE.SphereGeometry(0.22, 10, 10);
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.3 });
        const helmet = new THREE.Mesh(helmetGeo, helmetMat);
        helmet.position.set(0, 0.22, 0.65);
        corpseGroup.add(helmet);

        // Glowing O2 tank canister on belt
        const tankGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.52, 8);
        tankGeo.rotateX(Math.PI / 2);
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x00e676, roughness: 0.2, metalness: 0.8 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0.32, 0.15, -0.1);
        corpseGroup.add(tank);

        // Pulse beacon
        const beacon = new THREE.PointLight(0x69f0ae, 1.2, 3.5);
        beacon.position.set(0, 0.5, 0);
        corpseGroup.add(beacon);

        this.group.add(corpseGroup);

        return {
            id: id,
            name: name,
            note: noteText,
            group: corpseGroup,
            position: new THREE.Vector3(x, y, z),
            oxygenBonus: oxygenBonus,
            looted: false,
            beacon: beacon
        };
    }

    buildNaturalChasmEntrance(x, y, z) {
        const chasmGroup = new THREE.Group();
        chasmGroup.position.set(x, y, z);

        // 1. Natural rugged rock arch framing the deep chasm opening (no artificial signs or neon arches!)
        const archRockCount = 16;
        for (let i = 0; i < archRockCount; i++) {
            const angle = (i / (archRockCount - 1)) * Math.PI;
            const r = 2.5;
            const rx = Math.cos(angle) * r;
            const ry = Math.sin(angle) * r + 0.5;
            const rockGeo = new THREE.DodecahedronGeometry(0.7 + Math.random() * 0.35, 0);
            const rockMat = this.materials.rock.clone();
            rockMat.roughness = 0.95;
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(rx, ry, (Math.random() - 0.5) * 0.9);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            chasmGroup.add(rock);
        }

        // 2. Broken, splintered wooden support timbers hanging under tonnes of collapsed rock
        const timberMat = new THREE.MeshStandardMaterial({ color: 0x332219, roughness: 0.9 });
        const postLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.4, 0.24), timberMat);
        postLeft.position.set(-1.75, 1.5, 0);
        postLeft.rotation.z = -0.10;
        chasmGroup.add(postLeft);

        const postRight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.4, 0.24), timberMat);
        postRight.position.set(1.75, 1.5, 0);
        postRight.rotation.z = 0.10;
        chasmGroup.add(postRight);

        const beamTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.28, 0.28), timberMat);
        beamTop.position.set(0, 3.0, 0);
        beamTop.rotation.z = 0.05;
        chasmGroup.add(beamTop);

        // 3. Natural fractured rock fissure gaping into the black abyss
        const pitGeo = new THREE.CylinderGeometry(2.4, 3.0, 6.0, 12, 1, true);
        const pitMat = new THREE.MeshStandardMaterial({ color: 0x090d12, roughness: 0.98, metalness: 0.1 });
        const pit = new THREE.Mesh(pitGeo, pitMat);
        pit.position.set(0, -2.8, -2.2);
        pit.rotation.x = -Math.PI / 3.4;
        chasmGroup.add(pit);

        // 4. Stationary industrial red safety lantern on broken timber beam (smooth gentle blinking)
        const lanternBeacon = this.createRotatingBeacon(1.35, 2.7, 0.2, true);
        this.rotatingBeacons.push(lanternBeacon);

        // 5. Deep abyss ambient light: faint eerie cyan reflection rising from the subterranean lake below
        const abyssLight = new THREE.PointLight(0x00e5ff, 1.4, 18);
        abyssLight.position.set(0, -1.8, -3.2);
        chasmGroup.add(abyssLight);

        this.group.add(chasmGroup);
        this.chuteHatch = {
            group: chasmGroup,
            position: new THREE.Vector3(x, y, z)
        };
    }

    pushMineCart(delta) {
        if (!this.mineCart || this.mineCart.isPushed) return false;

        this.mineCart.pushProgress += delta * 1.2;
        const p = Math.min(1.0, this.mineCart.pushProgress);

        // Push cart forward and rotate aside to clear track
        this.mineCart.group.position.x -= delta * 1.5;
        this.mineCart.group.position.z -= delta * 1.2;
        this.mineCart.group.rotation.y += delta * 0.4;

        if (p >= 1.0) {
            this.mineCart.isPushed = true;
            this.mineCart.marker.visible = false;
            return true;
        }
        return false;
    }

    update(delta, playerPos) {
        // Subtle amber lantern flickers during subterranean tremors
        const time = performance.now() * 0.005;
        this.lanterns.forEach((l, i) => {
            const flicker = Math.sin(time + i * 2.3) * 0.15 + Math.sin(time * 3 + i) * 0.08;
            l.light.intensity = THREE.MathUtils.clamp(l.baseIntensity + flicker, 1.2, 2.2);
        });

        // Smooth industrial beacon blinking and breathing directly at the lamps (no spinning, no cone)
        const t = performance.now() * 0.001;
        this.rotatingBeacons.forEach((b, i) => {
            let flash = 1.0;
            if (b.isRed) {
                // Smooth red emergency alarm blink: gentle rhythmic pulse
                const cycle = (t * 1.8 + i * 0.35) % 1.0;
                flash = Math.pow(Math.sin(cycle * Math.PI), 2.5);
            } else {
                // Smooth warm amber breathing rhythm
                flash = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 0.8));
            }

            // Smoothly pulse the inner bulb, spherical aura, and outer dome
            b.bulb.scale.setScalar(0.85 + flash * 0.35);
            b.aura.scale.setScalar(0.80 + flash * 0.40);
            b.auraMat.opacity = 0.15 + flash * 0.45;
            b.domeMat.opacity = 0.45 + flash * 0.35;
            b.light.intensity = b.baseIntensity * (0.25 + flash * 0.85);
        });
    }
}

window.Stage1Vein = Stage1Vein;
