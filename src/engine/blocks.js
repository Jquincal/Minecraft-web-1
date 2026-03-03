// Block & Item IDs and Definitions
export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;
export const SEA_LEVEL = 28;

export const BLOCK = {
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLESTONE: 4,
    SAND: 5, GRAVEL: 6, WOOD: 7, LEAVES: 8, PLANKS: 9,
    GLASS: 10, BRICK: 11, BEDROCK: 12, WATER: 13,
    CRAFTING_TABLE: 14, FURNACE: 15, CHEST: 16,
    GOLD_ORE: 17, IRON_ORE: 18, COAL_ORE: 19, DIAMOND_ORE: 20,
    GOLD_BLOCK: 21, IRON_BLOCK: 22, DIAMOND_BLOCK: 23,
    SNOW: 24, ICE: 25, TNT: 26, BOOKSHELF: 27, GLOWSTONE: 28, CACTUS: 29,
};

// Texture names corresponding to PNG files in public/textures/block/
export const TEXTURE_FILES = [
    'grass_block_top', 'grass_block_side', 'dirt', 'stone', 'cobblestone',
    'sand', 'gravel', 'oak_log', 'oak_log_top', 'oak_leaves',
    'oak_planks', 'white_stained_glass', 'bricks', 'bedrock', 'blue_ice',
    'crafting_table_top', 'crafting_table_side', 'crafting_table_front',
    'furnace_top', 'furnace_side', 'furnace_front',
    'barrel_top', 'barrel_side', 'barrel_bottom',
    'gold_ore', 'iron_ore', 'coal_ore', 'diamond_ore',
    'gold_block', 'iron_block', 'diamond_block',
    'snow', 'ice', 'tnt_top', 'tnt_side', 'tnt_bottom',
    'bookshelf', 'glowstone', 'cactus_top', 'cactus_side', 'cactus_bottom'
];

// Tile indices corresponding to the TEXTURE_FILES array
export const T = {
    GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, COBBLESTONE: 4,
    SAND: 5, GRAVEL: 6, LOG_SIDE: 7, LOG_TOP: 8, LEAVES: 9,
    PLANKS: 10, GLASS: 11, BRICK: 12, BEDROCK: 13, WATER: 14,
    CRAFT_TOP: 15, CRAFT_SIDE: 16, CRAFT_FRONT: 17,
    FURNACE_TOP: 18, FURNACE_SIDE: 19, FURNACE_FRONT: 20,
    CHEST_TOP: 21, CHEST_SIDE: 22, CHEST_BOTTOM: 23,
    GOLD_ORE: 24, IRON_ORE: 25, COAL_ORE: 26, DIAMOND_ORE: 27,
    GOLD_BLOCK: 28, IRON_BLOCK: 29, DIAMOND_BLOCK: 30,
    SNOW: 31, ICE: 32, TNT_TOP: 33, TNT_SIDE: 34, TNT_BOTTOM: 35,
    BOOKSHELF: 36, GLOWSTONE: 37, CACTUS_TOP: 38, CACTUS_SIDE: 39, CACTUS_BOTTOM: 40
};

