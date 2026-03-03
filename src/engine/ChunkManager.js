import * as THREE from 'three';
import MesherWorker from '../workers/mesher.js?worker';
import { CHUNK_SIZE, CHUNK_HEIGHT } from './blocks.js';

const WORKER_COUNT = 4;

export class ChunkManager {
    constructor(world, scene, textureAtlas) {
        this.world = world;
        this.scene = scene;
        this.atlas = textureAtlas;
        this.meshes = new Map(); // key → THREE.Mesh
        this.pending = new Set(); // keys being meshed
        this.renderDist = 5;

        // Worker pool
        this.workers = [];
        this.workerBusy = [];
        this.workerQueue = [];
        for (let i = 0; i < WORKER_COUNT; i++) {
            const w = new MesherWorker();
            w.onmessage = this._onWorkerResult.bind(this);
            this.workers.push(w);
            this.workerBusy.push(false);
        }

        // 1: Fully opaque blocks (stone, dirt, wood...)
        this.material = new THREE.MeshLambertMaterial({
            map: this.atlas,
            side: THREE.FrontSide,
            transparent: false,
            depthWrite: true,
            vertexColors: true,
        });
        // 2: Cutout blocks (leaves, glass) — alphaTest, NOT real transparency
        //    This MUST use transparent:false + alphaTest so depth sorting is skipped
        this.cutoutMaterial = new THREE.MeshLambertMaterial({
            map: this.atlas,
            side: THREE.DoubleSide,
            transparent: false,
            alphaTest: 0.5,
            depthWrite: true,
            vertexColors: true,
        });
        // 3: True transparent blocks (water, ice) — depthWrite:false
        this.transparentMaterial = new THREE.MeshLambertMaterial({
            map: this.atlas,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            blending: THREE.NormalBlending,
            vertexColors: true,
        });
    }

    _key(cx, cz) { return `${cx},${cz}`; }

    setRenderDistance(d) { this.renderDist = d; }

    update(playerPos) {
        const cx0 = Math.floor(playerPos.x / CHUNK_SIZE);
        const cz0 = Math.floor(playerPos.z / CHUNK_SIZE);
        const r = this.renderDist;

        // Generate missing chunks
        const needed = new Set();
        for (let dz = -r; dz <= r; dz++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dz * dz > r * r) continue;
                const cx = cx0 + dx, cz = cz0 + dz;
                const key = this._key(cx, cz);
                needed.add(key);
                if (!this.world.getChunk(cx, cz)) {
                    this.world.generateChunk(cx, cz);
                    this.world.modified.add(key);
                }
            }
        }

        // Remesh dirty or new chunks
        for (const key of needed) {
            const [cx, cz] = key.split(',').map(Number);
            if ((this.world.modified.has(key) || !this.meshes.has(key)) && !this.pending.has(key)) {
                this._requestMesh(cx, cz);
                this.world.modified.delete(key);
            }
        }

        // Remove far chunks
        for (const [key, mesh] of this.meshes) {
            if (!needed.has(key)) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                this.meshes.delete(key);
            }
        }
    }

    _getFreeWorker() {
        for (let i = 0; i < this.workers.length; i++) {
            if (!this.workerBusy[i]) return i;
        }
        return -1;
    }

    _requestMesh(cx, cz) {
        const key = this._key(cx, cz);
        if (this.pending.has(key)) return;

        const chunk = this.world.getChunk(cx, cz);
        if (!chunk) return;

        // Gather neighbor chunks
        const nb = {
            px: this.world.getChunk(cx + 1, cz),
            nx: this.world.getChunk(cx - 1, cz),
            pz: this.world.getChunk(cx, cz + 1),
            nz: this.world.getChunk(cx, cz - 1),
        };

        const job = { cx, cz, key, chunk, nb };
        const wi = this._getFreeWorker();
        if (wi === -1) {
            this.workerQueue.push(job);
        } else {
            this._sendToWorker(wi, job);
        }
        this.pending.add(key);
    }

    _sendToWorker(wi, { cx, cz, key, chunk, nb }) {
        this.workerBusy[wi] = true;
        // Clone neighbor arrays to avoid transfer issues
        const cloneOrNull = a => a ? new Uint8Array(a) : null;
        const payload = {
            type: 'mesh', chunkX: cx, chunkZ: cz,
            blocks: new Uint8Array(chunk),
            neighbors: { px: cloneOrNull(nb.px), nx: cloneOrNull(nb.nx), pz: cloneOrNull(nb.pz), nz: cloneOrNull(nb.nz) },
            wx0: cx * CHUNK_SIZE, wz0: cz * CHUNK_SIZE,
            _wi: wi,
        };
        this.workers[wi].postMessage(payload, [payload.blocks.buffer]);
    }

    _onWorkerResult({ data }) {
        const { chunkX, chunkZ, positions, normals, uvs, colors, indices, opaqueCount, cutoutCount, transpCount } = data;
        const key = this._key(chunkX, chunkZ);

        // Free worker
        const wi = data._wi ?? 0;
        // find which worker sent this
        this.workerBusy[wi] = false;
        this.pending.delete(key);

        // Process next in queue
        if (this.workerQueue.length) {
            const nextWi = this._getFreeWorker();
            if (nextWi !== -1) {
                const job = this.workerQueue.shift();
                this._sendToWorker(nextWi, job);
            }
        }

        if (positions.length === 0) return;

        // Remove old mesh
        const oldMesh = this.meshes.get(key);
        if (oldMesh) { this.scene.remove(oldMesh); oldMesh.geometry.dispose(); }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        if (colors) geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.setIndex(new THREE.BufferAttribute(indices, 1));

        // 3 material groups: opaque | cutout | transparent
        geo.addGroup(0, opaqueCount, 0);
        geo.addGroup(opaqueCount, cutoutCount, 1);
        geo.addGroup(opaqueCount + cutoutCount, transpCount, 2);

        geo.computeBoundingBox();

        const mesh = new THREE.Mesh(geo, [this.material, this.cutoutMaterial, this.transparentMaterial]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.meshes.set(key, mesh);
        this.scene.add(mesh);
    }

    handleWorldEdit(wx, wy, wz) {
        const cx = Math.floor(wx / CHUNK_SIZE), cz = Math.floor(wz / CHUNK_SIZE);
        this.world.modified.add(this._key(cx, cz));
    }

    get loadedCount() { return this.meshes.size; }
}
