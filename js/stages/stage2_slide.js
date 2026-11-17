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
        // Natural curved subterranean rock flume & ore chute from z = -285 down to z = -395
        const points = [];
        for (let z = -285; z >= -395; z -= 2.5) {
            const p = (-z - 285) / 110; // 0 to 1
            const y = THREE.MathUtils.lerp(4.5, -14.0, Math.pow(p, 1.25));
            const x = Math.sin(p * Math.PI * 2.2) * 4.8;
            points.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 80, 3.2, 16, false);

        // Chiseled wet cavern rock displacement
        const posAttr = tubeGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            let vx = posAttr.getX(i);
            let vy = posAttr.getY(i);
            let vz = posAttr.getZ(i);
            const bump = Math.sin(vx * 1.8 + vz * 0.9) * 0.28 + Math.cos(vy * 2.2) * 0.22;
            posAttr.setX(i, vx + bump);
            posAttr.setY(i, vy + bump);
        }
        tubeGeo.computeVertexNormals();

        // Wet, polished subterranean slate rock material
        const chuteMat = new THREE.MeshStandardMaterial({
            map: this.materials.rock.map,
            color: 0x2e3b42,
            roughness: 0.25,
            metalness: 0.45,
            side: THREE.DoubleSide
        });
        const chuteMesh = new THREE.Mesh(tubeGeo, chuteMat);
        chuteMesh.matrixAutoUpdate = false;
        chuteMesh.updateMatrix();
        this.group.add(chuteMesh);

        // Rushing water flume stream running along the trough of the chute
        const waterStreamGeo = new THREE.TubeGeometry(curve, 80, 1.4, 8, false);
        waterStreamGeo.scale(1.0, 0.18, 1.0); // Flatten to flume bed
        const waterStreamMat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x004d40,
            roughness: 0.1,
            metalness: 0.85,
            transparent: true,
            opacity: 0.75
        });
        const waterStream = new THREE.Mesh(waterStreamGeo, waterStreamMat);
        waterStream.position.y -= 1.1; // Rest on flume floor
        this.group.add(waterStream);

        // Vibrant Lighting along the entire slide (Optimized for 60 FPS)
        for (let i = 2; i < points.length; i += 4) {
            const pt = points[i];
            const isCyan = (i % 8 === 2);

            // Glowing guide arch ring (Visible glow with zero lighting cost!)
            const ringGeo = new THREE.TorusGeometry(3.1, 0.12, 6, 16);
            const ringMat = new THREE.MeshBasicMaterial({ color: isCyan ? 0x00e5ff : 0xffb74d });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(pt);
            this.group.add(ring);

            // Natural hanging stalactites from flume ceiling
            for (let k = -1; k <= 1; k += 2) {
                const sGeo = new THREE.ConeGeometry(0.22, 1.4 + Math.random() * 0.8, 6);
                sGeo.rotateX(Math.PI);
                const sMesh = new THREE.Mesh(sGeo, this.materials.rock);
                sMesh.position.set(pt.x + k * 1.6, pt.y + 2.2, pt.z + (Math.random() - 0.5) * 1.5);
                sMesh.matrixAutoUpdate = false;
                sMesh.updateMatrix();
                this.group.add(sMesh);
            }
        }

        // Industrial amber safety light and red chute hazard beacon
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
        const z = THREE.MathUtils.lerp(-285, -395, p);
        const y = THREE.MathUtils.lerp(4.5, -14.0, Math.pow(p, 1.25));
        const x = Math.sin(p * Math.PI * 2.2) * 4.8 + lateralOffset;
        return new THREE.Vector3(x, y, z);
    }

    buildGrottoCavern() {
        // Continuous, huge vaulted subterranean cavern arch from z = -395 down to z = -625
        const points = [];
        for (let z = -394; z >= -626; z -= 4.0) {
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
        // Clusters of glowing cyan/turquoise crystals on cavern walls
        for (let z = -405; z >= -610; z -= 18) {
            for (let side of [-1, 1]) {
                const clusterGroup = new THREE.Group();
                const x = side * (5.5 + Math.random() * 1.5);
                const y = -12.0 + Math.random() * 5.0;
                clusterGroup.position.set(x, y, z);

                // Cluster of 6-8 sharp hexagonal crystal spikes
                for (let k = 0; k < 7; k++) {
                    const h = 0.6 + Math.random() * 1.2;
                    const r = 0.08 + Math.random() * 0.12;
                    const cGeo = new THREE.ConeGeometry(r, h, 6);
                    cGeo.rotateZ(side * (0.3 + Math.random() * 0.4));
                    cGeo.rotateY(Math.random() * Math.PI);

                    const cMat = new THREE.MeshBasicMaterial({
                        color: 0x00e5ff,
                        transparent: true,
                        opacity: 0.95
                    });
                    const crystal = new THREE.Mesh(cGeo, cMat);
                    crystal.position.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6);
                    clusterGroup.add(crystal);
                }

                clusterGroup.matrixAutoUpdate = false;
                clusterGroup.updateMatrix();
                this.group.add(clusterGroup);
            }
        }

        // Two global vivid cyan-blue illumination lights for the entire grotto (crystal clear visibility)
        const grottoLight1 = new THREE.PointLight(0x00e5ff, 3.5, 70, 1.2);
        grottoLight1.position.set(0, -6.0, -450);
        this.group.add(grottoLight1);

        const grottoLight2 = new THREE.PointLight(0x00e5ff, 3.5, 70, 1.2);
        grottoLight2.position.set(0, -6.0, -560);
        this.group.add(grottoLight2);
    }

    buildWaterVolume() {
        // Crystalline turquoise water plane covering z = -395 to -615
        const waterGeo = new THREE.PlaneGeometry(28, 225, 32, 32);
        waterGeo.rotateX(-Math.PI / 2);

        // Procedural animated normal map/water surface
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x004d40,
            emissive: 0x002420,
            roughness: 0.05,
            metalness: 0.85,
            transparent: true,
            opacity: 0.82
        });

        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.set(0, -12.2, -505);
        this.group.add(waterMesh);
        this.waterVolume = waterMesh;

        // Floating miner Chen's raft at z = -495
        this.buildFloatingRaft(2.2, -12.1, -495);
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
        if (!playerPos || playerPos.z > -395 || playerPos.z < -610) return;

        // Spawn a sharp rock cone falling from ceiling (y = -5.0) down to water (y = -12.2)
        const x = playerPos.x + (Math.random() - 0.5) * 4.0;
        const z = playerPos.z - 4.0 - Math.random() * 6.0;

        const stalGeo = new THREE.ConeGeometry(0.28, 1.6, 6);
        const stalMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.9 });
        const stal = new THREE.Mesh(stalGeo, stalMat);
        stal.position.set(x, -5.0, z);
        stal.rotation.x = Math.PI; // Pointed downward
        this.group.add(stal);

        this.fallingStalactites.push({
            mesh: stal,
            velY: -2.0,
            targetY: -12.2
        });

        if (window.soundEngine && window.soundEngine.playTremorRumble) {
            window.soundEngine.playTremorRumble();
        }
    }

    update(delta, playerPos) {
        // Animate oxygen geyser bubbles
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

        // Animate falling stalactites
        for (let i = this.fallingStalactites.length - 1; i >= 0; i--) {
            const s = this.fallingStalactites[i];
            s.velY -= 14.0 * delta; // Gravity
            s.mesh.position.y += s.velY * delta;

            if (s.mesh.position.y <= s.targetY) {
                // Splash hit water
                if (window.soundEngine && window.soundEngine.playWaterSplash) {
                    window.soundEngine.playWaterSplash();
                }
                this.group.remove(s.mesh);
                this.fallingStalactites.splice(i, 1);
            }
        }

        // Animate Lily guiding beacon gentle floating
        if (this.lilyBeacon && this.lilyBeacon.active) {
            const t = performance.now() * 0.003;
            this.lilyBeacon.group.position.y = -11.6 + Math.sin(t) * 0.12;
            this.lilyBeacon.light.intensity = 2.0 + Math.sin(t * 2) * 0.5;
        }

        // Floating raft bobbing
        if (this.raftCorpse) {
            const t = performance.now() * 0.002;
            this.raftCorpse.group.position.y = -12.1 + Math.sin(t) * 0.06;
            this.raftCorpse.group.rotation.z = Math.cos(t * 0.8) * 0.03;
        }
    }
}

window.Stage2SlideAndGrotto = Stage2SlideAndGrotto;
