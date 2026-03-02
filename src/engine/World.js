import { createNoise2D } from 'simplex-noise';
import { BLOCK, BLOCK_DEF, CHUNK_SIZE, CHUNK_HEIGHT, SEA_LEVEL } from './blocks.js';

export class World {
    constructor(seed = Math.random()) {
        this.chunks = new Map();
        this.seed = seed;
        this._rng = this._mkRng(seed);
        this.noise = createNoise2D(this._rng);
        this.noise2 = createNoise2D(this._rng);
        this.noise3 = createNoise2D(this._rng);
        this.modified = new Set(); // chunk keys dirtied after generation
    }

    _mkRng(seed) {
        let s = seed;
        return () => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
    }

    _key(cx, cz) { return `${cx},${cz}`; }

    getChunk(cx, cz) { return this.chunks.get(this._key(cx, cz)); }

    generateChunk(cx, cz) {
        const SIZE = CHUNK_SIZE, H = CHUNK_HEIGHT;
        const blocks = new Uint8Array(SIZE * SIZE * H);
        const { noise, noise2, noise3 } = this;

        for (let lx = 0; lx < SIZE; lx++) {
            for (let lz = 0; lz < SIZE; lz++) {
                const wx = cx * SIZE + lx, wz = cz * SIZE + lz;

                // multi-octave height
                const n1 = noise(wx * 0.008, wz * 0.008);
                const n2 = noise2(wx * 0.03, wz * 0.03) * 0.4;
                const n3 = noise3(wx * 0.1, wz * 0.1) * 0.1;
                const surf = Math.floor(SEA_LEVEL + (n1 + n2 + n3) * 14);
                const height = Math.max(1, Math.min(H - 2, surf));

                // biome simple
                const temp = noise(wx * 0.003 + 1000, wz * 0.003 + 1000);
                const humid = noise2(wx * 0.004 + 2000, wz * 0.004 + 2000);
                const isCold = temp < -0.2;
                const isDesert = temp > 0.35 && humid < 0;
                const isForest = humid > 0.2 && !isDesert;

                for (let y = 0; y < H; y++) {
                    const idx = lx + y * SIZE + lz * SIZE * H;
                    let b = BLOCK.AIR;

                    if (y === 0) { b = BLOCK.BEDROCK; }
                    else if (y <= height - 5) {
                        b = BLOCK.STONE;
                        // ore veins
                        const ore = noise(wx * 0.15 + y * 0.3, wz * 0.15 + y * 0.2);
                        if (y < 20 && ore > 0.7) b = BLOCK.DIAMOND_ORE;
                        else if (y < 30 && ore > 0.6) b = BLOCK.GOLD_ORE;
                        else if (ore > 0.55) b = BLOCK.IRON_ORE;
                        else if (ore > 0.45) b = BLOCK.COAL_ORE;
                    }
                    else if (y < height) {
                        b = isDesert ? BLOCK.SAND : BLOCK.DIRT;
                    }
                    else if (y === height) {
                        if (isDesert) b = BLOCK.SAND;
                        else if (isCold) b = BLOCK.SNOW;
                        else b = BLOCK.GRASS;
                    }
                    else if (y <= SEA_LEVEL && y > height) {
                        b = BLOCK.WATER;
                    }

                    blocks[idx] = b;
                }

                // Trees (non-desert, non-cold, not underwater)
                if (isForest && !isDesert && !isCold && height > SEA_LEVEL) {
                    const treeRand = Math.abs(Math.sin(wx * 31.7 + wz * 17.3) * 10000) % 1;
                    if (treeRand < 0.04 && height + 7 < H) {
                        this._placeTree(blocks, cx, cz, lx, height + 1, lz, SIZE, H);
                    }
                }
                // Cactus in desert
                if (isDesert && height > SEA_LEVEL) {
                    const cactRand = Math.abs(Math.sin(wx * 41.1 + wz * 23.7) * 10000) % 1;
                    if (cactRand < 0.015 && height + 4 < H) {
                        for (let cy = height + 1; cy <= height + 3; cy++) {
                            blocks[lx + cy * SIZE + lz * SIZE * H] = BLOCK.CACTUS;
                        }
                    }
                }
            }
        }
        this.chunks.set(this._key(cx, cz), blocks);
        return blocks;
    }

    _placeTree(blocks, cx, cz, lx, startY, lz, SIZE, H) {
        const trunkH = 4 + (Math.random() * 2 | 0);
        for (let y = startY; y < startY + trunkH && y < H; y++) {
            blocks[lx + y * SIZE + lz * SIZE * H] = BLOCK.WOOD;
        }
        const top = startY + trunkH;
        for (let dy = -2; dy <= 1; dy++) {
            const r = dy < 0 ? 2 : 1;
            for (let dx = -r; dx <= r; dx++) {
                for (let dz = -r; dz <= r; dz++) {
                    if (Math.abs(dx) === r && Math.abs(dz) === r) continue;
                    const nx2 = lx + dx, ny2 = top + dy, nz2 = lz + dz;
                    if (nx2 >= 0 && nx2 < SIZE && nz2 >= 0 && nz2 < SIZE && ny2 >= 0 && ny2 < H) {
                        if (blocks[nx2 + ny2 * SIZE + nz2 * SIZE * H] === BLOCK.AIR)
                            blocks[nx2 + ny2 * SIZE + nz2 * SIZE * H] = BLOCK.LEAVES;
                    }
                }
            }
        }
    }

    _idx(lx, ly, lz) { return lx + ly * CHUNK_SIZE + lz * CHUNK_SIZE * CHUNK_HEIGHT; }

    getBlock(wx, wy, wz) {
        if (wy < 0 || wy >= CHUNK_HEIGHT) return 0;
        const cx = Math.floor(wx / CHUNK_SIZE), cz = Math.floor(wz / CHUNK_SIZE);
        const chunk = this.getChunk(cx, cz);
        if (!chunk) return 0;
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        return chunk[this._idx(lx, wy, lz)];
    }

    setBlock(wx, wy, wz, id) {
        if (wy < 0 || wy >= CHUNK_HEIGHT) return;
        const cx = Math.floor(wx / CHUNK_SIZE), cz = Math.floor(wz / CHUNK_SIZE);
        let chunk = this.getChunk(cx, cz);
        if (!chunk) chunk = this.generateChunk(cx, cz);
        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        chunk[this._idx(lx, wy, lz)] = id;
        this.modified.add(this._key(cx, cz));
        // also dirty adjacent chunks when on border
        if (lx === 0) this.modified.add(this._key(cx - 1, cz));
        if (lx === CHUNK_SIZE - 1) this.modified.add(this._key(cx + 1, cz));
        if (lz === 0) this.modified.add(this._key(cx, cz - 1));
        if (lz === CHUNK_SIZE - 1) this.modified.add(this._key(cx, cz + 1));
    }

    isSolid(wx, wy, wz) {
        const id = this.getBlock(wx, wy, wz);
        return BLOCK_DEF[id]?.solid || false;
    }

    groundY(wx, wz) {
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
            if (this.isSolid(wx, y, wz)) return y + 1;
        }
        return SEA_LEVEL + 1;
    }
}
