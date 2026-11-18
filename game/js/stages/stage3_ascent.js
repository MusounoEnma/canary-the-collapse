/**
 * CANARY: The Collapse - Stage 3: The Vertical Ascent & Surface Breach (Depth -300m to 0m)
 * Features 24m vertical rope ascent, catastrophic seismic tremors with red alarm beacons,
 * concussive camera wobble, active falling boulder dodging with floor shadow warnings,
 * the desperate crawling finale, and Hatch B-4 dawn sunlight breach.
 */

class Stage3AscentAndBreach {
    constructor(scene, materials) {
        this.scene = scene;
        this.materials = materials;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.rescueRope = null;
        this.emergencyO2Cache = null;
        this.fallingBoulders = [];
        this.alarmBeacons = [];
        this.escapeHatch = null;
        this.sunlightRays = [];

        this.buildCliffAscentZone();
        this.buildSeismicTunnel();
        this.buildRescueRope();
        this.buildAlarmBeacons();
        this.buildEscapeHatch();
    }

    buildCliffAscentZone() {
        // Natural sheer rock cliff wall behind the rope (z = -626 to -629)
        // Spanning vertically from the subterranean lake (y = -14.0m) to upper canyon (y = +15.0m)
        const cliffGroup = new THREE.Group();

        // 1. Natural rugged vertical rock cliff face (with recessed climbing gorge behind the rope)
        const cliffGeo = new THREE.PlaneGeometry(16.0, 30.0, 16, 24);
        const posAttr = cliffGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            // Deep organic vertical rock chasm/groove recessed in the center where the rope hangs
            const centerDist = Math.abs(vx);
            const recess = centerDist < 3.2 ? (1.0 - centerDist / 3.2) * 1.6 : 0;
            // Rock crag displacement strictly kept recessed backwards behind the rope
            const crag = (Math.sin(vx * 0.8 + vy * 0.5) * 0.45 + Math.cos(vx * 1.5 - vy * 0.6) * 0.35) - recess;
            posAttr.setZ(i, crag);
        }
        cliffGeo.computeVertexNormals();

        const cliffMat = this.materials.rock.clone();
        cliffMat.roughness = 0.95;
        cliffMat.side = THREE.DoubleSide;
        const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
        // Positioned safely back at z = -627.5 so the rock never bulges into or clips the rope
        cliffMesh.position.set(0, 0.0, -627.5);
        cliffGroup.add(cliffMesh);

        // Flanking rock strata side walls framing the vertical chasm
        for (let side of [-1, 1]) {
            const sideWallGeo = new THREE.PlaneGeometry(8.0, 30.0, 8, 16);
            sideWallGeo.rotateY(side * Math.PI / 2);
            const sideWall = new THREE.Mesh(sideWallGeo, cliffMat);
            sideWall.position.set(side * 5.8, 0.0, -624.5);
            cliffGroup.add(sideWall);
        }

        // 2. Shore Landing Timber Dock & Staging Platform (where player steps out of lake at z = -615 to -625)
        const dockGeo = new THREE.BoxGeometry(7.0, 0.45, 5.0);
        const dock = new THREE.Mesh(dockGeo, this.materials.wood);
        dock.position.set(0, -12.1, -623.0);
        cliffGroup.add(dock);