// loot entries: { id, min, max, chance }
// id < 100 = block ID, id >= 100 = item ID (from ITEM below)
export const BLOCK_DEF = [
    // 0 AIR
    { name: 'Air', solid: false, transparent: true, hardness: 0, top: T.DIRT, side: T.DIRT, bot: T.DIRT, loot: [], stack: 0, color: 'transparent' },
    // 1 GRASS → drops dirt
    { name: 'Grass Block', solid: true, transparent: false, hardness: 0.6, top: T.GRASS_TOP, side: T.GRASS_SIDE, bot: T.DIRT, loot: [{ id: 2, min: 1, max: 1, chance: 1 }], stack: 64, color: '#5D8A3C' },
    // 2 DIRT
    { name: 'Dirt', solid: true, transparent: false, hardness: 0.5, top: T.DIRT, side: T.DIRT, bot: T.DIRT, loot: [{ id: 2, min: 1, max: 1, chance: 1 }], stack: 64, color: '#8B6343' },
    // 3 STONE → drops cobblestone
    { name: 'Stone', solid: true, transparent: false, hardness: 1.5, top: T.STONE, side: T.STONE, bot: T.STONE, loot: [{ id: 4, min: 1, max: 1, chance: 1 }], stack: 64, color: '#8A8A8A' },
    // 4 COBBLESTONE
    { name: 'Cobblestone', solid: true, transparent: false, hardness: 2.0, top: T.COBBLESTONE, side: T.COBBLESTONE, bot: T.COBBLESTONE, loot: [{ id: 4, min: 1, max: 1, chance: 1 }], stack: 64, color: '#666666' },
    // 5 SAND
    { name: 'Sand', solid: true, transparent: false, hardness: 0.5, top: T.SAND, side: T.SAND, bot: T.SAND, loot: [{ id: 5, min: 1, max: 1, chance: 1 }], stack: 64, color: '#D4CA80' },
    // 6 GRAVEL → 10% flint, else gravel
    { name: 'Gravel', solid: true, transparent: false, hardness: 0.6, top: T.GRAVEL, side: T.GRAVEL, bot: T.GRAVEL, loot: [{ id: 105, min: 1, max: 1, chance: 0.1 }, { id: 6, min: 1, max: 1, chance: 0.9 }], stack: 64, color: '#9090A0' },
    // 7 WOOD (log)
    { name: 'Wood', solid: true, transparent: false, hardness: 2.0, top: T.LOG_TOP, side: T.LOG_SIDE, bot: T.LOG_TOP, loot: [{ id: 7, min: 1, max: 1, chance: 1 }], stack: 64, color: '#5C3D1E' },
    // 8 LEAVES → nothing
    { name: 'Leaves', solid: true, transparent: true, cutout: true, hardness: 0.2, top: T.LEAVES, side: T.LEAVES, bot: T.LEAVES, loot: [], stack: 64, color: '#2D6A1E' },
    // 9 PLANKS
    { name: 'Planks', solid: true, transparent: false, hardness: 2.0, top: T.PLANKS, side: T.PLANKS, bot: T.PLANKS, loot: [{ id: 9, min: 1, max: 1, chance: 1 }], stack: 64, color: '#B8935A' },
    // 10 GLASS → nothing
    { name: 'Glass', solid: true, transparent: true, cutout: true, hardness: 0.3, top: T.GLASS, side: T.GLASS, bot: T.GLASS, loot: [], stack: 64, color: '#A0C8E0' },
    // 11 BRICK
    { name: 'Bricks', solid: true, transparent: false, hardness: 2.0, top: T.BRICK, side: T.BRICK, bot: T.BRICK, loot: [{ id: 11, min: 1, max: 1, chance: 1 }], stack: 64, color: '#9E4E3C' },
    // 12 BEDROCK → unbreakable
    { name: 'Bedrock', solid: true, transparent: false, hardness: Infinity, top: T.BEDROCK, side: T.BEDROCK, bot: T.BEDROCK, loot: [], stack: 64, color: '#333333' },
    // 13 WATER
    { name: 'Water', solid: false, transparent: true, hardness: 0, top: T.WATER, side: T.WATER, bot: T.WATER, loot: [], stack: 0, color: '#1A5BBC' },
    // 14 CRAFTING TABLE
    { name: 'Crafting Table', solid: true, transparent: false, hardness: 2.5, top: T.CRAFT_TOP, side: T.CRAFT_SIDE, bot: T.PLANKS, loot: [{ id: 14, min: 1, max: 1, chance: 1 }], stack: 64, color: '#7B5C35' },
    // 15 FURNACE
    { name: 'Furnace', solid: true, transparent: false, hardness: 3.5, top: T.FURNACE_TOP, side: T.FURNACE_SIDE, bot: T.STONE, loot: [{ id: 15, min: 1, max: 1, chance: 1 }], stack: 64, color: '#555555' },
    // 16 CHEST
    { name: 'Chest', solid: true, transparent: false, hardness: 2.5, top: T.CHEST_TOP, side: T.CHEST_SIDE, bot: T.CHEST_BOTTOM, loot: [{ id: 16, min: 1, max: 1, chance: 1 }], stack: 64, color: '#9C6B1A' },
    // 17 GOLD ORE
    { name: 'Gold Ore', solid: true, transparent: false, hardness: 3.0, top: T.GOLD_ORE, side: T.GOLD_ORE, bot: T.GOLD_ORE, loot: [{ id: 17, min: 1, max: 1, chance: 1 }], stack: 64, color: '#C8A800' },
    // 18 IRON ORE
    { name: 'Iron Ore', solid: true, transparent: false, hardness: 3.0, top: T.IRON_ORE, side: T.IRON_ORE, bot: T.IRON_ORE, loot: [{ id: 18, min: 1, max: 1, chance: 1 }], stack: 64, color: '#C08060' },
    // 19 COAL ORE → drops coal item (id 101)
    { name: 'Coal Ore', solid: true, transparent: false, hardness: 3.0, top: T.COAL_ORE, side: T.COAL_ORE, bot: T.COAL_ORE, loot: [{ id: 101, min: 1, max: 2, chance: 1 }], stack: 64, color: '#444444' },
    // 20 DIAMOND ORE → drops diamond (id 104)
    { name: 'Diamond Ore', solid: true, transparent: false, hardness: 3.0, top: T.DIAMOND_ORE, side: T.DIAMOND_ORE, bot: T.DIAMOND_ORE, loot: [{ id: 104, min: 1, max: 1, chance: 1 }], stack: 64, color: '#20C8C0' },
    // 21 GOLD BLOCK
    { name: 'Gold Block', solid: true, transparent: false, hardness: 3.0, top: T.GOLD_BLOCK, side: T.GOLD_BLOCK, bot: T.GOLD_BLOCK, loot: [{ id: 21, min: 1, max: 1, chance: 1 }], stack: 64, color: '#F5D000' },
    // 22 IRON BLOCK
    { name: 'Iron Block', solid: true, transparent: false, hardness: 5.0, top: T.IRON_BLOCK, side: T.IRON_BLOCK, bot: T.IRON_BLOCK, loot: [{ id: 22, min: 1, max: 1, chance: 1 }], stack: 64, color: '#CCCCCC' },
    // 23 DIAMOND BLOCK
    { name: 'Diamond Block', solid: true, transparent: false, hardness: 5.0, top: T.DIAMOND_BLOCK, side: T.DIAMOND_BLOCK, bot: T.DIAMOND_BLOCK, loot: [{ id: 23, min: 1, max: 1, chance: 1 }], stack: 64, color: '#2ECEC8' },
    // 24 SNOW
    { name: 'Snow', solid: true, transparent: false, hardness: 0.2, top: T.SNOW, side: T.SNOW, bot: T.DIRT, loot: [{ id: 24, min: 1, max: 1, chance: 1 }], stack: 64, color: '#F0F0F8' },
    // 25 ICE → nothing
    { name: 'Ice', solid: true, transparent: true, hardness: 0.5, top: T.ICE, side: T.ICE, bot: T.ICE, loot: [], stack: 64, color: '#8AB5D4' },
    // 26 TNT
    { name: 'TNT', solid: true, transparent: false, hardness: 0, top: T.TNT_TOP, side: T.TNT_SIDE, bot: T.TNT_BOTTOM, loot: [{ id: 26, min: 1, max: 1, chance: 1 }], stack: 64, color: '#CC2222' },
    // 27 BOOKSHELF → drops 3 planks
    { name: 'Bookshelf', solid: true, transparent: false, hardness: 1.5, top: T.PLANKS, side: T.BOOKSHELF, bot: T.PLANKS, loot: [{ id: 9, min: 3, max: 3, chance: 1 }], stack: 64, color: '#7B5A3E' },
    // 28 GLOWSTONE → drops 2-4 itself
    { name: 'Glowstone', solid: true, transparent: false, hardness: 0.3, top: T.GLOWSTONE, side: T.GLOWSTONE, bot: T.GLOWSTONE, loot: [{ id: 28, min: 2, max: 4, chance: 1 }], stack: 64, color: '#F0D060' },
    // 29 CACTUS
    { name: 'Cactus', solid: true, transparent: false, hardness: 0.4, top: T.CACTUS_TOP, side: T.CACTUS_SIDE, bot: T.CACTUS_BOTTOM, loot: [{ id: 29, min: 1, max: 1, chance: 1 }], stack: 64, color: '#2A7A2A' },
];

