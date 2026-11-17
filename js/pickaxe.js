/**
 * CANARY: The Collapse - 3D First-Person Pickaxe & Rock Shatter FX
 * Renders an authentic mining pickaxe in the player's view, complete with physical strike swings,
 * sparks, stone fracture decals, and explosive rock debris particles.
 */

class PickaxeSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.pickaxeGroup = new THREE.Group();
        this.isSwinging = false;
        this.swingProgress = 0;
        this.swingDuration = 0.38; // fast, impactful strike
        this.basePosition = new THREE.Vector3(0.38, -0.32, -0.62);
        this.baseRotation = new THREE.Euler(0.2, -0.35, -0.15);
        this.targetStrikeCallback = null;
        this.sparksEmitters = [];

        this.buildPickaxeMesh();
        this.camera.add(this.pickaxeGroup);
        this.pickaxeGroup.position.copy(this.basePosition);
        this.pickaxeGroup.rotation.copy(this.baseRotation);
        this.pickaxeGroup.visible = false; // Hidden until near rubble or swinging
    }

    buildPickaxeMesh() {
        // High-durability ash-wood handle
        const handleGeo = new THREE.CylinderGeometry(0.024, 0.028, 0.75, 8);
        const handleCanvas = document.createElement('canvas');
        handleCanvas.width = 64; handleCanvas.height = 256;
        const hctx = handleCanvas.getContext('2d');
        hctx.fillStyle = '#6d4c41';
        hctx.fillRect(0, 0, 64, 256);
        hctx.fillStyle = '#4e342e';
        for (let i = 0; i < 20; i++) {
            hctx.fillRect(Math.random() * 64, 0, 3 + Math.random() * 6, 256);
        }
        const handleTex = new THREE.CanvasTexture(handleCanvas);
        const handleMat = new THREE.MeshStandardMaterial({
            map: handleTex,
            roughness: 0.8,
            metalness: 0.1
        });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.set(0, 0, 0);

        // Grip wrap at bottom
        const gripGeo = new THREE.CylinderGeometry(0.029, 0.029, 0.22, 8);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.95 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(0, -0.24, 0);
        this.pickaxeGroup.add(grip);

        // Heavy forged forged steel pick head (curved dual-pointed pickaxe)
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.32, 0);

        // Metal collar clamp
        const collarGeo = new THREE.BoxGeometry(0.065, 0.08, 0.065);
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x78909c,
            roughness: 0.35,
            metalness: 0.85
        });
        const collar = new THREE.Mesh(collarGeo, steelMat);
        headGroup.add(collar);

        // Front pointed beak
        const beakGeo = new THREE.ConeGeometry(0.038, 0.36, 6);
        beakGeo.rotateZ(Math.PI / 2);
        const beak = new THREE.Mesh(beakGeo, steelMat);
        beak.position.set(0.18, 0, 0);
        beak.scale.set(1.0, 0.7, 0.6);
        headGroup.add(beak);

        // Back chisel / claw flat
        const clawGeo = new THREE.BoxGeometry(0.24, 0.04, 0.045);
        const claw = new THREE.Mesh(clawGeo, steelMat);
        claw.position.set(-0.13, 0, 0);
        headGroup.add(claw);

        this.pickaxeGroup.add(handle);
        this.pickaxeGroup.add(headGroup);

        // Scale to realistic first-person perspective
        this.pickaxeGroup.scale.set(0.9, 0.9, 0.9);
    }

    setVisible(visible) {
        this.pickaxeGroup.visible = visible;
    }

    swing(onImpactCallback) {
        if (this.isSwinging) return;
        this.isSwinging = true;
        this.swingProgress = 0;
        this.targetStrikeCallback = onImpactCallback;
        this.pickaxeGroup.visible = true;

        if (window.soundEngine && window.soundEngine.playWhoosh) {
            window.soundEngine.playWhoosh();
        }
    }

    triggerImpact(impactPos) {
        if (this.targetStrikeCallback) {
            this.targetStrikeCallback();
            this.targetStrikeCallback = null;
        }

        // Heavy steel impact sound
        if (window.soundEngine && window.soundEngine.playPickaxeClang) {
            window.soundEngine.playPickaxeClang(true);
        }

        // Spawn explosive physical spark particles
        this.spawnStrikeSparks(impactPos || this.getFrontStrikePoint());
    }

    getFrontStrikePoint() {
        const front = new THREE.Vector3(0, -0.1, -1.8);
        front.applyMatrix4(this.camera.matrixWorld);
        return front;
    }

    spawnStrikeSparks(pos) {
        const particleCount = 28;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 0] = pos.x + (Math.random() - 0.5) * 0.15;
            positions[i * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.15;
            positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.15;

            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 3.5,
                Math.random() * 3.2 + 0.8,
                (Math.random() - 0.5) * 3.5
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xffd54f,
            size: 0.08,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const pSystem = new THREE.Points(geo, mat);
        this.scene.add(pSystem);

        this.sparksEmitters.push({
            mesh: pSystem,
            velocities: velocities,
            life: 0.45,
            age: 0
        });
    }

    spawnRockShatterDebris(pos, rubbleColor) {
        const fragmentCount = 18;
        const fragments = new THREE.Group();

        for (let i = 0; i < fragmentCount; i++) {
            const size = 0.08 + Math.random() * 0.16;
            const rockGeo = new THREE.DodecahedronGeometry(size, 0);
            const rockMat = new THREE.MeshStandardMaterial({
                color: rubbleColor || 0x4a443c,
                roughness: 0.95
            });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.copy(pos);
            rock.position.x += (Math.random() - 0.5) * 0.6;
            rock.position.y += (Math.random() - 0.5) * 0.6;
            rock.position.z += (Math.random() - 0.5) * 0.6;

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 4.5,
                Math.random() * 3.5 + 1.2,
                (Math.random() - 0.5) * 4.5
            );
            rock.userData = { velocity: vel, rotSpeed: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5) };
            fragments.add(rock);
        }

        this.scene.add(fragments);

        // Animate debris falling down
        const startTime = performance.now();
        const animateDebris = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            if (elapsed > 1.2) {
                this.scene.remove(fragments);
                return;
            }
            fragments.children.forEach(rock => {
                rock.userData.velocity.y -= 9.8 * 0.016;
                rock.position.addScaledVector(rock.userData.velocity, 0.016);
                rock.rotation.x += rock.userData.rotSpeed.x * 0.016;
                rock.rotation.y += rock.userData.rotSpeed.y * 0.016;
            });
            requestAnimationFrame(animateDebris);
        };
        requestAnimationFrame(animateDebris);
    }

    update(delta, isWalking, isSprinting) {
        // Update sparks emitters
        for (let i = this.sparksEmitters.length - 1; i >= 0; i--) {
            const em = this.sparksEmitters[i];
            em.age += delta;
            const progress = em.age / em.life;
            em.mesh.material.opacity = Math.max(0, 1.0 - progress);

            const posAttr = em.mesh.geometry.attributes.position;
            for (let j = 0; j < em.velocities.length; j++) {
                const v = em.velocities[j];
                v.y -= 9.8 * delta; // Gravity
                posAttr.array[j * 3 + 0] += v.x * delta;
                posAttr.array[j * 3 + 1] += v.y * delta;
                posAttr.array[j * 3 + 2] += v.z * delta;
            }
            posAttr.needsUpdate = true;

            if (em.age >= em.life) {
                this.scene.remove(em.mesh);
                this.sparksEmitters.splice(i, 1);
            }
        }

        if (this.isSwinging) {
            this.swingProgress += delta / this.swingDuration;
            const p = this.swingProgress;

            if (p < 0.3) {
                // Windup: pull back and up
                const t = p / 0.3;
                this.pickaxeGroup.position.set(
                    this.basePosition.x + 0.12 * t,
                    this.basePosition.y + 0.22 * t,
                    this.basePosition.z + 0.15 * t
                );
                this.pickaxeGroup.rotation.set(
                    this.baseRotation.x - 0.7 * t,
                    this.baseRotation.y + 0.3 * t,
                    this.baseRotation.z - 0.4 * t
                );
            } else if (p < 0.6) {
                // Downward Strike smash
                const t = (p - 0.3) / 0.3;
                this.pickaxeGroup.position.set(
                    this.basePosition.x + 0.12 * (1 - t) - 0.1 * t,
                    this.basePosition.y + 0.22 * (1 - t) - 0.25 * t,
                    this.basePosition.z + 0.15 * (1 - t) - 0.28 * t
                );
                this.pickaxeGroup.rotation.set(
                    this.baseRotation.x - 0.7 * (1 - t) + 1.1 * t,
                    this.baseRotation.y + 0.3 * (1 - t) - 0.6 * t,
                    this.baseRotation.z - 0.4 * (1 - t) + 0.3 * t
                );

                // Trigger impact at apex of swing (p around 0.55)
                if (p >= 0.52 && this.targetStrikeCallback) {
                    this.triggerImpact();
                }
            } else if (p < 1.0) {
                // Recovery back to idle base position
                const t = (p - 0.6) / 0.4;
                this.pickaxeGroup.position.lerpVectors(
                    new THREE.Vector3(this.basePosition.x - 0.1, this.basePosition.y - 0.25, this.basePosition.z - 0.28),
                    this.basePosition,
                    t
                );
                this.pickaxeGroup.rotation.x = THREE.MathUtils.lerp(this.baseRotation.x + 1.1, this.baseRotation.x, t);
                this.pickaxeGroup.rotation.y = THREE.MathUtils.lerp(this.baseRotation.y - 0.6, this.baseRotation.y, t);
                this.pickaxeGroup.rotation.z = THREE.MathUtils.lerp(this.baseRotation.z + 0.3, this.baseRotation.z, t);
            } else {
                this.isSwinging = false;
                this.pickaxeGroup.position.copy(this.basePosition);
                this.pickaxeGroup.rotation.copy(this.baseRotation);
            }
        } else if (this.pickaxeGroup.visible) {
            // Natural first-person breathing bob
            const time = performance.now() * 0.003;
            const bobMult = isSprinting ? 2.5 : (isWalking ? 1.4 : 0.6);
            this.pickaxeGroup.position.x = this.basePosition.x + Math.sin(time) * 0.015 * bobMult;
            this.pickaxeGroup.position.y = this.basePosition.y + Math.cos(time * 2) * 0.012 * bobMult;
        }
    }
}

window.PickaxeSystem = PickaxeSystem;
