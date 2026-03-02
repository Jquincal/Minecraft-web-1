import * as THREE from 'three';
import { TEXTURE_FILES } from '../engine/blocks.js';

export const ATLAS_TILES_PER_ROW = 16;
export const TILE_CONTENT_PX = 16;
export const TILE_PADDING_PX = 8; // 8px padding according to Bedrock specs for 4 mip levels
export const TILE_TOTAL_PX = TILE_CONTENT_PX + (TILE_PADDING_PX * 2); // 32
export const ATLAS_TOTAL_PX = ATLAS_TILES_PER_ROW * TILE_TOTAL_PX; // 512

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(url);
        img.src = url;
    });
}

function drawTileWithPadding(ctx, img, destX, destY) {
    const P = TILE_PADDING_PX;
    const S = TILE_CONTENT_PX;

    // Center core
    ctx.drawImage(img, 0, 0, S, S, destX + P, destY + P, S, S);

    // Edges
    ctx.drawImage(img, 0, 0, S, 1, destX + P, destY, S, P); // Top
    ctx.drawImage(img, 0, S - 1, S, 1, destX + P, destY + P + S, S, P); // Bottom
    ctx.drawImage(img, 0, 0, 1, S, destX, destY + P, P, S); // Left
    ctx.drawImage(img, S - 1, 0, 1, S, destX + P + S, destY + P, P, S); // Right

    // Corners
    ctx.drawImage(img, 0, 0, 1, 1, destX, destY, P, P); // Top-left
    ctx.drawImage(img, S - 1, 0, 1, 1, destX + P + S, destY, P, P); // Top-right
    ctx.drawImage(img, 0, S - 1, 1, 1, destX, destY + P + S, P, P); // Bottom-left
    ctx.drawImage(img, S - 1, S - 1, 1, 1, destX + P + S, destY + P + S, P, P); // Bottom-right
}

// Fallback texture generation if the image isn't found
function drawFallbackTexture(ctx, missingFile, destX, destY) {
    const P = TILE_PADDING_PX;
    const S = TILE_CONTENT_PX;

    // Draw center core
    ctx.fillStyle = '#FF00FF'; // Magenta
    ctx.fillRect(destX + P, destY + P, S, S);

    // Draw black grid to indicate missing texture
    ctx.fillStyle = '#000000';
    ctx.fillRect(destX + P, destY + P, S / 2, S / 2);
    ctx.fillRect(destX + P + S / 2, destY + P + S / 2, S / 2, S / 2);

    // Draw padding using standard colors to avoid bleeding the debug texture into neighbors
    ctx.fillStyle = '#000000';
    ctx.fillRect(destX, destY, TILE_TOTAL_PX, P); // Top
    ctx.fillRect(destX, destY + P + S, TILE_TOTAL_PX, P); // Bot
    ctx.fillRect(destX, destY + P, P, S); // Left
    ctx.fillRect(destX + P + S, destY + P, P, S); // Right

    console.warn(`[TextureAtlas] Fallback used for missing texture: ${missingFile}.png`);
}

export async function buildTextureAtlas() {
    console.log('[TextureAtlas] Building dynamic texture atlas...');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ATLAS_TOTAL_PX;
    const ctx = canvas.getContext('2d');

    // Crucial for pixel art to avoid smoothing when drawing
    ctx.imageSmoothingEnabled = false;

    // Load all textures in parallel
    const promises = TEXTURE_FILES.map(async (fileName, index) => {
        const destX = (index % ATLAS_TILES_PER_ROW) * TILE_TOTAL_PX;
        const destY = Math.floor(index / ATLAS_TILES_PER_ROW) * TILE_TOTAL_PX;

        try {
            const url = `/textures/block/${fileName}.png`;
            const img = await loadImage(url);
            drawTileWithPadding(ctx, img, destX, destY);
        } catch (error) {
            drawFallbackTexture(ctx, fileName, destX, destY);
        }
    });

    // Wait for all to finish
    await Promise.all(promises);

    console.log('[TextureAtlas] Padded texture atlas built successfully.');

    // Build Three.js texture
    const tex = new THREE.CanvasTexture(canvas);

    // Since we now padded the textures, we CAN use anisotropic filtering and mipmapping!
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestMipmapLinearFilter;
    tex.generateMipmaps = true;

    // Using SRGB so colors look correct
    tex.colorSpace = THREE.SRGBColorSpace;

    // WebGL flips Y by default. We need this false to map coordinates predictably (0 at bottom). 
    // Wait, earlier the user found that `flipY = false` fixed UVs. I will preserve that.
    tex.flipY = false;

    tex.needsUpdate = true;
    return tex;
}
