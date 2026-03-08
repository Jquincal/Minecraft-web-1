import * as THREE from 'three';
import { Physics, GRAVITY, JUMP_VEL, WALK_SPEED, SNEAK_SPEED, SPRINT_SPEED, PLAYER_W, PLAYER_H, EYE_HEIGHT } from './Physics.js';
import { BLOCK, BLOCK_DEF, ITEM, getItemDef, getBlockDef, isBlockItem } from './blocks.js';

const MAX_REACH = 6;
const FLY_SPEED = 10;
const FLY_ACCEL = 25;

export class Player {
    constructor(camera, world, canvas, mode = 'survival') {
        this.camera = camera;
        this.world = world;
        this.canvas = canvas;
        this.physics = new Physics(world);
        this.mode = mode; // 'survival' | 'creative'

        // Position & velocity
        this.pos = new THREE.Vector3(8, 40, 8);
        this.vel = [0, 0, 0];
        this.onGround = false;

        // Look angles
        this.yaw = 0;
        this.pitch = 0;
        this.mouseSensitivity = 0.0015;

        // Input
        this.keys = {};
        this.sneaking = false;
        this.sprinting = false;

        // Creative flight
        this.flying = (mode === 'creative');
        this._lastSpaceTap = 0;    // for double-tap Space to toggle fly
        this._flyVelY = 0;

        // Inventory: 36 slots
        this.inventory = Array(36).fill(null);
        this.hotbarSlot = 0;

        // Block breaking
        this.breakTarget = null;
        this.breakProgress = 0;
        this.breakHeld = false;
        this._breakTime = 1; // seconds required for current target

        // Targeted block
        this.targeted = null;

        // Survival stats
        this.health = 20;
        this.hunger = 20;
        this.saturation = 5;
        this.exhaustion = 0;
        this._regenTimer = 0;
        this._starvTimer = 0;

        // Stats
        this.fps = 60;
        this._dt = 0;

        // Pointer lock
        this.locked = false;

        // Initialise inventory based on mode
        if (mode === 'creative') {
            this._giveAllBlocks();
        } else {
            this._giveStartingItems();
        }

        this._bindInputs();
    }

    _giveStartingItems() {
        // Survival: start with nothing — must mine everything
        // Give just a wooden pickaxe to get started
        this.inventory[0] = { id: ITEM.WOODEN_PICKAXE, count: 1 };
    }

    _giveAllBlocks() {
        // Creative: fill hotbar + inventory with one of every block
        let slot = 0;
        for (let id = 1; id < BLOCK_DEF.length && slot < 36; id++) {
            const def = BLOCK_DEF[id];
            if (!def || !def.solid || def.stack === 0) continue;
            this.inventory[slot++] = { id, count: 64 };
        }
    }