export const ITEM = {
    STICK: 100, COAL: 101, IRON_INGOT: 102, GOLD_INGOT: 103, DIAMOND: 104, FLINT: 105,
    WOODEN_PICKAXE: 110, STONE_PICKAXE: 111, IRON_PICKAXE: 112, GOLD_PICKAXE: 113, DIAMOND_PICKAXE: 114,
    WOODEN_AXE: 115, STONE_AXE: 116, IRON_AXE: 117,
    WOODEN_SHOVEL: 120, STONE_SHOVEL: 121, IRON_SHOVEL: 122,
    WOODEN_SWORD: 125, STONE_SWORD: 126, IRON_SWORD: 127, DIAMOND_SWORD: 128,
    WOODEN_HOE: 130, STONE_HOE: 131,
    BOWL: 140, TORCH_ITEM: 141,
};

export const ITEM_DEF = {
    [100]: { name: 'Stick', color: '#8B6343', stack: 64 },
    [101]: { name: 'Coal', color: '#222222', stack: 64 },
    [102]: { name: 'Iron Ingot', color: '#DDDDDD', stack: 64 },
    [103]: { name: 'Gold Ingot', color: '#F5D000', stack: 64 },
    [104]: { name: 'Diamond', color: '#2ECEC8', stack: 64 },
    [105]: { name: 'Flint', color: '#666677', stack: 64 },
    [110]: { name: 'Wooden Pickaxe', color: '#B8935A', stack: 1 },
    [111]: { name: 'Stone Pickaxe', color: '#8A8A8A', stack: 1 },
    [112]: { name: 'Iron Pickaxe', color: '#CCCCCC', stack: 1 },
    [113]: { name: 'Gold Pickaxe', color: '#F5D000', stack: 1 },
    [114]: { name: 'Diamond Pickaxe', color: '#2ECEC8', stack: 1 },
    [115]: { name: 'Wooden Axe', color: '#B8935A', stack: 1 },
    [116]: { name: 'Stone Axe', color: '#8A8A8A', stack: 1 },
    [117]: { name: 'Iron Axe', color: '#CCCCCC', stack: 1 },
    [120]: { name: 'Wooden Shovel', color: '#B8935A', stack: 1 },
    [121]: { name: 'Stone Shovel', color: '#8A8A8A', stack: 1 },
    [122]: { name: 'Iron Shovel', color: '#CCCCCC', stack: 1 },
    [125]: { name: 'Wooden Sword', color: '#B8935A', stack: 1 },
    [126]: { name: 'Stone Sword', color: '#8A8A8A', stack: 1 },
    [127]: { name: 'Iron Sword', color: '#CCCCCC', stack: 1 },
    [128]: { name: 'Diamond Sword', color: '#2ECEC8', stack: 1 },
    [130]: { name: 'Wooden Hoe', color: '#B8935A', stack: 1 },
    [131]: { name: 'Stone Hoe', color: '#8A8A8A', stack: 1 },
    [140]: { name: 'Bowl', color: '#8B6343', stack: 64 },
    [141]: { name: 'Torch', color: '#FFC040', stack: 64 },
};

export function getItemDef(id) {
    if (id > 0 && id < BLOCK_DEF.length) return BLOCK_DEF[id];
    return ITEM_DEF[id] || { name: 'Unknown', color: '#888', stack: 1 };
}
export function getItemColor(id) { return getItemDef(id)?.color || '#888'; }
export function getItemName(id) { return getItemDef(id)?.name || 'Unknown'; }
export function isBlockItem(id) { return id > 0 && id < BLOCK_DEF.length; }
export function getBlockDef(id) { return BLOCK_DEF[id] || BLOCK_DEF[0]; }
