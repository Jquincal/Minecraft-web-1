// Chunk Mesher – runs as a Web Worker
// Receives chunk block data + neighbor data, returns buffer geometry arrays (including vertex colors for AO)
import { BLOCK_DEF, CHUNK_SIZE, CHUNK_HEIGHT } from '../engine/blocks.js';

const ATLAS_W = 16;
const TILE_PADDED = 32;
const TILE_CONTENT = 16;
const PADDING = 8;
const ATLAS_TOTAL = ATLAS_W * TILE_PADDED; // 512

function uvForTile(t) {
    const tx = t % ATLAS_W;
    const ty = Math.floor(t / ATLAS_W);
    const px0 = tx * TILE_PADDED + PADDING; // 8
    const py0 = ty * TILE_PADDED + PADDING; // 8
    const px1 = px0 + TILE_CONTENT;         // 24
    const py1 = py0 + TILE_CONTENT;         // 24

    // WebGL CanvasTexture flipY is false in our settings, so 0 is top.
    return {
        u0: px0 / ATLAS_TOTAL,
        u1: px1 / ATLAS_TOTAL,
        v0: py0 / ATLAS_TOTAL,
        v1: py1 / ATLAS_TOTAL
    };
}

// 6 faces: [normal dx,dy,dz], 4 corner offsets, texture property name, orthogonal axes A and B for AO
const FACES = [
    // -Y bottom. Normal: [0, -1, 0]. Ortho axes X(0) and Z(2)
    { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], t: 'bot', a: 0, b: 2 },
    // +Y top. Normal: [0, 1, 0]. Ortho axes X(0) and Z(2)
    { n: [0, 1, 0], c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], t: 'top', a: 0, b: 2 },
    // -Z back. Normal: [0, 0, -1]. Ortho axes X(0) and Y(1)
    { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], t: 'side', a: 0, b: 1 },
    // +Z front. Normal: [0, 0, 1]. Ortho axes X(0) and Y(1)
    { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], t: 'side', a: 0, b: 1 },
    // -X left. Normal: [-1, 0, 0]. Ortho axes Z(2) and Y(1)
    { n: [-1, 0, 0], c: [[0, 0, 1], [0, 0, 0], [0, 1, 0], [0, 1, 1]], t: 'side', a: 2, b: 1 },
    // +X right. Normal: [1, 0, 0]. Ortho axes Z(2) and Y(1)
    { n: [1, 0, 0], c: [[1, 0, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0]], t: 'side', a: 2, b: 1 },
];

function getB(blocks, nbrs, lx, ly, lz) {
    if (ly < 0 || ly >= CHUNK_HEIGHT) return 0;
    const S = CHUNK_SIZE, H = CHUNK_HEIGHT;
    if (lx < 0) return nbrs.nx ? nbrs.nx[(lx + S) + ly * S + lz * S * H] : 0;
    if (lx >= S) return nbrs.px ? nbrs.px[(lx - S) + ly * S + lz * S * H] : 0;
    if (lz < 0) return nbrs.nz ? nbrs.nz[lx + ly * S + (lz + S) * S * H] : 0;
    if (lz >= S) return nbrs.pz ? nbrs.pz[lx + ly * S + (lz - S) * S * H] : 0;
    return blocks[lx + ly * S + lz * S * H];
}

function isOpaqueBlock(blocks, nbrs, lx, ly, lz) {
    const b = getB(blocks, nbrs, lx, ly, lz);
    if (!b) return false;
    const def = BLOCK_DEF[b];
    return def && def.solid && !def.transparent;
}

self.onmessage = function ({ data }) {
    if (data.type !== 'mesh') return;
    const { chunkX, chunkZ, blocks, neighbors: nb, wx0, wz0, _wi } = data;
    const S = CHUNK_SIZE, H = CHUNK_HEIGHT;

    const pos = [], norm = [], uvArr = [], col = [], idxOpaque = [], idxTransp = [];
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

                    // Face culling
                    if (nb2 !== 0 && nbDef && nbDef.solid && !nbDef.transparent) continue;

                    // Glass doesn't cull against other transparent blocks EXCEPT itself
                    if (def.transparent && nb2 === bid) continue;

                    const tile = def[f.t];
                    const uv = uvForTile(tile);

                    // WebGL maps v0 at bottom normally, but our image is drawn 0->top. 
                    // So we invert v coordinate in the mapping explicitly for correct orientation.
                    const uvs = [[uv.u0, uv.v1], [uv.u1, uv.v1], [uv.u1, uv.v0], [uv.u0, uv.v0]];

                    for (let i = 0; i < 4; i++) {
                        const [cx, cy, cz] = f.c[i];
                        pos.push(wx + cx, wy + cy, wz + cz);
                        norm.push(f.n[0], f.n[1], f.n[2]);
                        uvArr.push(uvs[i][0], uvs[i][1]);

                        // Ambient Occlusion
                        const A = f.a, B = f.b;
                        const cArr = [cx, cy, cz];
                        const dirA = cArr[A] === 0 ? -1 : 1;
                        const dirB = cArr[B] === 0 ? -1 : 1;

                        // Origin block of neighbor check is the opaque block IN FRONT of the face
                        const originX = lx + f.n[0];
                        const originY = ly + f.n[1];
                        const originZ = lz + f.n[2];

                        const s1 = isOpaqueBlock(blocks, nb, originX + (A === 0 ? dirA : 0), originY + (A === 1 ? dirA : 0), originZ + (A === 2 ? dirA : 0));
                        const s2 = isOpaqueBlock(blocks, nb, originX + (B === 0 ? dirB : 0), originY + (B === 1 ? dirB : 0), originZ + (B === 2 ? dirB : 0));
                        const cr = isOpaqueBlock(blocks, nb, originX + (A === 0 ? dirA : 0) + (B === 0 ? dirB : 0),
                            originY + (A === 1 ? dirA : 0) + (B === 1 ? dirB : 0),
                            originZ + (A === 2 ? dirA : 0) + (B === 2 ? dirB : 0));

                        let aoVal = 0;
                        if (s1 && s2) aoVal = 3;
                        else aoVal = (s1 ? 1 : 0) + (s2 ? 1 : 0) + (cr ? 1 : 0);

                        // AO Brightness
                        const brightness = aoVal === 3 ? 0.45 : aoVal === 2 ? 0.6 : aoVal === 1 ? 0.8 : 1.0;

                        // Base face lighting (directional simulation)
                        const faceLight = f.n[1] === 1 ? 1.0 : f.n[1] === -1 ? 0.4 : 0.75;
                        const colorFinal = brightness * faceLight;

                        col.push(colorFinal, colorFinal, colorFinal);
                    }
                    if (def.transparent) {
                        idxTransp.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
                    } else {
                        idxOpaque.push(vc, vc + 1, vc + 2, vc, vc + 2, vc + 3);
                    }
                    vc += 4;
                }
            }
        }
    }

    const pArr = new Float32Array(pos);
    const nArr = new Float32Array(norm);
    const uArr = new Float32Array(uvArr);
    const cArr = new Float32Array(col);
    const iArr = new Uint32Array(idxOpaque.concat(idxTransp));

    self.postMessage(
        {
            type: 'result', chunkX, chunkZ, _wi,
            positions: pArr, normals: nArr, uvs: uArr, colors: cArr, indices: iArr,
            opaqueCount: idxOpaque.length, transpCount: idxTransp.length
        },
        [pArr.buffer, nArr.buffer, uArr.buffer, cArr.buffer, iArr.buffer]
    );
};
