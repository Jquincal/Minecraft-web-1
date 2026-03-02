// AABB Physics – collision & gravity for the player
import { BLOCK_DEF, CHUNK_HEIGHT } from './blocks.js';

export const GRAVITY = -28;
export const JUMP_VEL = 8.5;
export const WALK_SPEED = 5;
export const SNEAK_SPEED = 2;
export const SPRINT_SPEED = 8;
export const PLAYER_W = 0.6;
export const PLAYER_H = 1.8;
export const EYE_HEIGHT = 1.62;

export class Physics {
    constructor(world) {
        this.world = world;
    }

    /** move entity by velocity*dt, resolve collisions, return adjusted vel */
    step(pos, vel, dt, onGround) {
        const { world } = this;
        const hw = PLAYER_W / 2;
        let [vx, vy, vz] = vel;

        // gravity
        vy += GRAVITY * dt;

        // attempt X
        const nx = pos.x + vx * dt;
        if (!this._overlapsBlocks(world, nx, pos.y, pos.z, hw)) {
            pos.x = nx;
        } else { vx = 0; }

        // attempt Z
        const nz = pos.z + vz * dt;
        if (!this._overlapsBlocks(world, pos.x, pos.y, nz, hw)) {
            pos.z = nz;
        } else { vz = 0; }

        // attempt Y
        const ny = pos.y + vy * dt;
        let grounded = false;
        if (!this._overlapsBlocks(world, pos.x, ny, pos.z, hw)) {
            pos.y = ny;
        } else {
            if (vy < 0) grounded = true;
            vy = 0;
        }

        // clamp world bounds
        if (pos.y < 0) { pos.y = 0; vy = 0; grounded = true; }
        if (pos.y > CHUNK_HEIGHT - 2) pos.y = CHUNK_HEIGHT - 2;

        return { vel: [vx, vy, vz], grounded };
    }

    _overlapsBlocks(world, px, py, pz, hw) {
        const minX = Math.floor(px - hw), maxX = Math.floor(px + hw);
        const minY = Math.floor(py), maxY = Math.floor(py + PLAYER_H - 0.01);
        const minZ = Math.floor(pz - hw), maxZ = Math.floor(pz + hw);
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const bid = world.getBlock(x, y, z);
                    if (BLOCK_DEF[bid]?.solid) return true;
                }
            }
        }
        return false;
    }
}