        // Timber dock support stilts rooted in bedrock
        for (let x of [-2.8, 0, 2.8]) {
            for (let z of [-621.0, -624.8]) {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.5, 8), this.materials.wood);
                post.position.set(x, -13.2, z);
                cliffGroup.add(post);
            }
        }

        // 3. Emergency Oxygen Supply Station & Canister Cache (positioned to the right on the dock)
        const o2StationGroup = new THREE.Group();
        o2StationGroup.position.set(2.8, -11.6, -622.8);

        // Industrial steel mounting rack
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.4), this.materials.metal);
        rack.position.set(0, 0.3, 0);
        o2StationGroup.add(rack);

        // Twin bright safety yellow oxygen tanks
        const tankMat = new THREE.MeshStandardMaterial({ color: 0xffd600, metalness: 0.8, roughness: 0.3 });
        for (let tx of [-0.3, 0.3]) {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.75, 12), tankMat);
            tank.position.set(tx, 0.45, 0);
            o2StationGroup.add(tank);

            // High pressure valve manifold
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), this.materials.metal);
            cap.position.set(tx, 0.86, 0);
            o2StationGroup.add(cap);
        }

        // Glowing emerald green status LED beacon
        const o2Led = new THREE.PointLight(0x00e676, 2.2, 7.0);
        o2Led.position.set(0, 1.0, 0.2);
        o2StationGroup.add(o2Led);

        // Lens indicator bulb
        const lensGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const lensMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, 1.0, 0.2);
        o2StationGroup.add(lens);

        cliffGroup.add(o2StationGroup);

        this.emergencyO2Cache = {
            group: o2StationGroup,
            position: new THREE.Vector3(2.8, -11.6, -622.8),
            used: false,
            refillCount: 0,
            led: o2Led
        };

        // 4. Dramatic Halogen Upward Floodlight at Base of Cliff
        // Illuminates the sheer vertical ascent rope and rock face above!
        const upwardFloodlight = new THREE.SpotLight(0xffeedd, 3.8, 38, Math.PI / 3.5, 0.4, 1.2);
        upwardFloodlight.position.set(-2.2, -11.8, -622.8);
        upwardFloodlight.target.position.set(0, 6.0, -625.0);
        cliffGroup.add(upwardFloodlight);
        cliffGroup.add(upwardFloodlight.target);

        // Floodlight fixture housing
        const lampFixture = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.35, 10), this.materials.metal);
        lampFixture.position.set(-2.2, -11.8, -622.8);
        lampFixture.rotation.x = -Math.PI / 4;
        cliffGroup.add(lampFixture);

        this.group.add(cliffGroup);
    }

    useEmergencyO2() {
        if (!this.emergencyO2Cache) return;
        this.emergencyO2Cache.refillCount++;
        if (window.gamePlayer) {
            window.gamePlayer.oxygen = Math.min(100, window.gamePlayer.oxygen + 65);
            window.gamePlayer.stress = Math.max(10, window.gamePlayer.stress - 35);
        }
        if (window.soundEngine && window.soundEngine.playDeepInhale) {
            window.soundEngine.playDeepInhale();
        }
        if (window.eventManager) {
            window.eventManager.showNotification("EMERGENCY OXYGEN INHALED! +65% RESERVES! PANIC SUBSIDED!");
        }
    }

    buildRescueRope() {
        const climbH = 24.0; // 24 meters vertical climb
        const ropeGroup = new THREE.Group();
        ropeGroup.position.set(0, -12.0, -624.8);

        // Thick braided steel-core rope
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.95 });
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, climbH + 1.0, 8), ropeMat);
        rope.position.set(0, climbH / 2, 0);
        ropeGroup.add(rope);

        // Knots & steel climbing rungs every 0.75m
        for (let y = 0.5; y < climbH; y += 0.75) {
            const knotGeo = new THREE.TorusGeometry(0.09, 0.035, 6, 12);
            knotGeo.rotateX(Math.PI / 2);
            const knot = new THREE.Mesh(knotGeo, this.materials.wood);
            knot.position.set(0, y, 0);
            ropeGroup.add(knot);
        }

        // Top Gimbal Anchor Beam & Pulley Frame at upper canyon entrance
        const anchorGeo = new THREE.BoxGeometry(4.5, 0.4, 0.4);
        const anchor = new THREE.Mesh(anchorGeo, this.materials.metal);
        anchor.position.set(0, climbH + 0.2, 0);
        ropeGroup.add(anchor);

        // Pulley wheel
        const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.12, 14);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheel = new THREE.Mesh(wheelGeo, this.materials.metal);
        wheel.position.set(0, climbH + 0.1, 0);
        ropeGroup.add(wheel);

        // Anchor support struts into the upper canyon rock
        const strut1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), this.materials.metal);
        strut1.position.set(-1.8, climbH + 1.1, -1.1);
        strut1.rotation.x = -Math.PI / 4;
        ropeGroup.add(strut1);
        const strut2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), this.materials.metal);
        strut2.position.set(1.8, climbH + 1.1, -1.1);
        strut2.rotation.x = -Math.PI / 4;
        ropeGroup.add(strut2);

        // Bottom heavy anchor carabiner & guide weight resting on timber landing
        const weightGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.45, 10);
        const weight = new THREE.Mesh(weightGeo, this.materials.metal);
        weight.position.set(0, 0.25, 0);
        ropeGroup.add(weight);

        // Luminous beacon light at rope base
        const baseLight = new THREE.PointLight(0x69f0ae, 2.2, 9.0);
        baseLight.position.set(0, 1.2, 0.4);
        ropeGroup.add(baseLight);

        this.group.add(ropeGroup);

        this.rescueRope = {
            group: ropeGroup,
            position: new THREE.Vector3(0, -12.0, -624.8),
            topY: 12.0,
            baseY: -12.0,
            climbHeight: climbH,
            isClimbed: false
        };
    }

    buildSeismicTunnel() {
        // Continuous upper escape tunnel from z = -630 down to z = -868
        const points = [];
        for (let z = -629; z >= -868; z -= 3.0) {
            points.push(new THREE.Vector3(this.getPathX(z), this.getPathY(z) + 1.4, z));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 110, 2.6, 16, false);

        const posAttr = tubeGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            let vx = posAttr.getX(i);
            let vy = posAttr.getY(i);
            let vz = posAttr.getZ(i);

            const bump = Math.sin(vx * 2.0 + vz * 0.8) * 0.22 + Math.cos(vy * 2.4) * 0.18;
            posAttr.setX(i, vx + bump);
            posAttr.setY(i, vy + bump);
        }
        tubeGeo.computeVertexNormals();

        const tunnelMesh = new THREE.Mesh(tubeGeo, this.materials.rock);
        tunnelMesh.receiveShadow = true;
        this.group.add(tunnelMesh);

        // Smooth floor pathway
        const floorPoints = [];
        for (let z = -629; z >= -868; z -= 4.0) {
            floorPoints.push(new THREE.Vector3(this.getPathX(z), this.getPathY(z) + 0.05, z));
        }
        const floorCurve = new THREE.CatmullRomCurve3(floorPoints);
        const floorGeo = new THREE.TubeGeometry(floorCurve, 80, 1.8, 6, false);
        floorGeo.scale(1.0, 0.08, 1.0);
        const floorMesh = new THREE.Mesh(floorGeo, this.materials.rock);
        this.group.add(floorMesh);
    }

    getPathX(z) {
        return Math.sin(z * 0.035) * 1.5;
    }

    getPathY(z) {
        // Starts at y = 12.0 (top of rope cliff), gently grades to y = 18.5 at Hatch B-4
        const p = (-z - 630) / 235; // 0 to 1
        return THREE.MathUtils.lerp(12.0, 18.5, Math.min(1.0, Math.max(0, p)));
    }

    buildAlarmBeacons() {
        // Smooth pulsing red emergency alarm sirens every 25m along Stage 3 (no corong, no wobble)
        for (let z = -645; z >= -850; z -= 25) {
            const x = this.getPathX(z) + 1.3;
            const y = this.getPathY(z) + 2.4;

            const beaconGroup = new THREE.Group();
            beaconGroup.position.set(x, y, z);

            const housingGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.12, 10);
            const housingMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.85, roughness: 0.3 });
            const housing = new THREE.Mesh(housingGeo, housingMat);
            beaconGroup.add(housing);

            // Metal cage protective bars
            const cageGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.28, 8, 1, true);
            const cageMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.2, wireframe: true });
            const cage = new THREE.Mesh(cageGeo, cageMat);
            cage.position.set(0, 0.20, 0);
            beaconGroup.add(cage);

            const domeGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12);
            const domeMat = new THREE.MeshStandardMaterial({
                color: 0xff1744,
                transparent: true,
                opacity: 0.65,
                roughness: 0.2,
                metalness: 0.15
            });
            const dome = new THREE.Mesh(domeGeo, domeMat);
            dome.position.set(0, 0.20, 0);
            beaconGroup.add(dome);

            const capGeo = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            const cap = new THREE.Mesh(capGeo, domeMat);
            cap.position.set(0, 0.31, 0);
            beaconGroup.add(cap);

            const bulbGeo = new THREE.SphereGeometry(0.07, 10, 10);
            const bulbMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
            const bulb = new THREE.Mesh(bulbGeo, bulbMat);
            bulb.position.set(0, 0.20, 0);
            beaconGroup.add(bulb);

            // Soft glowing aura sphere inside dome (spherical glow, no corong!)
            const auraGeo = new THREE.SphereGeometry(0.16, 10, 10);
            const auraMat = new THREE.MeshBasicMaterial({
                color: 0xff5252,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending
            });
            const aura = new THREE.Mesh(auraGeo, auraMat);
            aura.position.set(0, 0.20, 0);
            beaconGroup.add(aura);

            const light = new THREE.PointLight(0xff1744, 3.0, 22, 1.25);
            light.position.set(0, 0.20, 0);
            beaconGroup.add(light);

            this.group.add(beaconGroup);

            this.alarmBeacons.push({
                dome: dome,
                domeMat: domeMat,
                bulb: bulb,
                bulbMat: bulbMat,
                aura: aura,
                auraMat: auraMat,
                light: light,
                baseIntensity: 3.0
            });
        }

        // Industrial amber illumination light and emergency red warning beacon for Stage 3 ascent
        const s3Light1 = new THREE.PointLight(0xffa000, 3.6, 60, 1.1);
        s3Light1.position.set(0, 5.0, -660);
        this.group.add(s3Light1);

        const s3Light2 = new THREE.PointLight(0xff1744, 3.8, 60, 1.1);
        s3Light2.position.set(0, 12.0, -760);
        this.group.add(s3Light2);
    }

    buildEscapeHatch() {
        // Heavy steel blast hatch B-4 at z = -865
        const hatchGroup = new THREE.Group();
        const hx = this.getPathX(-865);
        const hy = this.getPathY(-865);
        hatchGroup.position.set(hx, hy, -865);

        // Circular blast bulkhead rim
        const rimGeo = new THREE.TorusGeometry(1.4, 0.22, 8, 18);
        const steelMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.9, roughness: 0.25 });
        const rim = new THREE.Mesh(rimGeo, steelMat);
        rim.position.set(0, 1.4, 0);
        hatchGroup.add(rim);

        // Heavy steel door
        const doorGeo = new THREE.CylinderGeometry(1.35, 1.35, 0.15, 16);
        doorGeo.rotateX(Math.PI / 2);
        const door = new THREE.Mesh(doorGeo, steelMat);
        door.position.set(0, 1.4, 0.05);
        hatchGroup.add(door);

        // Locking wheel lever
        const wheelGeo = new THREE.TorusGeometry(0.45, 0.055, 6, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0xffd600, metalness: 0.8 });
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(0, 1.4, 0.22);
        hatchGroup.add(wheel);

        // Stenciled Sign: ESCAPE HATCH B-4 // SURFACE 0m
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 256; signCanvas.height = 64;
        const sctx = signCanvas.getContext('2d');
        sctx.fillStyle = '#ffb300';
        sctx.fillRect(0, 0, 256, 64);
        sctx.fillStyle = '#000000';
        sctx.font = 'bold 20px monospace';
        sctx.textAlign = 'center';
        sctx.fillText('EMERGENCY HATCH B-4', 128, 28);
        sctx.font = '14px monospace';
        sctx.fillText('SURFACE ACCESS: 0 METERS', 128, 50);
        const signTex = new THREE.CanvasTexture(signCanvas);
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), signMat);
        sign.position.set(0, 3.1, 0.1);
        hatchGroup.add(sign);

        // Morning Dawn Sunlight God-Rays
        const sunLight = new THREE.DirectionalLight(0xfff9c4, 0.0);
        sunLight.position.set(0, 6.0, -875);
        sunLight.target.position.set(hx, hy, -865);
        this.group.add(sunLight);
        this.group.add(sunLight.target);

        const sunPoint = new THREE.PointLight(0xfff59d, 0.0, 30);
        sunPoint.position.set(0, 2.0, -864);
        hatchGroup.add(sunPoint);

        this.group.add(hatchGroup);

        this.escapeHatch = {
            group: hatchGroup,
            door: door,
            wheel: wheel,
            sunLight: sunLight,
            sunPoint: sunPoint,
            position: new THREE.Vector3(hx, hy, -865),
            isOpen: false,
            openProgress: 0
        };
    }

    spawnFallingBoulder(playerPos) {
        if (!playerPos || playerPos.z > -645 || playerPos.z < -830) return;

        // Spawn warning shadow on floor 1.2s before boulder crashes
        const targetX = playerPos.x + (Math.random() - 0.5) * 2.2;
        const targetZ = playerPos.z - 2.5 - Math.random() * 4.0;
        const targetY = this.getPathY(targetZ);

        // Shadow warning decal
        const shadowGeo = new THREE.RingGeometry(0.35, 0.75, 14);
        shadowGeo.rotateX(-Math.PI / 2);
        const shadowMat = new THREE.MeshBasicMaterial({ color: 0xd50000, transparent: true, opacity: 0.85 });
        const shadow = new THREE.Mesh(shadowGeo, shadowMat);
        shadow.position.set(targetX, targetY + 0.04, targetZ);
        this.group.add(shadow);

        // Massive boulder falling from ceiling
        const bSize = 0.55 + Math.random() * 0.45;
        const bGeo = new THREE.DodecahedronGeometry(bSize, 0);
        const bMat = this.materials.rock.clone();
        bMat.roughness = 0.95;
        const boulder = new THREE.Mesh(bGeo, bMat);
        boulder.position.set(targetX, targetY + 7.5, targetZ);
        this.group.add(boulder);

        this.fallingBoulders.push({
            boulder: boulder,
            shadow: shadow,
            targetY: targetY + bSize * 0.5,
            targetPos: new THREE.Vector3(targetX, targetY, targetZ),
            size: bSize,
            velY: 0,
            delay: 0.8 // warning delay before falling
        });
    }

    openHatch(delta) {
        if (!this.escapeHatch || this.escapeHatch.isOpen) return true;

        this.escapeHatch.openProgress += delta * 0.65;
        const p = Math.min(1.0, this.escapeHatch.openProgress);

        // Spin wheel
        this.escapeHatch.wheel.rotation.z += delta * 8.0;

        // Swing door upward
        this.escapeHatch.door.rotation.x = -p * (Math.PI / 1.7);

        // Flood scene with dazzling dawn sunlight
        this.escapeHatch.sunLight.intensity = p * 4.5;
        this.escapeHatch.sunPoint.intensity = p * 6.0;

        if (p >= 1.0) {
            this.escapeHatch.isOpen = true;
            return true;
        }
        return false;
    }

    update(delta, playerPos) {
        // Smooth industrial emergency alarm blinking directly at the lamps (no spinning, no cone)
        const time = performance.now() * 0.001;
        this.alarmBeacons.forEach((b, i) => {
            const cycle = (time * 1.8 + i * 0.35) % 1.0;
            const flash = Math.pow(Math.sin(cycle * Math.PI), 2.5);

            b.bulb.scale.setScalar(0.85 + flash * 0.35);
            b.aura.scale.setScalar(0.80 + flash * 0.40);
            b.auraMat.opacity = 0.15 + flash * 0.45;
            b.domeMat.opacity = 0.45 + flash * 0.35;
            b.light.intensity = b.baseIntensity * (0.25 + flash * 0.85);
        });

        // Update active falling boulders
        for (let i = this.fallingBoulders.length - 1; i >= 0; i--) {
            const fb = this.fallingBoulders[i];
            if (fb.delay > 0) {
                fb.delay -= delta;
                // Pulse shadow warning opacity
                fb.shadow.material.opacity = 0.5 + Math.sin(performance.now() * 0.02) * 0.4;
            } else {
                fb.velY -= 16.0 * delta; // Heavy gravity acceleration
                fb.boulder.position.y += fb.velY * delta;
                fb.boulder.rotation.x += delta * 4.0;

                // Check impact with ground
                if (fb.boulder.position.y <= fb.targetY) {
                    fb.boulder.position.y = fb.targetY;

                    // Impact sound & screen shake
                    if (window.soundEngine && window.soundEngine.playTremorRumble) {
                        window.soundEngine.playTremorRumble();
                    }

                    // Check if player is within lethal radius (1.2m)
                    if (playerPos && playerPos.distanceTo(fb.targetPos) < 1.35) {
                        if (window.gamePlayer && !window.gamePlayer.isDead) {
                            window.gamePlayer.takeDamage(35, "Crushed by falling subterranean boulder!");
                        }
                    }

                    // Remove shadow and schedule boulder fade
                    this.group.remove(fb.shadow);
                    setTimeout(() => {
                        this.group.remove(fb.boulder);
                    }, 4000);

                    this.fallingBoulders.splice(i, 1);
                }
            }
        }
    }
}

window.Stage3AscentAndBreach = Stage3AscentAndBreach;
