import * as THREE from 'three';
import { T } from '../engine/blocks.js';

// ──────────────────────────────────────────────────────────
// Atlas layout: 16 tiles per row, 16×16 px per tile → 256×256
// ──────────────────────────────────────────────────────────
const ATLAS_TILES = 16;
const TILE_PX = 16;
const ATLAS_PX = ATLAS_TILES * TILE_PX; // 256

// ── Helper: get destination pixel rect for a tile index ──
function tileRect(t) {
    const tx = t % ATLAS_TILES, ty = Math.floor(t / ATLAS_TILES);
    return { ox: tx * TILE_PX, oy: ty * TILE_PX };
}

// ── Load an image from a URL as an HTMLImageElement ───────
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Could not load ${url}`));
        img.src = url;
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Procedural tile painters (fallbacks / other blocks)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function solid(ctx, ox, oy, color) {
    ctx.fillStyle = color;
    ctx.fillRect(ox, oy, TILE_PX, TILE_PX);
}

function speckle(ctx, ox, oy, base, spots, count = 20) {
    solid(ctx, ox, oy, base);
    ctx.fillStyle = spots;
    for (let i = 0; i < count; i++) {
        const xx = ox + (Math.abs(Math.sin(i * 31) * 10000) % TILE_PX) | 0;
        const yy = oy + (Math.abs(Math.sin(i * 47) * 10000) % TILE_PX) | 0;
        ctx.fillRect(xx, yy, 1 + (i % 2), 1 + (i % 2));
    }
}

function drawPlanks(ctx, ox, oy) {
    solid(ctx, ox, oy, '#B8935A');
    ctx.fillStyle = '#906830';
    for (let y = 0; y < TILE_PX; y += 4) ctx.fillRect(ox, oy + y, TILE_PX, 1);
    for (let r = 0; r < 4; r++) ctx.fillRect(ox + (r % 2 === 0 ? 8 : 0), oy + r * 4, 1, 4);
}

function drawLogSide(ctx, ox, oy) {
    solid(ctx, ox, oy, '#6B4A1E');
    ctx.fillStyle = '#4A3010';
    for (let x = 0; x < TILE_PX; x += 5) ctx.fillRect(ox + x, oy, 1, TILE_PX);
    ctx.fillStyle = '#8B6030';
    for (let x = 2; x < TILE_PX; x += 5) ctx.fillRect(ox + x, oy, 1, TILE_PX);
}

function drawLogTop(ctx, ox, oy) {
    solid(ctx, ox, oy, '#9B7040');
    ctx.strokeStyle = '#5A3A10'; ctx.lineWidth = 1;
    for (let r = 2; r < 8; r += 2) {
        ctx.beginPath(); ctx.arc(ox + 8, oy + 8, r, 0, Math.PI * 2); ctx.stroke();
    }
}

function drawLeaves(ctx, ox, oy) {
    solid(ctx, ox, oy, '#2D6A1E');
    for (let i = 0; i < 20; i++) {
        const xx = ox + (Math.abs(Math.sin(i * 41) * 10000) % TILE_PX) | 0;
        const yy = oy + (Math.abs(Math.sin(i * 67) * 10000) % TILE_PX) | 0;
        ctx.fillStyle = i % 2 === 0 ? '#1D5A10' : '#3D8028'; ctx.fillRect(xx, yy, 3, 2);
    }
}

function drawWater(ctx, ox, oy) {
    solid(ctx, ox, oy, '#1C5BBC');
    ctx.fillStyle = 'rgba(80,140,220,0.4)';
    for (let y = 0; y < TILE_PX; y += 4)
        for (let x = 0; x < TILE_PX; x += 6)
            ctx.fillRect(ox + x + (y % 2 === 0 ? 0 : 3), oy + y, 5, 1);
}

function drawGlass(ctx, ox, oy) {
    solid(ctx, ox, oy, '#80B4CC');
    ctx.strokeStyle = '#AADDFF'; ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, TILE_PX - 1, TILE_PX - 1);
}

function drawBrick(ctx, ox, oy) {
    solid(ctx, ox, oy, '#9E4E3C');
    ctx.fillStyle = '#6A2A18';
    for (let y = 0; y < TILE_PX; y += 4) ctx.fillRect(ox, oy + y, TILE_PX, 1);
    for (let r = 0; r < 4; r++) {
        const xo = r % 2 === 0 ? 0 : 8;
        for (let x = xo; x < TILE_PX; x += 8) ctx.fillRect(ox + x, oy + r * 4, 1, 4);
    }
}

function drawOre(ctx, ox, oy, bgCol, oreCol) {
    speckle(ctx, ox, oy, bgCol, '#555');
    ctx.fillStyle = oreCol;
    [[2, 3], [6, 2], [11, 5], [4, 8], [8, 11], [13, 9], [3, 13], [10, 14]].forEach(([px, py]) => {
        ctx.fillRect(ox + px, oy + py, 3, 2);
    });
}

function drawGlowstone(ctx, ox, oy) {
    const grd = ctx.createRadialGradient(ox + 8, oy + 8, 1, ox + 8, oy + 8, 9);
    grd.addColorStop(0, '#FFEE80'); grd.addColorStop(1, '#C09010');
    ctx.fillStyle = grd; ctx.fillRect(ox, oy, TILE_PX, TILE_PX);
}

function drawBookshelf(ctx, ox, oy) {
    drawPlanks(ctx, ox, oy);
    ['#C02020', '#2050CC', '#20A020', '#C08020', '#8020C0'].forEach((c, i) => {
        ctx.fillStyle = c; ctx.fillRect(ox + 2 + i * 3, oy + 3, 2, 10);
    });
}

function drawCraftingTop(ctx, ox, oy) {
    drawPlanks(ctx, ox, oy);
    ctx.fillStyle = '#5C3D1E'; ctx.fillRect(ox + 1, oy + 1, TILE_PX - 2, TILE_PX - 2);
    ctx.strokeStyle = '#3A2510'; ctx.lineWidth = 1;
    ctx.strokeRect(ox + 3, oy + 3, TILE_PX - 6, TILE_PX - 6);
}

function drawCraftingSide(ctx, ox, oy) {
    solid(ctx, ox, oy, '#A07040');
    ctx.fillStyle = '#5C3D1E'; ctx.fillRect(ox + 2, oy + 2, TILE_PX - 4, TILE_PX - 4);
}

function drawTNTSide(ctx, ox, oy) {
    solid(ctx, ox, oy, '#CC2222');
    ctx.fillStyle = '#EEEEEE'; ctx.font = 'bold 5px monospace';
    ctx.fillText('TNT', ox + 2, oy + 10);
}

function drawTNTTop(ctx, ox, oy) {
    solid(ctx, ox, oy, '#CC2222');
    ctx.fillStyle = '#FF4444'; ctx.fillRect(ox + 3, oy + 3, 10, 10);
    ctx.fillStyle = '#220000'; ctx.fillRect(ox + 6, oy + 6, 4, 4);
}

function drawIce(ctx, ox, oy) {
    solid(ctx, ox, oy, '#8AB5D4');
    ctx.strokeStyle = 'rgba(200,230,255,0.6)'; ctx.lineWidth = 1;
    ctx.strokeRect(ox + 0.5, oy + 0.5, TILE_PX - 1, TILE_PX - 1);
    for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(ox + i * 4, oy); ctx.lineTo(ox, oy + i * 4); ctx.stroke();
    }
}

function drawCactus(ctx, ox, oy) {
    solid(ctx, ox, oy, '#2A7A2A');
    ctx.fillStyle = '#1A5A1A';
    ctx.fillRect(ox, oy, 2, TILE_PX); ctx.fillRect(ox + TILE_PX - 2, oy, 2, TILE_PX);
    for (let y = 2; y < TILE_PX; y += 4) {
        ctx.fillStyle = '#3A9A3A'; ctx.fillRect(ox + 2, oy + y, TILE_PX - 4, 2);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Extract exactly one face from the cross-template PNG.
//
// The template PNG  is a cube-net cross (Minecraft style):
//
//           ┌──────┐
//           │ TOP  │   ← grass top (green center)
//  ┌────────┼──────┼────────┬──────┐
//  │ LEFT   │FRONT │ RIGHT  │ BACK │   ← dirt sides
//  └────────┼──────┼────────┴──────┘
//           │BOTTOM│   ← dirt bottom
//           └──────┘
//
// Image dims ≈ 1270 × 951 px.  Each face ≈ W/4 × H/3.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractFace(ctx, img, srcX, srcY, srcW, srcH, destOx, destOy) {
    ctx.drawImage(img, srcX, srcY, srcW, srcH, destOx, destOy, TILE_PX, TILE_PX);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main async builder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function buildTextureAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ATLAS_PX;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // ── IMPORTANT: fill with opaque base to prevent any transparent gaps ──
    ctx.fillStyle = '#8B6343'; // fallback dirt color
    ctx.fillRect(0, 0, ATLAS_PX, ATLAS_PX);

    // ── Load the real Minecraft dirt/grass block PNG ───────────────────────
    let dirtImg = null;
    try {
        dirtImg = await loadImage('/dirt_template.png');
    } catch (e) {
        console.warn('dirt_template.png not loaded, using procedural textures only:', e);
    }

    if (dirtImg) {
        // Template dimensions
        const imgW = dirtImg.naturalWidth;
        const imgH = dirtImg.naturalHeight;

        // The cross is precisely 4 widths wide and 3 heights tall.
        // We use Math.floor to avoid float interpolation.
        const fw = Math.floor(imgW / 4);
        const fh = Math.floor(imgH / 3);

        // Face source regions (col, row) in the cross grid:
        // We add a tiny 1px inset (sx+1, sy+1, sw-2, sh-2) so we don't accidentally grab transparent 
        // edge pixels which causes the texture to bleed and turn faces invisible/solid brown color.
        const inset = 1;
        const top = { sx: fw * 1 + inset, sy: 0 + inset, sw: fw - inset * 2, sh: fh - inset * 2 };
        const front = { sx: fw * 1 + inset, sy: fh * 1 + inset, sw: fw - inset * 2, sh: fh - inset * 2 }; // grass side
        const side = { sx: fw * 0 + inset, sy: fh * 1 + inset, sw: fw - inset * 2, sh: fh - inset * 2 }; // dirt side
        const bottom = { sx: fw * 1 + inset, sy: fh * 2 + inset, sw: fw - inset * 2, sh: fh - inset * 2 }; // dirt bottom

        // GRASS_TOP (T.GRASS_TOP = 0)
        const gt = tileRect(T.GRASS_TOP);
        extractFace(ctx, dirtImg, top.sx, top.sy, top.sw, top.sh, gt.ox, gt.oy);

        // GRASS_SIDE (T.GRASS_SIDE = 1)
        const gs = tileRect(T.GRASS_SIDE);
        extractFace(ctx, dirtImg, front.sx, front.sy, front.sw, front.sh, gs.ox, gs.oy);

        // DIRT (T.DIRT = 2) — all faces dirt brown
        // Use the pure dirt side for everything
        const d = tileRect(T.DIRT);
        extractFace(ctx, dirtImg, side.sx, side.sy, side.sw, side.sh, d.ox, d.oy);

        // Also paint the BOTTOM of GRASS correctly (same as dirt side)
        // GRASS bottom tile = T.DIRT (reused), already done above ✓

        // Extras: use dirt side for gravel fallback fill (we'll overpaint below)
        // Use dirt bottom for extra dirt tile variants
        console.log('✅ Real Minecraft dirt/grass textures loaded from PNG template');
    } else {
        // Fallback procedural grass top
        const gt = tileRect(T.GRASS_TOP);
        solid(ctx, gt.ox, gt.oy, '#5D8A3C');
        for (let i = 0; i < 24; i++) {
            const xx = gt.ox + (Math.abs(Math.sin(i * 37) * 10000) % TILE_PX) | 0;
            const yy = gt.oy + (Math.abs(Math.sin(i * 61) * 10000) % TILE_PX) | 0;
            ctx.fillStyle = i % 2 === 0 ? '#4A7C2A' : '#7AB84A'; ctx.fillRect(xx, yy, 2, 2);
        }
        // Fallback grass side
        const gs = tileRect(T.GRASS_SIDE);
        speckle(ctx, gs.ox, gs.oy, '#8B6343', '#6B4A2A');
        ctx.fillStyle = '#5D8A3C'; ctx.fillRect(gs.ox, gs.oy, TILE_PX, 4);

        // Fallback dirt
        const d = tileRect(T.DIRT);
        speckle(ctx, d.ox, d.oy, '#8B6343', '#6B4A2A');
    }

    // ── All other block tiles (procedural) ────────────────────────────────
    const p = (t) => tileRect(t);

    speckle(ctx, ...Object.values(p(T.STONE)), '#8A8A8A', '#666');
    speckle(ctx, ...Object.values(p(T.COBBLESTONE)), '#6A6A6A', '#4A4A4A');

    // Sand
    { const { ox, oy } = p(T.SAND); solid(ctx, ox, oy, '#D4CA80'); speckle(ctx, ox, oy, '#D4CA80', '#C4B870', 12); }
    speckle(ctx, ...Object.values(p(T.GRAVEL)), '#909090', '#777');

    drawLogSide(ctx, ...Object.values(p(T.LOG_SIDE)));
    drawLogTop(ctx, ...Object.values(p(T.LOG_TOP)));
    drawLeaves(ctx, ...Object.values(p(T.LEAVES)));
    drawPlanks(ctx, ...Object.values(p(T.PLANKS)));
    drawGlass(ctx, ...Object.values(p(T.GLASS)));
    drawBrick(ctx, ...Object.values(p(T.BRICK)));

    // Bedrock
    speckle(ctx, ...Object.values(p(T.BEDROCK)), '#333', '#222', 14);

    drawWater(ctx, ...Object.values(p(T.WATER)));

    drawCraftingTop(ctx, ...Object.values(p(T.CRAFT_TOP)));
    drawCraftingSide(ctx, ...Object.values(p(T.CRAFT_SIDE)));
    drawCraftingSide(ctx, ...Object.values(p(T.CRAFT_FRONT)));

    speckle(ctx, ...Object.values(p(T.FURNACE_TOP)), '#666', '#888', 8);
    speckle(ctx, ...Object.values(p(T.FURNACE_SIDE)), '#555', '#888', 10);
    speckle(ctx, ...Object.values(p(T.FURNACE_FRONT)), '#444', '#FF8800', 6);

    solid(ctx, ...Object.values(p(T.CHEST_TOP)), '#9C6B1A');
    solid(ctx, ...Object.values(p(T.CHEST_SIDE)), '#8B5A10');
    // chest lock detail
    { const { ox, oy } = p(T.CHEST_SIDE); ctx.fillStyle = '#C8A020'; ctx.fillRect(ox + 6, oy + 5, 4, 4); }

    drawOre(ctx, ...Object.values(p(T.GOLD_ORE)), '#8A8A8A', '#F5D000');
    drawOre(ctx, ...Object.values(p(T.IRON_ORE)), '#8A8A8A', '#C08060');
    drawOre(ctx, ...Object.values(p(T.COAL_ORE)), '#8A8A8A', '#111');
    drawOre(ctx, ...Object.values(p(T.DIAMOND_ORE)), '#8A8A8A', '#2ECEC8');

    solid(ctx, ...Object.values(p(T.GOLD_BLOCK)), '#F5D000');
    solid(ctx, ...Object.values(p(T.IRON_BLOCK)), '#DDDDDD');
    solid(ctx, ...Object.values(p(T.DIAMOND_BLOCK)), '#2ECEC8');

    solid(ctx, ...Object.values(p(T.SNOW)), '#F0F0F8');
    drawIce(ctx, ...Object.values(p(T.ICE)));
    drawTNTTop(ctx, ...Object.values(p(T.TNT_TOP)));
    drawTNTSide(ctx, ...Object.values(p(T.TNT_SIDE)));
    drawBookshelf(ctx, ...Object.values(p(T.BOOKSHELF)));
    drawGlowstone(ctx, ...Object.values(p(T.GLOWSTONE)));
    drawCactus(ctx, ...Object.values(p(T.CACTUS)));

    // ── Build Three.js texture ────────────────────────────────────────────
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false; // CRITICAL: match WebGL V axis to Canvas Y axis
    tex.needsUpdate = true;
    return tex;
}
