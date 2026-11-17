/**
 * CANARY: The Collapse - 3D First-Person Pickaxe & Rock Shatter FX
 * Renders an authentic, sleek mining pickaxe in the player's view.
 * Kept hidden during general exploration; automatically equipped when near rubble barriers.
 */

class PickaxeSystem {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.pickaxeGroup = new THREE.Group();
        this.isSwinging = false;
        this.swingProgress = 0;
        this.swingDuration = 0.35; // Fast, punchy, visceral strike
        
        // Compact, refined first-person position in the lower-right corner
        this.basePosition = new THREE.Vector3(0.24, -0.20, -0.36);
        this.baseRotation = new THREE.Euler(-0.35, -0.42, 0.28);
        
        this.targetStrikeCallback = null;
        this.sparksEmitters = [];
        this.debrisEmitters = [];

        this.buildPickaxeMesh();
        this.camera.add(this.pickaxeGroup);
        this.pickaxeGroup.position.copy(this.basePosition);
        this.pickaxeGroup.rotation.copy(this.baseRotation);
        this.pickaxeGroup.visible = false; // Hidden until near rubble to break rock!
    }

    buildPickaxeMesh() {
        // 1. Sleek, refined hardwood handle
        const handleGeo = new THREE.CylinderGeometry(0.013, 0.016, 0.58, 12);
        const handleCanvas = document.createElement('canvas');
        handleCanvas.width = 64; handleCanvas.height = 256;
        const hctx = handleCanvas.getContext('2d');
        hctx.fillStyle = '#3e2723';
        hctx.fillRect(0, 0, 64, 256);
        hctx.fillStyle = '#271710';
        for (let i = 0; i < 20; i++) {
            hctx.fillRect(Math.random() * 64, 0, 2 + Math.random() * 4, 256);
        }
        const handleTex = new THREE.CanvasTexture(handleCanvas);
        const handleMat = new THREE.MeshStandardMaterial({
            map: handleTex,
            roughness: 0.65,
            metalness: 0.15
        });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.set(0, 0, 0);

        // Grip wrap at bottom
        const gripGeo = new THREE.CylinderGeometry(0.017, 0.017, 0.18, 12);
        const gripMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(0, -0.21, 0);
        this.pickaxeGroup.add(grip);

        // 2. Realistic forged steel pick head
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.27, 0);

        // Polished steel material with specular shine
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0xcfd8dc,
            roughness: 0.18,
            metalness: 0.95
        });

        // Metal collar clamp
        const collarGeo = new THREE.BoxGeometry(0.045, 0.055, 0.045);
        const collar = new THREE.Mesh(collarGeo, steelMat);
        headGroup.add(collar);

        // Sharp curved pointed beak (pointing forward toward target)
        const beakGeo = new THREE.ConeGeometry(0.026, 0.32, 10);
        beakGeo.rotateZ(Math.PI / 2);
        const beak = new THREE.Mesh(beakGeo, steelMat);
        beak.position.set(0.16, 0, 0);
        beak.scale.set(1.0, 0.70, 0.60);
        headGroup.add(beak);

        // Back chisel / hammer flat
        const clawGeo = new THREE.BoxGeometry(0.16, 0.032, 0.036);
        const claw = new THREE.Mesh(clawGeo, steelMat);
        claw.position.set(-0.09, 0, 0);
        headGroup.add(claw);

        this.pickaxeGroup.add(handle);
        this.pickaxeGroup.add(headGroup);

        // Compact, refined viewmodel scale (does NOT block the screen!)
        this.pickaxeGroup.scale.set(0.70, 0.70, 0.70);
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

        // Camera recoil / screen shake
        if (window.gamePlayer) {
            window.gamePlayer.pitch += (Math.random() - 0.5) * 0.03;
            window.gamePlayer.yaw += (Math.random() - 0.5) * 0.02;
        }

        // Spawn explosive physical spark particles
        const hitPoint = impactPos || this.getFrontStrikePoint();
        this.spawnStrikeSparks(hitPoint);
        this.spawnRockShatterDebris(hitPoint, 0x1e242c);
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
                (Math.random() - 0.5) * 4.2,
                Math.random() * 3.8 + 1.0,
                (Math.random() - 0.5) * 4.2
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0x00e5ff, // Cinematic cyan-blue sparks with golden flecks
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
            const size = 0.06 + Math.random() * 0.14;
            const rockGeo = new THREE.DodecahedronGeometry(size, 0);
            const rockMat = new THREE.MeshStandardMaterial({
                color: rubbleColor || 0x1e242c,
                roughness: 0.90
            });
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.copy(pos);
            rock.position.x += (Math.random() - 0.5) * 0.5;
            rock.position.y += (Math.random() - 0.5) * 0.5;
            rock.position.z += (Math.random() - 0.5) * 0.5;

            const vel = new THREE.Vector3(
                (Math.random() - 0.5) * 4.5,
                Math.random() * 3.5 + 1.0,
                (Math.random() - 0.5) * 4.5
            );
            rock.userData = {
                velocity: vel,
                rotSpeed: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6)
            };
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

            if (p < 0.25) {
                // Windup: raise pickaxe up and back
                const t = p / 0.25;
                this.pickaxeGroup.position.set(
                    this.basePosition.x + 0.05 * t,
                    this.basePosition.y + 0.20 * t,
                    this.basePosition.z + 0.06 * t
                );
                this.pickaxeGroup.rotation.set(
                    this.baseRotation.x - 0.70 * t,
                    this.baseRotation.y + 0.35 * t,
                    this.baseRotation.z + 0.20 * t
                );
            } else if (p < 0.60) {
                // Violent chopping arc down-forward into the rock
                const t = (p - 0.25) / 0.35;
                const easeT = t * t;
                this.pickaxeGroup.position.set(
                    THREE.MathUtils.lerp(this.basePosition.x + 0.05, 0.04, easeT),
                    THREE.MathUtils.lerp(this.basePosition.y + 0.20, -0.15, easeT),
                    THREE.MathUtils.lerp(this.basePosition.z + 0.06, -0.46, easeT)
                );
                this.pickaxeGroup.rotation.set(
                    THREE.MathUtils.lerp(this.baseRotation.x - 0.70, 0.85, easeT),
                    THREE.MathUtils.lerp(this.baseRotation.y + 0.35, -0.65, easeT),
                    THREE.MathUtils.lerp(this.baseRotation.z + 0.20, -0.15, easeT)
                );

                if (p >= 0.45 && this.targetStrikeCallback) {
                    this.triggerImpact();
                }
            } else if (p < 1.0) {
                // Smooth return to ready stance
                const t = (p - 0.60) / 0.40;
                this.pickaxeGroup.position.lerpVectors(
                    new THREE.Vector3(0.04, -0.15, -0.46),
                    this.basePosition,
                    t
                );
                this.pickaxeGroup.rotation.x = THREE.MathUtils.lerp(0.85, this.baseRotation.x, t);
                this.pickaxeGroup.rotation.y = THREE.MathUtils.lerp(-0.65, this.baseRotation.y, t);
                this.pickaxeGroup.rotation.z = THREE.MathUtils.lerp(-0.15, this.baseRotation.z, t);
            } else {
                this.isSwinging = false;
                this.pickaxeGroup.position.copy(this.basePosition);
                this.pickaxeGroup.rotation.copy(this.baseRotation);
                // If not currently near active rubble, immediately conceal pickaxe
                if (!window.eventManager || !window.eventManager.currentRubble) {
                    this.pickaxeGroup.visible = false;
                }
            }
        } else if (this.pickaxeGroup.visible) {
            // Natural first-person breathing & footsteps bob
            const time = performance.now() * 0.003;
            const bobMult = isSprinting ? 2.2 : (isWalking ? 1.2 : 0.5);
            this.pickaxeGroup.position.x = this.basePosition.x + Math.sin(time) * 0.012 * bobMult;
            this.pickaxeGroup.position.y = this.basePosition.y + Math.cos(time * 2) * 0.008 * bobMult;
        }
    }
}

window.PickaxeSystem = PickaxeSystem;
