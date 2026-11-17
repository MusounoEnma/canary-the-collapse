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
        this.chuteHatch = null;

        this.buildCorridor();
        this.buildRailsAndTimber();
        this.buildAmberLanterns();
        this.buildObstacles();
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
        const step = 3.5;
        for (let z = 12; z >= -275; z -= step) {
            const x = this.getPathX(z);
            const y = this.getPathY(z);

            // Wooden Cross-tie
            const tieGeo = new THREE.BoxGeometry(1.9, 0.12, 0.28);
            const tie = new THREE.Mesh(tieGeo, this.materials.wood);
            tie.position.set(x, y + 0.06, z);
            this.group.add(tie);

            // Timber Support Arch every 10.5 meters
            if (Math.abs(z % 10.5) < step) {
                this.buildTimberArch(x, y, z);
            }
        }

        // Steel Rails
        for (let side of [-0.62, 0.62]) {
            const points = [];
            for (let z = 14; z >= -278; z -= 3.0) {
                points.push(new THREE.Vector3(this.getPathX(z) + side, this.getPathY(z) + 0.14, z));
            }
            const railCurve = new THREE.CatmullRomCurve3(points);
            const railGeo = new THREE.TubeGeometry(railCurve, 90, 0.038, 5, false);
            const rail = new THREE.Mesh(railGeo, this.materials.metal);
            this.group.add(rail);
        }
    }

    buildTimberArch(x, y, z) {
        const arch = new THREE.Group();
        arch.position.set(x, y, z);

        // Vertical posts
        const postGeo = new THREE.BoxGeometry(0.24, 3.2, 0.24);
        const leftPost = new THREE.Mesh(postGeo, this.materials.wood);
        leftPost.position.set(-1.6, 1.6, 0);
        const rightPost = new THREE.Mesh(postGeo, this.materials.wood);
        rightPost.position.set(1.6, 1.6, 0);

        // Cross beam
        const beamGeo = new THREE.BoxGeometry(3.5, 0.26, 0.26);
        const beam = new THREE.Mesh(beamGeo, this.materials.wood);
        beam.position.set(0, 3.1, 0);

        arch.add(leftPost);
        arch.add(rightPost);
        arch.add(beam);
        this.group.add(arch);
    }

    buildAmberLanterns() {
        // Bright amber industrial safety lanterns every 21m
        for (let z = 5; z >= -270; z -= 21) {
            const x = this.getPathX(z) + 1.45;
            const y = this.getPathY(z) + 2.5;

            const lanternGroup = new THREE.Group();
            lanternGroup.position.set(x, y, z);

            // Cage fixture
            const cageGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.32, 6);
            const cageMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
            const cage = new THREE.Mesh(cageGeo, cageMat);
            lanternGroup.add(cage);

            // Glowing amber core
            const bulbGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffb74d });
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            lanternGroup.add(bulb);

            // Warm radiant point light
            const light = new THREE.PointLight(0xffa726, 1.8, 18, 1.5);
            light.position.set(0, -0.1, 0);
            lanternGroup.add(light);

            this.lanterns.push({ group: lanternGroup, light: light, baseIntensity: 1.8 });
            this.group.add(lanternGroup);
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
            'Died holding an emergency beacon and high-capacity respirator canister.\n\n"\'Seismic readings show tectonic shifts increasing every hour. The ore chute at -280m drops straight into the submerged grotto. Take the plunge before the tremors seal it!\'"',
            this.getPathX(-225) + 0.9,
            this.getPathY(-225),
            -225,
            40 // gives 40% oxygen
        ));

        // Ore Chute Entrance Structure at z = -280
        this.buildChuteEntrance(this.getPathX(-280), this.getPathY(-280), -280);
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

    buildChuteEntrance(x, y, z) {
        const chuteGroup = new THREE.Group();
        chuteGroup.position.set(x, y, z);

        // Steel funnel archway
        const archGeo = new THREE.TorusGeometry(1.6, 0.18, 8, 16, Math.PI);
        const archMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.85, roughness: 0.3 });
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.position.set(0, 1.6, 0);
        chuteGroup.add(arch);

        // Warning sign: ORE CHUTE DANGER
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 256; signCanvas.height = 64;
        const sctx = signCanvas.getContext('2d');
        sctx.fillStyle = '#ffb300';
        sctx.fillRect(0, 0, 256, 64);
        sctx.fillStyle = '#000000';
        sctx.font = 'bold 22px monospace';
        sctx.textAlign = 'center';
        sctx.fillText('▼ ORE CHUTE NO. 4 ▼', 128, 38);
        const signTex = new THREE.CanvasTexture(signCanvas);
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), signMat);
        sign.position.set(0, 2.7, 0.1);
        chuteGroup.add(sign);

        // Downward chute gaping hole
        const holeGeo = new THREE.CylinderGeometry(1.4, 1.4, 4.0, 12, 1, true);
        const holeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(0, -1.8, -1.5);
        hole.rotation.x = -Math.PI / 3.8; // Angled down
        chuteGroup.add(hole);

        // Beacon light pointing down
        const chuteLight = new THREE.PointLight(0x00e5ff, 2.0, 12);
        chuteLight.position.set(0, 0.5, -1.0);
        chuteGroup.add(chuteLight);

        this.group.add(chuteGroup);
        this.chuteHatch = {
            group: chuteGroup,
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
    }
}

window.Stage1Vein = Stage1Vein;