    _bindInputs() {
        document.addEventListener('keydown', e => {
            const prev = this.keys[e.code];
            this.keys[e.code] = true;

            // Hotbar slots 1-9
            if (e.code.startsWith('Digit')) {
                const n = parseInt(e.code.replace('Digit', '')) - 1;
                if (n >= 0 && n <= 8) this.hotbarSlot = n;
            }

            // Double-tap Space to toggle flying (creative only)
            if (e.code === 'Space' && this.mode === 'creative' && !prev) {
                const now = performance.now();
                if (now - this._lastSpaceTap < 300) {
                    this.flying = !this.flying;
                    this._flyVelY = 0;
                }
                this._lastSpaceTap = now;
            }
        });
        document.addEventListener('keyup', e => { this.keys[e.code] = false; });

        document.addEventListener('mousemove', e => {
            if (!this.locked) return;
            this.yaw -= e.movementX * this.mouseSensitivity;
            this.pitch -= e.movementY * this.mouseSensitivity;
            const lim = Math.PI / 2 - 0.01;
            this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
        });

        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === this.canvas;
        });

        this.canvas.addEventListener('mousedown', e => {
            // Prevent pointer lock request if mobile controls are active (touch interface)
            if (window.matchMedia('(pointer: coarse)').matches) return;

            if (!this.locked) { this.canvas.requestPointerLock(); return; }
            if (e.button === 0) this.breakHeld = true;
            if (e.button === 2) this._placeBlock();
        });
        this.canvas.addEventListener('mouseup', e => {
            if (window.matchMedia('(pointer: coarse)').matches) return;

            if (e.button === 0) {
                this.breakHeld = false;
                this.breakProgress = 0;
                this.breakTarget = null;
            }
        });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        this.canvas.addEventListener('wheel', e => {
            if (!this.locked && !window.matchMedia('(pointer: coarse)').matches) return;
            this.hotbarSlot = ((this.hotbarSlot + (e.deltaY > 0 ? 1 : -1)) + 9) % 9;
        });
    }

    /** Raycast into world */
    _raycast() {
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
        const eye = this.pos.clone().add(new THREE.Vector3(0, EYE_HEIGHT, 0));

        let t = 0, result = null;
        const step = 0.05;
        let lastPos = null;
        while (t <= MAX_REACH) {
            const x = Math.floor(eye.x + dir.x * t);
            const y = Math.floor(eye.y + dir.y * t);
            const z = Math.floor(eye.z + dir.z * t);
            const bid = this.world.getBlock(x, y, z);
            if (bid !== BLOCK.AIR && BLOCK_DEF[bid]?.solid) {
                let face = { x: 0, y: 0, z: 0 };
                if (lastPos) {
                    face.x = lastPos[0] - x;
                    face.y = lastPos[1] - y;
                    face.z = lastPos[2] - z;
                }
                result = { pos: { x, y, z }, face, id: bid };
                break;
            }
            lastPos = [x, y, z];
            t += step;
        }
        return result;
    }

    /** Calculate break time in seconds based on hardness */
    _calcBreakTime(def) {
        if (!def || def.hardness === Infinity) return Infinity;

        // Game mode multipliers for breaking speed
        const BREAK_MULTIPLIERS = {
            survival: 1.0,
            creative: 0.0,
            spectator: Infinity
        };

        const modeMultiplier = BREAK_MULTIPLIERS[this.mode] ?? 1.0;

        if (modeMultiplier === 0 || def.hardness === 0) return 0;

        const miningSpeed = 1.0; // bare hands for now
        // Approximate Minecraft timing (1.5 seconds per hardness unit with bare hands)
        const baseDuration = (def.hardness * 1.5) / miningSpeed;
        return baseDuration * modeMultiplier;
    }

    _breakBlock() {
        if (!this.targeted) return;
        const { pos, id } = this.targeted;
        const { x, y, z } = pos;
        const def = getBlockDef(id);

        if (def.hardness === Infinity) { this.breakProgress = 0; return; }

        // New target?
        if (!this.breakTarget || this.breakTarget.x !== x || this.breakTarget.y !== y || this.breakTarget.z !== z) {
            this.breakTarget = { x, y, z };
            this.breakProgress = 0;
            this._breakTime = this._calcBreakTime(def);
        }

        if (this._breakTime === Infinity) return;

        // If duration is 0, break instantly
        if (this._breakTime === 0) {
            if (this.mode !== 'creative') this._rollLoot(def);
            this.world.setBlock(x, y, z, BLOCK.AIR);
            this.breakTarget = null;
            this.breakProgress = 0;
            return;
        }

        // Gradual progress
        this.breakProgress += this._dt / this._breakTime;
        if (this.breakProgress >= 1.0) {
            if (this.mode !== 'creative') this._rollLoot(def);
            this.world.setBlock(x, y, z, BLOCK.AIR);
            this.breakTarget = null;
            this.breakProgress = 0;
            this._addExhaustion(0.005);
        }
    }

    /** Roll loot table and give items to player */
    _rollLoot(def) {
        if (!def.loot) return;
        for (const entry of def.loot) {
            if (Math.random() <= entry.chance) {
                const n = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
                this.addItem(entry.id, n);
            }
        }
    }

    _placeBlock() {
        if (!this.targeted) return;
        const slot = this.inventory[this.hotbarSlot];
        if (!slot) return;
        const { pos, face } = this.targeted;
        const nx = pos.x + face.x, ny = pos.y + face.y, nz = pos.z + face.z;
        if (ny < 0 || ny >= 64) return;

        const ph = Math.floor(this.pos.x), py0 = Math.floor(this.pos.y), py1 = Math.floor(this.pos.y + PLAYER_H - 0.1), pz = Math.floor(this.pos.z);
        if (nx === ph && nz === pz && (ny === py0 || ny === py1)) return;

        const id = slot.id;
        if (!isBlockItem(id)) return;
        this.world.setBlock(nx, ny, nz, id);

        // In survival, consume the block
        if (this.mode === 'survival') {
            slot.count--;
            if (slot.count <= 0) this.inventory[this.hotbarSlot] = null;
        }
    }

    addItem(id, count) {
        // Try to stack
        for (let i = 0; i < 36; i++) {
            if (this.inventory[i] && this.inventory[i].id === id) {
                const def = getItemDef(id);
                if (this.inventory[i].count < (def?.stack || 64)) {
                    this.inventory[i].count += count;
                    return true;
                }
            }
        }
        // Empty slot
        for (let i = 0; i < 36; i++) {
            if (!this.inventory[i]) { this.inventory[i] = { id, count }; return true; }
        }
        return false;
    }

    getHeldItem() { return this.inventory[this.hotbarSlot] || null; }

    // ── Survival: Hunger / Exhaustion ─────────────────────────────────────────
    _addExhaustion(amount) {
        if (this.mode !== 'survival') return;
        this.exhaustion += amount;
        while (this.exhaustion >= 4.0) {
            this.exhaustion -= 4.0;
            if (this.saturation > 0) {
                this.saturation = Math.max(0, this.saturation - 1);
            } else {
                this.hunger = Math.max(0, this.hunger - 1);
            }
        }
    }

    _updateSurvival(dt) {
        if (this.mode !== 'survival') return;

        // Exhaustion from movement
        if (this.sprinting && this.onGround) this._addExhaustion(0.1 * dt);
        else if (this.onGround) this._addExhaustion(0.0 * dt);

        if (this.keys['Space'] && !this.onGround) this._addExhaustion(0.02 * dt);

        // Health regeneration when well-fed
        if (this.hunger >= 18 && this.health < 20) {
            this._regenTimer += dt;
            if (this._regenTimer >= 1.0) {
                this._regenTimer = 0;
                this.health = Math.min(20, this.health + 1);
                this._addExhaustion(6.0); // regen costs exhaustion
            }
        } else {
            this._regenTimer = 0;
        }

        // Starvation damage (hunger === 0)
        if (this.hunger <= 0) {
            this._starvTimer += dt;
            if (this._starvTimer >= 4.0) {
                this._starvTimer = 0;
                if (this.health > 1) this.health -= 1; // normal difficulty: stop at 1
            }
        } else {
            this._starvTimer = 0;
        }
    }

    // ── Main update ───────────────────────────────────────────────────────────
    update(dt) {
        this._dt = dt;

        // Mobile overrides lock requirement
        const isMobile = window.matchMedia('(pointer: coarse)').matches;
        if (!this.locked && !isMobile) return;

        this.sneaking = !!this.keys['ShiftLeft'];
        this.sprinting = !!this.keys['ControlLeft'];

        if (this.flying && this.mode === 'creative') {
            this._updateFlying(dt);
        } else {
            this._updateWalking(dt);
        }

        // Camera
        this.camera.position.set(this.pos.x, this.pos.y + EYE_HEIGHT, this.pos.z);
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // Raycasting
        this.targeted = this._raycast();

        // Block breaking
        if (this.breakHeld && this.targeted) {
            this._breakBlock();
        } else {
            this.breakProgress = 0;
            this.breakTarget = null;
        }

        // Survival systems
        this._updateSurvival(dt);
    }

    _updateWalking(dt) {
        const speed = this.sneaking ? SNEAK_SPEED : this.sprinting ? SPRINT_SPEED : WALK_SPEED;

        const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const rgt = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        const move = new THREE.Vector3();
        if (this.keys['KeyW']) move.addScaledVector(fwd, 1);
        if (this.keys['KeyS']) move.addScaledVector(fwd, -1);
        if (this.keys['KeyA']) move.addScaledVector(rgt, -1);
        if (this.keys['KeyD']) move.addScaledVector(rgt, 1);
        if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);

        this.vel[0] = move.x;
        this.vel[2] = move.z;

        // Jump
        if (this.keys['Space'] && this.onGround) { this.vel[1] = JUMP_VEL; this.onGround = false; }

        const result = this.physics.step(this.pos, this.vel, dt, this.onGround);
        this.vel = result.vel;
        if (result.grounded) { this.onGround = true; this.vel[1] = 0; }
        else { this.onGround = false; }
    }

    _updateFlying(dt) {
        const speed = FLY_SPEED;
        const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const rgt = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        const move = new THREE.Vector3();
        if (this.keys['KeyW']) move.addScaledVector(fwd, 1);
        if (this.keys['KeyS']) move.addScaledVector(fwd, -1);
        if (this.keys['KeyA']) move.addScaledVector(rgt, -1);
        if (this.keys['KeyD']) move.addScaledVector(rgt, 1);
        if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);

        // Vertical fly
        let vy = 0;
        if (this.keys['Space']) vy = speed;
        if (this.keys['ShiftLeft']) vy = -speed;

        this.pos.x += move.x * dt;
        this.pos.z += move.z * dt;
        this.pos.y += vy * dt;
        this.pos.y = Math.max(0, this.pos.y);
        this.onGround = false;
    }
}
