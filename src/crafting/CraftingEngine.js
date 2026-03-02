import { RECIPES } from './recipes.js';

/** Match a 3×3 grid (or 2×2 padded to 3×3) against all recipes.
 *  grid: array of 9 (item id|null) – row-major, top-left first
 *  Returns {id, count} or null */
export function matchRecipe(grid, is3x3 = true) {
    for (const recipe of RECIPES) {
        if (recipe.type === 'shaped') {
            const out = _matchShaped(grid, recipe, is3x3);
            if (out) return out;
        } else {
            const out = _matchShapeless(grid, recipe);
            if (out) return out;
        }
    }
    return null;
}

function _patternToGrid(pattern) {
    const g = Array(9).fill(null);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            g[r * 3 + c] = (pattern[r] && pattern[r][c] != null) ? pattern[r][c] : null;
        }
    }
    return g;
}

function _compact(grid) {
    // find bounding box of non-null cells
    let minR = 3, maxR = -1, minC = 3, maxC = -1;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        if (grid[r * 3 + c] !== null && grid[r * 3 + c] !== 0) {
            minR = Math.min(minR, r); maxR = Math.max(maxR, r);
            minC = Math.min(minC, c); maxC = Math.max(maxC, c);
        }
    }
    if (minR > maxR) return { g: Array(9).fill(null), w: 0, h: 0 };
    const h = maxR - minR + 1, w = maxC - minC + 1;
    const g = Array(9).fill(null);
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            const v = grid[r * 3 + c] || null;
            g[(r - minR) * 3 + (c - minC)] = v;
        }
    }
    return { g, w, h };
}

function _matchShaped(grid, recipe, is3x3) {
    const pg = _patternToGrid(recipe.pattern);
    const { g: cg } = _compact(grid);
    const { g: cp } = _compact(pg);
    // compare compacted grids
    for (let i = 0; i < 9; i++) {
        const a = cg[i] || null, b = cp[i] || null;
        const an = a === 0 ? null : a, bn = b === 0 ? null : b;
        if (an !== bn) return null;
    }
    return recipe.output;
}

function _matchShapeless(grid, recipe) {
    const ing = [...recipe.ingredients];
    const cells = grid.filter(v => v !== null && v !== 0);
    if (cells.length !== ing.length) return null;
    const used = Array(ing.length).fill(false);
    for (const cell of cells) {
        const i = ing.findIndex((v, i) => !used[i] && v === cell);
        if (i === -1) return null;
        used[i] = true;
    }
    return recipe.output;
}

/** Consume items from inventory matching a grid, return updated inventory */
export function consumeCraftingIngredients(inventory, grid) {
    const inv = [...inventory];
    for (const slotId of grid) {
        if (!slotId && slotId !== 0) continue;
        const idx = inv.findIndex(s => s && s.id === slotId);
        if (idx === -1) continue;
        inv[idx] = { ...inv[idx], count: inv[idx].count - 1 };
        if (inv[idx].count <= 0) inv[idx] = null;
    }
    return inv;
}
