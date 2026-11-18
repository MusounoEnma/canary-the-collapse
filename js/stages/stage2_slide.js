/**
 * CANARY: The Collapse - Stage 2: The Abyssal Slide & Flooded Grotto (Depth -600m to -300m)
 * Features a high-speed 110m ore chute slide, massive 225m underground water grotto,
 * glowing bioluminescent cyan crystals, swimming mechanics with 3 oxygen bubble geysers,
 * and falling stalactites hazard.
 */

class Stage2SlideAndGrotto {
    constructor(scene, materials) {
        this.scene = scene;
        this.materials = materials;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.airVents = [];
        this.fallingStalactites = [];
        this.fallingRockTimer = 0;
        this.crystalLights = [];
        this.waterVolume = null;
        this.raftCorpse = null;
        this.lilyBeacon = null;

        this.buildSlideChute();
        this.buildGrottoCavern();
        this.buildBioluminescentCrystals();
        this.buildWaterVolume();
        this.buildOxygenGeysers();
        this.buildLilyGuideBeacon();
    }

    buildSlideChute() {
        // Natural rugged subterranean rock chasm & vertical fault drop from z = -280 down to z = -395
        const points = [];
        for (let z = -280; z >= -395; z -= 2.5) {
            const p = (-z - 280) / 115; // 0 to 1
            const y = THREE.MathUtils.lerp(4.5, -14.0, Math.pow(p, 1.25));
            const x = Math.sin(p * Math.PI * 2.2) * 4.8;
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 80, 3.4, 16, false);

        // Chiseled rugged cavern rock displacement
        const posAttr = tubeGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            let vx = posAttr.getX(i);
            let vy = posAttr.getY(i);
            let vz = posAttr.getZ(i);
            const bump = Math.sin(vx * 1.8 + vz * 0.9) * 0.35 + Math.cos(vy * 2.2) * 0.28;
            posAttr.setX(i, vx + bump);
            posAttr.setY(i, vy + bump);
        }
        tubeGeo.computeVertexNormals();

        // Natural dark slate / basalt rock material (no shiny plastic, no arcade rings)
        const chuteMat = new THREE.MeshStandardMaterial({
            map: this.materials.rock.map,
            color: 0x161c24,
            roughness: 0.92,
            metalness: 0.2,
            side: THREE.DoubleSide
        });
        const chuteMesh = new THREE.Mesh(tubeGeo, chuteMat);
        chuteMesh.matrixAutoUpdate = false;
        chuteMesh.updateMatrix();
        this.group.add(chuteMesh);

