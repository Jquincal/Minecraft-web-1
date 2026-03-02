import * as THREE from 'three';
import { Physics, GRAVITY, JUMP_VEL, WALK_SPEED, SNEAK_SPEED, SPRINT_SPEED, PLAYER_W, PLAYER_H, EYE_HEIGHT } from './Physics.js';
import { BLOCK, BLOCK_DEF, getItemDef, getBlockDef, isBlockItem } from './blocks.js';

const MAX_REACH = 6;
const BREAK_TIME_BASE = 0.8; // seconds to break a block bare-handed

export class Player {
    constructor(camera, world, canvas) {
        this.camera = camera;
        this.world = world;
        this.canvas = canvas;
        this.physics = new Physics(world);

        // Position & velocity
        this.pos = new THREE.Vector3(8, 40, 8);
        this.vel = [0, 0, 0]; // [vx,vy,vz]
        this.onGround = false;

        // Look angles
        this.yaw = 0; // radians, Y axis
        this.pitch = 0; // radians, X axis (clamped ±89°)
        this.mouseSensitivity = 0.0015;

        // Input state
        this.keys = {};
        this.sneaking = false;
        this.sprinting = false;

        // Inventory: 36 slots [{id,count}|null]
        this.inventory = Array(36).fill(null);
        this.hotbarSlot = 0; // 0..8

        // Block breaking
        this.breakTarget = null; // {x,y,z}
        this.breakProgress = 0;  // 0..1
        this.breakHeld = false;

        // Targeted block (raycasting result)
        this.targeted = null; // {pos:{x,y,z}, face:{x,y,z}}

        // Health/hunger
        this.health = 20;
        this.hunger = 20;

        // Stats
        this.fps = 60;

        // Pointer lock
        this.locked = false;

        // Give starting items
        this._giveStartingItems();
        this._bindInputs();
    }

    _giveStartingItems() {
        const starters = [
            { id: BLOCK.GRASS, count: 64 }, { id: BLOCK.DIRT, count: 64 },
            { id: BLOCK.STONE, count: 64 }, { id: BLOCK.PLANKS, count: 32 },
            { id: BLOCK.WOOD, count: 16 }, { id: BLOCK.SAND, count: 32 },
            { id: BLOCK.GLASS, count: 16 }, { id: BLOCK.COBBLESTONE, count: 64 },
        ];
        starters.forEach((s, i) => { this.inventory[i] = s; });
    }

    _bindInputs() {
        document.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            // Hotbar slots
            if (e.code.startsWith('Digit')) {
                const n = parseInt(e.code.replace('Digit', '')) - 1;
                if (n >= 0 && n <= 8) this.hotbarSlot = n;
            }
        });
        document.addEventListener('keyup', e => { this.keys[e.code] = false; });

        // Mouse look
        document.addEventListener('mousemove', e => {
            if (!this.locked) return;
            this.yaw -= e.movementX * this.mouseSensitivity;
            this.pitch -= e.movementY * this.mouseSensitivity;
            const lim = Math.PI / 2 - 0.01;
            this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
        });

        // Pointer lock change
        document.addEventListener('pointerlockchange', () => {
            this.locked = document.pointerLockElement === this.canvas;
        });

        // Mouse buttons
        this.canvas.addEventListener('mousedown', e => {
            if (!this.locked) { this.canvas.requestPointerLock(); return; }
            if (e.button === 0) this.breakHeld = true;
            if (e.button === 2) this._placeBlock();
        });
        this.canvas.addEventListener('mouseup', e => {
            if (e.button === 0) { this.breakHeld = false; this.breakProgress = 0; this.breakTarget = null; }
        });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        // Scroll hotbar
        this.canvas.addEventListener('wheel', e => {
            this.hotbarSlot = ((this.hotbarSlot + (e.deltaY > 0 ? 1 : -1)) + 9) % 9;
        });
    }

    /** Raycast into world, find targeted block & face */
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
                // face = last air position - hit position
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

    _breakBlock() {
        if (!this.targeted) return;
        const { x, y, z, id } = this.targeted;

        // Same target?
        if (!this.breakTarget || this.breakTarget.x !== x || this.breakTarget.y !== y || this.breakTarget.z !== z) {
            this.breakTarget = { x, y, z };
            this.breakProgress = 0;
        }
        const def = getBlockDef(id);
        if (!def || def.drop === 0 && id === BLOCK.BEDROCK) { this.breakProgress = 0; return; }

        this.breakProgress += this._dt / BREAK_TIME_BASE;
        if (this.breakProgress >= 1) {
            const drop = def.drop;
            if (drop) this.addItem(drop, 1);
            this.world.setBlock(x, y, z, BLOCK.AIR);
            this.breakTarget = null; this.breakProgress = 0;
        }
    }

    _placeBlock() {
        if (!this.targeted) return;
        const slot = this.inventory[this.hotbarSlot];
        if (!slot) return;
        const { pos, face } = this.targeted;
        const nx = pos.x + face.x, ny = pos.y + face.y, nz = pos.z + face.z;
        if (ny < 0 || ny >= 64) return;

        // Check not inside player
        const ph = Math.floor(this.pos.x), py0 = Math.floor(this.pos.y), py1 = Math.floor(this.pos.y + PLAYER_H - 0.1), pz = Math.floor(this.pos.z);
        if (nx === ph && nz === pz && (ny === py0 || ny === py1)) return;

        const id = slot.id;
        if (!isBlockItem(id)) return;
        this.world.setBlock(nx, ny, nz, id);
        slot.count--;
        if (slot.count <= 0) this.inventory[this.hotbarSlot] = null;
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

    update(dt) {
        this._dt = dt;
        if (!this.locked) return;

        this.sneaking = !!this.keys['ShiftLeft'];
        this.sprinting = !!this.keys['ControlLeft'];

        const speed = this.sneaking ? SNEAK_SPEED : this.sprinting ? SPRINT_SPEED : WALK_SPEED;

        // Movement in yaw direction
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

        // Apply camera
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
    }
}
