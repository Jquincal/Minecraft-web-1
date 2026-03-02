// Chunk Mesher – runs as a Web Worker
// Receives chunk block data + neighbor data, returns buffer geometry arrays
import { BLOCK_DEF, CHUNK_SIZE, CHUNK_HEIGHT } from '../engine/blocks.js';

const ATLAS_W = 16; // tiles per row in atlas

function uvForTile(t) {
    const tx = t % ATLAS_W, ty = Math.floor(t / ATLAS_W);
    return { u0: tx / ATLAS_W, u1: (tx + 1) / ATLAS_W, v0: ty / ATLAS_W, v1: (ty + 1) / ATLAS_W };
}

// 6 faces: [normal dx,dy,dz], 4 corner offsets, which tile property
const FACES = [
    // -Y bottom
    { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], t: 'bot' },
    // +Y top
    { n: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], t: 'top' },
    // -Z back
    { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], t: 'side' },
    // +Z front
    { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], t: 'side' },
    // -X left
    { n: [-1, 0, 0], c: [[0, 0, 1], [0, 0, 0], [0, 1, 0], [0, 1, 1]], t: 'side' },
    // +X right
    { n: [1, 0, 0], c: [[1, 0, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0]], t: 'side' },
];

function getB(blocks, nbrs, lx, ly, lz) {
    if (ly < 0 || ly >= CHUNK_HEIGHT) return 0;
    const S = CHUNK_SIZE, H = CHUNK_HEIGHT;
    if (lx < 0) {
        if (!nbrs.nx) return 1; // treat as solid (don't render edge)
        return nbrs.nx[(lx + S) + ly * S + lz * S * H];
    }
    if (lx >= S) {
        if (!nbrs.px) return 1;
        return nbrs.px[(lx - S) + ly * S + lz * S * H];
    }
    if (lz < 0) {
        if (!nbrs.nz) return 1;
        return nbrs.nz[lx + ly * S + (lz + S) * S * H];
    }
    if (lz >= S) {
        if (!nbrs.pz) return 1;
        return nbrs.pz[lx + ly * S + (lz - S) * S * H];
    }
    return blocks[lx + ly * S + lz * S * H];
}

self.onmessage = function ({ data }) {
    if (data.type !== 'mesh') return;
    const { chunkX, chunkZ, blocks, neighbors: nb, wx0, wz0 } = data;
    const S = CHUNK_SIZE, H = CHUNK_HEIGHT;

    const pos = [], norm = [], uvArr = [], idx = [];
    let vc = 0;

    for (let lz = 0; lz < S; lz++) {
        for (let ly = 0; ly < H; ly++) {
            for (let lx = 0; lx < S; lx++) {
                const bid = blocks[lx + ly * S + lz * S * H];
                if (!bid) continue;
                const def = BLOCK_DEF[bid];
                if (!def || !def.solid) continue;

                const wx = wx0 + lx, wy = ly, wz = wz0 + lz;

                for (const f of FACES) {
                    const nx = lx + f.n[0], ny = ly + f.n[1], nz = lz + f.n[2];
                    const nb2 = getB(blocks, nb, nx, ny, nz);
                    const nbDef = BLOCK_DEF[nb2];
                    // skip face if neighbor is solid & opaque
                    if (nb2 !== 0 && nbDef && nbDef.solid && !nbDef.transparent) continue;

                    const tile = def[f.t];
                    const uv = uvForTile(tile);
                    const uvs = [[uv.u0, uv.v1], [uv.u1, uv.v1], [uv.u1, uv.v0], [uv.u0, uv.v0]];

                    // ambient occlusion brightness
                    const bright = f.n[1] === 1 ? 1.0 : f.n[1] === -1 ? 0.5 : 0.75;

                    for (let i = 0; i < 4; i++) {
                        const [cx, cy, cz] = f.c[i];
                        pos.push(wx + cx, wy + cy, wz + cz);
                        norm.push(f.n[0], f.n[1], f.n[2]);
                        uvArr.push(uvs[i][0], uvs[i][1]);
                        // pack brightness into 4th component (unused, stored separately)
                    }
                    idx.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
                    vc += 4;
                }
            }
        }
    }

    const pArr = new Float32Array(pos);
    const nArr = new Float32Array(norm);
    const uArr = new Float32Array(uvArr);
    const iArr = new Uint32Array(idx);

    self.postMessage(
        { type: 'result', chunkX, chunkZ, positions: pArr, normals: nArr, uvs: uArr, indices: iArr },
        [pArr.buffer, nArr.buffer, uArr.buffer, iArr.buffer]
    );
};