        // Natural jagged rock protrusions and stalactites along the chasm descent (completely natural)
        for (let i = 2; i < points.length; i += 3) {
            const pt = points[i];

            // Jagged wall boulders
            for (let k = -1; k <= 1; k += 2) {
                const bGeo = new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.45, 0);
                const bMesh = new THREE.Mesh(bGeo, chuteMat);
                bMesh.position.set(pt.x + k * 2.2, pt.y + (Math.random() - 0.5) * 1.2, pt.z + (Math.random() - 0.5) * 1.2);
                bMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
                bMesh.matrixAutoUpdate = false;
                bMesh.updateMatrix();
                this.group.add(bMesh);

                // Hanging rocky stalactites from chasm ceiling
                const sGeo = new THREE.ConeGeometry(0.25, 1.6 + Math.random() * 0.9, 6);
                sGeo.rotateX(Math.PI);
                const sMesh = new THREE.Mesh(sGeo, chuteMat);
                sMesh.position.set(pt.x + k * 1.5, pt.y + 2.4, pt.z + (Math.random() - 0.5) * 1.2);
                sMesh.matrixAutoUpdate = false;
                sMesh.updateMatrix();
                this.group.add(sMesh);
            }
        }

        // Industrial amber safety light and red hazard beacon in the deep descent
        const chuteLight1 = new THREE.PointLight(0xffa000, 3.4, 48, 1.2);
        chuteLight1.position.set(0, 0, -320);
        this.group.add(chuteLight1);

        const chuteLight2 = new THREE.PointLight(0xff1744, 3.4, 48, 1.2);
        chuteLight2.position.set(0, -8, -370);
        this.group.add(chuteLight2);
    }

    getSlidePosition(progress, lateralOffset = 0) {
        // progress: 0 to 1
        const p = THREE.MathUtils.clamp(progress, 0, 1);
        const z = THREE.MathUtils.lerp(-280, -395, p);
        const y = THREE.MathUtils.lerp(4.5, -14.0, Math.pow(p, 1.25));
        const x = Math.sin(p * Math.PI * 2.2) * 4.8 + lateralOffset;
        return new THREE.Vector3(x, y, z);
    }

    buildGrottoCavern() {
        // Continuous, huge vaulted subterranean cavern arch from z = -395 down to z = -616 (lake shore)
        // Stops cleanly at the shore so it never overlaps or clips into the Stage 3 vertical rope shaft!
        const points = [];
        for (let z = -394; z >= -616; z -= 4.0) {
            points.push(new THREE.Vector3(Math.sin(z * 0.02) * 3.5, -7.5, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const cavernGeo = new THREE.TubeGeometry(curve, 90, 8.5, 16, false);

        const posAttr = cavernGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            let vx = posAttr.getX(i);
            let vy = posAttr.getY(i);
            let vz = posAttr.getZ(i);

            const bump = Math.sin(vx * 1.5 + vz * 0.6) * 0.45 + Math.cos(vy * 1.8 + vz * 0.9) * 0.35;
            posAttr.setX(i, vx + bump);
            posAttr.setY(i, vy + bump);
        }
        cavernGeo.computeVertexNormals();

        const cavernMat = this.materials.rock.clone();
        cavernMat.color.setHex(0x223640); // Dark teal-slate rock
        cavernMat.roughness = 0.85;
        cavernMat.side = THREE.DoubleSide;

        const cavern = new THREE.Mesh(cavernGeo, cavernMat);
        cavern.scale.set(1.3, 1.0, 1.0);
        this.group.add(cavern);
    }

    buildBioluminescentCrystals() {
        // Clusters of glowing cyan/turquoise crystals submerged under the water on the lakebed floor
        // Fully rooted underwater (y = -14.1m), shining up through the aquatic water with zero floating air glitches!
        for (let z = -405; z >= -610; z -= 14) {
            for (let side of [-1, 1]) {
                const clusterGroup = new THREE.Group();
                // Anchored firmly underwater on the lake bed floor (floor is at y = -14.0 to -14.2)
                const x = side * (2.2 + Math.random() * 2.8);
                const y = -14.1; // Deep underwater, submerged 1.9m beneath the water surface at y = -12.2!
                clusterGroup.position.set(x, y, z);

                // Submerged rock mounting base
                const baseGeo = new THREE.CylinderGeometry(0.7, 0.95, 0.25, 8);
                const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a262c, roughness: 0.9 });
                const baseMesh = new THREE.Mesh(baseGeo, baseMat);
                baseMesh.position.set(0, 0.1, 0);
                clusterGroup.add(baseMesh);

                // Cluster of 6-8 sharp hexagonal crystal spikes pointing UPWARDS into the water
                // High emissive intensity provides brilliant bioluminescence with zero per-cluster PointLight GPU overhead
                const cMat = new THREE.MeshStandardMaterial({
                    color: 0x00e5ff,
                    emissive: 0x00e5ff,
                    emissiveIntensity: 0.95,
                    roughness: 0.2,
                    metalness: 0.7,
                    transparent: true,
                    opacity: 0.90
                });

                for (let k = 0; k < 7; k++) {
                    const h = 0.55 + Math.random() * 0.75; // 0.55m to 1.3m tall, tips stay under water (water is at -12.2)
                    const r = 0.08 + Math.random() * 0.10;
                    const cGeo = new THREE.ConeGeometry(r, h, 6);
                    // Pointing upwards towards the surface with subtle organic tilt
                    cGeo.rotateZ((Math.random() - 0.5) * 0.35);
                    cGeo.rotateX((Math.random() - 0.5) * 0.35);
                    cGeo.rotateY(Math.random() * Math.PI);

                    const crystal = new THREE.Mesh(cGeo, cMat);
                    crystal.position.set(
                        (Math.random() - 0.5) * 0.7,
                        h / 2 + 0.2,
                        (Math.random() - 0.5) * 0.7
                    );
                    clusterGroup.add(crystal);
                }

                clusterGroup.matrixAutoUpdate = false;
                clusterGroup.updateMatrix();
                this.group.add(clusterGroup);
            }
        }

        // 4 dedicated, highly optimized grotto illumination lights along the river channel
        // Gives radiant, buttery smooth 60 FPS lighting without spawning dozens of dynamic hardware lights
        const grottoCoords = [-430, -485, -540, -595];
        grottoCoords.forEach((gz, idx) => {
            const gLight = new THREE.PointLight(0x00e5ff, 2.6, 55, 1.2);
            gLight.position.set(idx % 2 === 0 ? -1.8 : 1.8, -10.5, gz);
            this.group.add(gLight);
        });
    }

    buildWaterVolume() {
        // Turbulent subterranean water plane covering z = -395 to -615
        const waterGeo = new THREE.PlaneGeometry(28, 225, 48, 64);
        waterGeo.rotateX(-Math.PI / 2);

        // Procedural animated normal map/water surface with dynamic surge waves (visible above & underwater)
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x005b6b,
            emissive: 0x002c36,
            roughness: 0.10,
            metalness: 0.75,
            transparent: true,
            opacity: 0.88,
            side: THREE.DoubleSide
        });

        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.set(0, -12.2, -505);
        this.group.add(waterMesh);
        this.waterVolume = waterMesh;

        // Floating miner Chen's raft at z = -495
        this.buildFloatingRaft(2.2, -12.1, -495);
    }

    getWaterHeightAt(x, z) {
        const time = performance.now() * 0.0025;
        const localZ = -(z - (-505)); // local coordinate along plane length
        const wave = Math.sin(x * 0.45 + time * 2.8) * 0.24 
                   + Math.cos(localZ * 0.08 + time * 2.0) * 0.28 
                   + Math.sin((x + localZ) * 0.15 + time * 3.6) * 0.15;
        return -12.2 + wave;
    }

    buildOxygenGeysers() {
        // 3 Bioluminescent Air Geyser Vents that replenish oxygen
        const ventCoords = [
            { x: -1.8, y: -14.5, z: -445, id: 'vent_1' },
            { x: 2.4, y: -14.5, z: -515, id: 'vent_2' },
            { x: -1.2, y: -14.5, z: -575, id: 'vent_3' }
        ];

        ventCoords.forEach(v => {
            const ventGroup = new THREE.Group();
            ventGroup.position.set(v.x, v.y, v.z);

            // Volcanic vent rock base
            const baseGeo = new THREE.CylinderGeometry(0.8, 1.4, 0.8, 8);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.9 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            ventGroup.add(base);

            // Bubble particle column
            const bubbleCount = 45;
            const bGeo = new THREE.BufferGeometry();
            const bPos = new Float32Array(bubbleCount * 3);
            for (let i = 0; i < bubbleCount; i++) {
                bPos[i * 3 + 0] = (Math.random() - 0.5) * 0.9;
                bPos[i * 3 + 1] = Math.random() * 3.5;
                bPos[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
            }
            bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3));
            const bMat = new THREE.PointsMaterial({
                color: 0x69f0ae,
                size: 0.16,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending
            });
            const bubbles = new THREE.Points(bGeo, bMat);
            ventGroup.add(bubbles);

            // Green luminous beacon light
            const light = new THREE.PointLight(0x69f0ae, 1.8, 8.0);
            light.position.set(0, 1.8, 0);
            ventGroup.add(light);

            this.airVents.push({
                id: v.id,
                group: ventGroup,
                bubbles: bubbles,
                position: new THREE.Vector3(v.x, -12.0, v.z),
                cooldown: 0
            });

            this.group.add(ventGroup);
        });
    }

    buildFloatingRaft(x, y, z) {
        const raftGroup = new THREE.Group();
        raftGroup.position.set(x, y, z);

        // Tied timber logs raft
        for (let i = -1; i <= 1; i++) {
            const logGeo = new THREE.CylinderGeometry(0.18, 0.18, 2.4, 8);
            logGeo.rotateX(Math.PI / 2);
            const log = new THREE.Mesh(logGeo, this.materials.wood);
            log.position.set(i * 0.42, 0, 0);
            raftGroup.add(log);
        }

        // Miner 3: Chen Wei corpse
        const suitMat = new THREE.MeshStandardMaterial({ color: 0xd84315, roughness: 0.9 });
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.85), suitMat);
        torso.position.set(0, 0.22, 0);
        raftGroup.add(torso);

        // Emergency Scuba Tank (+45% Oxygen)
        const tankGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.65, 8);
        tankGeo.rotateX(Math.PI / 2);
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x00e676, metalness: 0.85, roughness: 0.2 });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(0.35, 0.25, 0);
        raftGroup.add(tank);

        // Beacon light
        const light = new THREE.PointLight(0x00e676, 1.5, 4.0);
        light.position.set(0, 0.6, 0);
        raftGroup.add(light);

        this.group.add(raftGroup);

        this.raftCorpse = {
            id: 'miner_chen',
            name: 'Chen Wei // Deep Ventilation Specialist',
            note: 'Found adrift on an emergency timber raft.\n\n"\'The water level surged after the quake. If you can make it across the lake, the vertical rescue shaft at -610m has heavy steel ropes. Climb straight up to Hatch B-4!\'"',
            group: raftGroup,
            position: new THREE.Vector3(x, y, z),
            oxygenBonus: 45,
            looted: false,
            beacon: light
        };
    }

    buildLilyGuideBeacon() {
        // Golden Lily hallucination beacon at the far shore (z = -612)
        const lilyGroup = new THREE.Group();
        lilyGroup.position.set(0, -11.6, -612);

        // Golden glowing silhouette
        const bodyGeo = new THREE.CylinderGeometry(0.15, 0.25, 1.05, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffd54f,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeo, glowMat);
        body.position.set(0, 0.55, 0);
        lilyGroup.add(body);

        const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
        const head = new THREE.Mesh(headGeo, glowMat);
        head.position.set(0, 1.2, 0);
        lilyGroup.add(head);

        // Warm ethereal golden light
        const light = new THREE.PointLight(0xffca28, 2.5, 18);
        light.position.set(0, 1.2, 0);
        lilyGroup.add(light);

        this.group.add(lilyGroup);
        this.lilyBeacon = {
            group: lilyGroup,
            light: light,
            position: new THREE.Vector3(0, -11.6, -612),
            active: true
        };
    }

    triggerFallingStalactite(playerPos) {
        if (!playerPos || playerPos.z > -395 || playerPos.z < -615) return;

        // Choose target impact location on water (telegraphed well ahead of the player)
        const isTargeted = Math.random() < 0.60;
        const targetX = isTargeted 
            ? playerPos.x + (Math.random() - 0.5) * 2.8 
            : (Math.random() - 0.5) * 8.0;
        const targetZ = isTargeted 
            ? playerPos.z - 3.2 - Math.random() * 4.8 
            : playerPos.z - 4.5 - Math.random() * 8.0;

        const targetWaterY = this.getWaterHeightAt(targetX, targetZ);

        // 1. Red Danger Warning Decal Group on the water surface (telegraphs falling hazard!)
        const warningGroup = new THREE.Group();
        warningGroup.position.set(targetX, targetWaterY + 0.06, targetZ);

        // Outer pulsing red danger ring (scaled to match nerfed 0.75m hitbox)
        const ringGeo = new THREE.RingGeometry(0.55, 0.80, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff1744,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        warningGroup.add(ringMesh);

        // Inner glowing translucent danger target zone
        const discGeo = new THREE.CircleGeometry(0.55, 24);
        discGeo.rotateX(-Math.PI / 2);
        const discMat = new THREE.MeshBasicMaterial({
            color: 0xd50000,
            transparent: true,
            opacity: 0.38,
            side: THREE.DoubleSide
        });
        const discMesh = new THREE.Mesh(discGeo, discMat);
        warningGroup.add(discMesh);

        // Crosshair hazard lines inside warning ring
        const crossMat = new THREE.MeshBasicMaterial({ color: 0xff5252, side: THREE.DoubleSide });
        const crossBar1 = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.06), crossMat);
        crossBar1.rotateX(-Math.PI / 2);
        warningGroup.add(crossBar1);
        const crossBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.1), crossMat);
        crossBar2.rotateX(-Math.PI / 2);
        warningGroup.add(crossBar2);

        this.group.add(warningGroup);

        // 2. Ceiling rock shard or stalactite poised above ceiling (y = -4.2)
        const isStalactite = Math.random() < 0.55;
        let rockMesh;
        if (isStalactite) {
            const stalGeo = new THREE.ConeGeometry(0.24 + Math.random() * 0.10, 1.3 + Math.random() * 0.7, 6);
            stalGeo.rotateX(Math.PI);
            const stalMat = new THREE.MeshStandardMaterial({ color: 0x273138, roughness: 0.9 });
            rockMesh = new THREE.Mesh(stalGeo, stalMat);
        } else {
            const dGeo = new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.25, 0);
            const dMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.95 });
            rockMesh = new THREE.Mesh(dGeo, dMat);
        }

        rockMesh.position.set(targetX, -4.2, targetZ);
        rockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        this.group.add(rockMesh);

        this.fallingStalactites.push({
            mesh: rockMesh,
            warning: warningGroup,
            ringMat: ringMat,
            discMat: discMat,
            targetX: targetX,
            targetZ: targetZ,
            delay: 1.60, // 1.60 seconds telegraph warning delay (fair reaction & dodge window!)
            velY: 0,
            rotSpeedX: (Math.random() - 0.5) * 6.0,
            rotSpeedZ: (Math.random() - 0.5) * 6.0,
            nearMissChecked: false
        });

        // Sharp crack & rumbling from the ceiling
        if (window.soundEngine && Math.random() < 0.5) {
            if (window.soundEngine.playHeavyCaveInThud) window.soundEngine.playHeavyCaveInThud();
        }
    }

    update(delta, playerPos) {
        // 1. Animate turbulent water waves ("air bergejolak")
        // Highly optimized: only runs when player is within or approaching the subterranean lake (z between -360 and -640)
        // Avoids costly computeVertexNormals() every frame for buttery smooth 60 FPS
        if (this.waterVolume && (!playerPos || (playerPos.z <= -350 && playerPos.z >= -640))) {
            const time = performance.now() * 0.0025;
            const posAttr = this.waterVolume.geometry.attributes.position;
            for (let i = 0; i < posAttr.count; i++) {
                const vx = posAttr.getX(i);
                const vz = posAttr.getZ(i);
                const wave = Math.sin(vx * 0.45 + time * 2.8) * 0.24 
                           + Math.cos(vz * 0.08 + time * 2.0) * 0.28 
                           + Math.sin((vx + vz) * 0.15 + time * 3.6) * 0.15;
                posAttr.setY(i, wave);
            }
            posAttr.needsUpdate = true;
        }

        // 2. Active falling ceiling rock debris & stalactites hazard
        if (playerPos && playerPos.z <= -395 && playerPos.z >= -615) {
            this.fallingRockTimer += delta;
            // Spawn falling rocks every 2.4 - 3.8 seconds (fair rhythmic pacing)
            if (this.fallingRockTimer > (2.4 + Math.random() * 1.4)) {
                this.fallingRockTimer = 0;
                this.triggerFallingStalactite(playerPos);
            }
        }

        // Update active falling rocks & red danger warning circles
        for (let i = this.fallingStalactites.length - 1; i >= 0; i--) {
            const s = this.fallingStalactites[i];

            if (s.delay > 0) {
                s.delay -= delta;

                // Telegraph warning phase: pulsing red area riding the dynamic water wave height
                const waterSurfaceY = this.getWaterHeightAt(s.targetX, s.targetZ);
                s.warning.position.y = waterSurfaceY + 0.05;
                s.warning.rotation.y += delta * 2.2;

                const pulse = 0.5 + Math.sin(performance.now() * 0.016) * 0.45;
                s.ringMat.opacity = pulse;
                s.discMat.opacity = pulse * 0.45;

                // Ceiling rock trembles with warning dust
                s.mesh.position.x = s.targetX + (Math.random() - 0.5) * 0.05;
                s.mesh.position.z = s.targetZ + (Math.random() - 0.5) * 0.05;
            } else {
                // Falling gravity phase
                s.velY -= 19.0 * delta;
                s.mesh.position.y += s.velY * delta;
                s.mesh.rotation.x += s.rotSpeedX * delta;
                s.mesh.rotation.z += s.rotSpeedZ * delta;

                s.ringMat.opacity = 0.95;

                // Hit collision detection with player
                if (window.gamePlayer && !window.gamePlayer.isDead) {
                    const pPos = window.gamePlayer.position;
                    // Planar horizontal distance matches the 0.75m red danger circle on the water
                    const horizDist = Math.hypot(s.mesh.position.x - pPos.x, s.mesh.position.z - pPos.z);
                    const vertDist = Math.abs(s.mesh.position.y - pPos.y);

                    // Nerfed hitbox: 0.75m radius (cleanly dodgeable when swimming outside red ring)
                    if (horizDist < 0.75 && vertDist < 1.1) {
                        // Direct hit! Player failed to dodge out of red zone
                        window.gamePlayer.takeRockHit(8, 24);
                        if (window.pickaxeSystem) {
                            window.pickaxeSystem.spawnRockShatterDebris(s.mesh.position, 0x273138);
                        }
                        this.group.remove(s.warning);
                        this.group.remove(s.mesh);
                        this.fallingStalactites.splice(i, 1);
                        continue;
                    } else if (horizDist < 1.75 && vertDist < 1.8 && !s.nearMissChecked) {
                        // Near-miss jolt: player dodged right past the falling rock!
                        s.nearMissChecked = true;
                        window.gamePlayer.triggerNearMissPanic(6);
                    }
                }

                // Check impact with dynamic water surface
                const waterSurfaceY = this.getWaterHeightAt(s.mesh.position.x, s.mesh.position.z);
                if (s.mesh.position.y <= waterSurfaceY) {
                    // Splash hit water
                    if (window.soundEngine && window.soundEngine.playWaterSplash) {
                        window.soundEngine.playWaterSplash();
                    }
                    if (window.pickaxeSystem) {
                        window.pickaxeSystem.spawnStrikeSparks(s.mesh.position);
                    }
                    this.group.remove(s.warning);
                    this.group.remove(s.mesh);
                    this.fallingStalactites.splice(i, 1);
                }
            }
        }

        // 3. Animate oxygen geyser bubbles
        this.airVents.forEach(vent => {
            if (vent.cooldown > 0) vent.cooldown -= delta;
            const posAttr = vent.bubbles.geometry.attributes.position;
            for (let i = 1; i < posAttr.count * 3; i += 3) {
                posAttr.array[i] += delta * 2.2;
                if (posAttr.array[i] > 3.5) {
                    posAttr.array[i] = 0;
                }
            }
            posAttr.needsUpdate = true;
        });

        // 4. Animate Lily guiding beacon gentle floating
        if (this.lilyBeacon && this.lilyBeacon.active) {
            const t = performance.now() * 0.003;
            this.lilyBeacon.group.position.y = -11.6 + Math.sin(t) * 0.12;
            this.lilyBeacon.light.intensity = 2.0 + Math.sin(t * 2) * 0.5;
        }

        // 5. Floating raft bobbing on waves
        if (this.raftCorpse) {
            const raftWaterY = this.getWaterHeightAt(this.raftCorpse.position.x, this.raftCorpse.position.z);
            const t = performance.now() * 0.002;
            this.raftCorpse.group.position.y = raftWaterY + 0.12 + Math.sin(t) * 0.06;
            this.raftCorpse.group.rotation.z = Math.cos(t * 0.8) * 0.05;
        }
    }
}

window.Stage2SlideAndGrotto = Stage2SlideAndGrotto;
