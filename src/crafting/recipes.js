import { BLOCK, ITEM } from '../engine/blocks.js';

// Shorthand
const B = BLOCK, I = ITEM;
const _ = null; // empty slot

// Recipe format:
// { type:'shaped', pattern: 3×3 array, output:{id,count} }
// { type:'shapeless', ingredients:[ids], output:{id,count} }

export const RECIPES = [
    // ── BASIC MATERIALS ──────────────────────────────────
    // Wood → Planks
    { type: 'shapeless', ingredients: [B.WOOD], output: { id: B.PLANKS, count: 4 } },
    // Planks → Sticks
    { type: 'shaped', pattern: [[_, _, _], [B.PLANKS, _, _], [B.PLANKS, _, _]], output: { id: I.STICK, count: 4 } },
    // Coal from coal ore (smelting fallback — give coal item)
    // Crafting table
    { type: 'shaped', pattern: [[_, _, _], [B.PLANKS, B.PLANKS, _], [B.PLANKS, B.PLANKS, _]], output: { id: B.CRAFTING_TABLE, count: 1 } },
    // Chest (8 planks around)
    { type: 'shaped', pattern: [[B.PLANKS, B.PLANKS, B.PLANKS], [B.PLANKS, _, B.PLANKS], [B.PLANKS, B.PLANKS, B.PLANKS]], output: { id: B.CHEST, count: 1 } },
    // Bookshelf
    { type: 'shaped', pattern: [[B.PLANKS, B.PLANKS, B.PLANKS], [I.COAL, I.COAL, I.COAL], [B.PLANKS, B.PLANKS, B.PLANKS]], output: { id: B.BOOKSHELF, count: 1 } },

    // ── TOOLS ─────────────────────────────────────────────
    // Wooden Pickaxe
    { type: 'shaped', pattern: [[B.PLANKS, B.PLANKS, B.PLANKS], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.WOODEN_PICKAXE, count: 1 } },
    // Stone Pickaxe
    { type: 'shaped', pattern: [[B.COBBLESTONE, B.COBBLESTONE, B.COBBLESTONE], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.STONE_PICKAXE, count: 1 } },
    // Iron Pickaxe
    { type: 'shaped', pattern: [[I.IRON_INGOT, I.IRON_INGOT, I.IRON_INGOT], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.IRON_PICKAXE, count: 1 } },
    // Gold Pickaxe
    { type: 'shaped', pattern: [[I.GOLD_INGOT, I.GOLD_INGOT, I.GOLD_INGOT], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.GOLD_PICKAXE, count: 1 } },
    // Diamond Pickaxe
    { type: 'shaped', pattern: [[I.DIAMOND, I.DIAMOND, I.DIAMOND], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.DIAMOND_PICKAXE, count: 1 } },

    // Wooden Axe
    { type: 'shaped', pattern: [[B.PLANKS, B.PLANKS, _], [B.PLANKS, I.STICK, _], [_, I.STICK, _]], output: { id: I.WOODEN_AXE, count: 1 } },
    // Stone Axe
    { type: 'shaped', pattern: [[B.COBBLESTONE, B.COBBLESTONE, _], [B.COBBLESTONE, I.STICK, _], [_, I.STICK, _]], output: { id: I.STONE_AXE, count: 1 } },
    // Iron Axe
    { type: 'shaped', pattern: [[I.IRON_INGOT, I.IRON_INGOT, _], [I.IRON_INGOT, I.STICK, _], [_, I.STICK, _]], output: { id: I.IRON_AXE, count: 1 } },

    // Wooden Shovel
    { type: 'shaped', pattern: [[_, B.PLANKS, _], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.WOODEN_SHOVEL, count: 1 } },
    // Stone Shovel
    { type: 'shaped', pattern: [[_, B.COBBLESTONE, _], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.STONE_SHOVEL, count: 1 } },
    // Iron Shovel
    { type: 'shaped', pattern: [[_, I.IRON_INGOT, _], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.IRON_SHOVEL, count: 1 } },

    // Wooden Sword
    { type: 'shaped', pattern: [[_, B.PLANKS, _], [_, B.PLANKS, _], [_, I.STICK, _]], output: { id: I.WOODEN_SWORD, count: 1 } },
    // Stone Sword
    { type: 'shaped', pattern: [[_, B.COBBLESTONE, _], [_, B.COBBLESTONE, _], [_, I.STICK, _]], output: { id: I.STONE_SWORD, count: 1 } },
    // Iron Sword
    { type: 'shaped', pattern: [[_, I.IRON_INGOT, _], [_, I.IRON_INGOT, _], [_, I.STICK, _]], output: { id: I.IRON_SWORD, count: 1 } },
    // Diamond Sword
    { type: 'shaped', pattern: [[_, I.DIAMOND, _], [_, I.DIAMOND, _], [_, I.STICK, _]], output: { id: I.DIAMOND_SWORD, count: 1 } },

    // Wooden Hoe
    { type: 'shaped', pattern: [[B.PLANKS, B.PLANKS, _], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.WOODEN_HOE, count: 1 } },
    // Stone Hoe
    { type: 'shaped', pattern: [[B.COBBLESTONE, B.COBBLESTONE, _], [_, I.STICK, _], [_, I.STICK, _]], output: { id: I.STONE_HOE, count: 1 } },

    // ── BLOCKS ────────────────────────────────────────────
    // Cobblestone → Stone (no, but cobble → stone wall not needed)
    // Bricks (4 clay balls → 1 brick, but use planks as clay stand-in)
    { type: 'shaped', pattern: [[B.COBBLESTONE, B.COBBLESTONE, _], [B.COBBLESTONE, B.COBBLESTONE, _], [_, _, _]], output: { id: B.BRICK, count: 4 } },
    // Gold block (9 gold ingots)
    { type: 'shaped', pattern: [[I.GOLD_INGOT, I.GOLD_INGOT, I.GOLD_INGOT], [I.GOLD_INGOT, I.GOLD_INGOT, I.GOLD_INGOT], [I.GOLD_INGOT, I.GOLD_INGOT, I.GOLD_INGOT]], output: { id: B.GOLD_BLOCK, count: 1 } },
    // Iron block
    { type: 'shaped', pattern: [[I.IRON_INGOT, I.IRON_INGOT, I.IRON_INGOT], [I.IRON_INGOT, I.IRON_INGOT, I.IRON_INGOT], [I.IRON_INGOT, I.IRON_INGOT, I.IRON_INGOT]], output: { id: B.IRON_BLOCK, count: 1 } },
    // Diamond block
    { type: 'shaped', pattern: [[I.DIAMOND, I.DIAMOND, I.DIAMOND], [I.DIAMOND, I.DIAMOND, I.DIAMOND], [I.DIAMOND, I.DIAMOND, I.DIAMOND]], output: { id: B.DIAMOND_BLOCK, count: 1 } },
    // Glass (sand in furnace – simulate as shapeless)
    { type: 'shapeless', ingredients: [B.SAND, I.COAL], output: { id: B.GLASS, count: 4 } },
    // TNT
    { type: 'shaped', pattern: [[B.SAND, B.GRAVEL, B.SAND], [B.GRAVEL, B.SAND, B.GRAVEL], [B.SAND, B.GRAVEL, B.SAND]], output: { id: B.TNT, count: 1 } },
    // Furnace (8 cobblestone)
    { type: 'shaped', pattern: [[B.COBBLESTONE, B.COBBLESTONE, B.COBBLESTONE], [B.COBBLESTONE, _, B.COBBLESTONE], [B.COBBLESTONE, B.COBBLESTONE, B.COBBLESTONE]], output: { id: B.FURNACE, count: 1 } },

    // ── INGOTS from blocks ─────────────────────────────
    // Gold block → 9 gold ingots
    { type: 'shapeless', ingredients: [B.GOLD_BLOCK], output: { id: I.GOLD_INGOT, count: 9 } },
    // Iron block → 9 iron ingots
    { type: 'shapeless', ingredients: [B.IRON_BLOCK], output: { id: I.IRON_INGOT, count: 9 } },
    // Diamond block → 9 diamonds
    { type: 'shapeless', ingredients: [B.DIAMOND_BLOCK], output: { id: I.DIAMOND, count: 9 } },

    // Torch (coal + stick)
    { type: 'shaped', pattern: [[_, I.COAL, _], [_, I.STICK, _], [_, _, _]], output: { id: I.TORCH_ITEM, count: 4 } },

    // Bowl
    { type: 'shaped', pattern: [[B.PLANKS, _, B.PLANKS], [_, B.PLANKS, _], [_, _, _]], output: { id: I.BOWL, count: 4 } },
];
