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

// Tile index in the texture atlas (16 tiles wide)
export const T = {
    GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, COBBLESTONE: 4,
    SAND: 5, GRAVEL: 6, LOG_SIDE: 7, LOG_TOP: 8, LEAVES: 9,
    PLANKS: 10, GLASS: 11, BRICK: 12, BEDROCK: 13, WATER: 14,
    CRAFT_TOP: 15, CRAFT_SIDE: 16, CRAFT_FRONT: 17,
    FURNACE_TOP: 18, FURNACE_SIDE: 19, FURNACE_FRONT: 20,
    CHEST_TOP: 21, CHEST_SIDE: 22,
    GOLD_ORE: 23, IRON_ORE: 24, COAL_ORE: 25, DIAMOND_ORE: 26,
    GOLD_BLOCK: 27, IRON_BLOCK: 28, DIAMOND_BLOCK: 29,
    SNOW: 30, ICE: 31, TNT_TOP: 32, TNT_SIDE: 33,
    BOOKSHELF: 34, BOOKSHELF_SIDE: 35, GLOWSTONE: 36, CACTUS: 37,
};

// Block definitions: top/side/bottom tile, physics, drops
export const BLOCK_DEF = [
    // 0 AIR
    { name: 'Air', solid: false, transparent: true, top: T.DIRT, side: T.DIRT, bot: T.DIRT, drop: 0, stack: 0, color: 'transparent' },
    // 1 GRASS
    { name: 'Grass Block', solid: true, transparent: false, top: T.GRASS_TOP, side: T.GRASS_SIDE, bot: T.DIRT, drop: 2, stack: 64, color: '#5D8A3C' },
    // 2 DIRT
    { name: 'Dirt', solid: true, transparent: false, top: T.DIRT, side: T.DIRT, bot: T.DIRT, drop: 2, stack: 64, color: '#8B6343' },
    // 3 STONE
    { name: 'Stone', solid: true, transparent: false, top: T.STONE, side: T.STONE, bot: T.STONE, drop: 4, stack: 64, color: '#8A8A8A' },
    // 4 COBBLESTONE
    { name: 'Cobblestone', solid: true, transparent: false, top: T.COBBLESTONE, side: T.COBBLESTONE, bot: T.COBBLESTONE, drop: 4, stack: 64, color: '#666666' },
    // 5 SAND
    { name: 'Sand', solid: true, transparent: false, top: T.SAND, side: T.SAND, bot: T.SAND, drop: 5, stack: 64, color: '#D4CA80' },
    // 6 GRAVEL
    { name: 'Gravel', solid: true, transparent: false, top: T.GRAVEL, side: T.GRAVEL, bot: T.GRAVEL, drop: 6, stack: 64, color: '#9090A0' },
    // 7 WOOD (log)
    { name: 'Wood', solid: true, transparent: false, top: T.LOG_TOP, side: T.LOG_SIDE, bot: T.LOG_TOP, drop: 7, stack: 64, color: '#5C3D1E' },
    // 8 LEAVES
    { name: 'Leaves', solid: true, transparent: true, top: T.LEAVES, side: T.LEAVES, bot: T.LEAVES, drop: 0, stack: 64, color: '#2D6A1E' },
    // 9 PLANKS
    { name: 'Planks', solid: true, transparent: false, top: T.PLANKS, side: T.PLANKS, bot: T.PLANKS, drop: 9, stack: 64, color: '#B8935A' },
    // 10 GLASS
    { name: 'Glass', solid: true, transparent: true, top: T.GLASS, side: T.GLASS, bot: T.GLASS, drop: 0, stack: 64, color: '#A0C8E0' },
    // 11 BRICK
    { name: 'Bricks', solid: true, transparent: false, top: T.BRICK, side: T.BRICK, bot: T.BRICK, drop: 11, stack: 64, color: '#9E4E3C' },
    // 12 BEDROCK
    { name: 'Bedrock', solid: true, transparent: false, top: T.BEDROCK, side: T.BEDROCK, bot: T.BEDROCK, drop: 0, stack: 64, color: '#333333' },
    // 13 WATER
    { name: 'Water', solid: false, transparent: true, top: T.WATER, side: T.WATER, bot: T.WATER, drop: 0, stack: 0, color: '#1A5BBC' },
    // 14 CRAFTING TABLE
    { name: 'Crafting Table', solid: true, transparent: false, top: T.CRAFT_TOP, side: T.CRAFT_SIDE, bot: T.PLANKS, drop: 14, stack: 64, color: '#7B5C35' },
    // 15 FURNACE
    { name: 'Furnace', solid: true, transparent: false, top: T.FURNACE_TOP, side: T.FURNACE_SIDE, bot: T.STONE, drop: 15, stack: 64, color: '#555555' },
    // 16 CHEST
    { name: 'Chest', solid: true, transparent: false, top: T.CHEST_TOP, side: T.CHEST_SIDE, bot: T.CHEST_TOP, drop: 16, stack: 64, color: '#9C6B1A' },
    // 17 GOLD ORE
    { name: 'Gold Ore', solid: true, transparent: false, top: T.GOLD_ORE, side: T.GOLD_ORE, bot: T.GOLD_ORE, drop: 17, stack: 64, color: '#C8A800' },
    // 18 IRON ORE
    { name: 'Iron Ore', solid: true, transparent: false, top: T.IRON_ORE, side: T.IRON_ORE, bot: T.IRON_ORE, drop: 18, stack: 64, color: '#C08060' },
    // 19 COAL ORE
    { name: 'Coal Ore', solid: true, transparent: false, top: T.COAL_ORE, side: T.COAL_ORE, bot: T.COAL_ORE, drop: 19, stack: 64, color: '#444444' },
    // 20 DIAMOND ORE
    { name: 'Diamond Ore', solid: true, transparent: false, top: T.DIAMOND_ORE, side: T.DIAMOND_ORE, bot: T.DIAMOND_ORE, drop: 20, stack: 64, color: '#20C8C0' },
    // 21 GOLD BLOCK
    { name: 'Gold Block', solid: true, transparent: false, top: T.GOLD_BLOCK, side: T.GOLD_BLOCK, bot: T.GOLD_BLOCK, drop: 21, stack: 64, color: '#F5D000' },
    // 22 IRON BLOCK
    { name: 'Iron Block', solid: true, transparent: false, top: T.IRON_BLOCK, side: T.IRON_BLOCK, bot: T.IRON_BLOCK, drop: 22, stack: 64, color: '#CCCCCC' },
    // 23 DIAMOND BLOCK
    { name: 'Diamond Block', solid: true, transparent: false, top: T.DIAMOND_BLOCK, side: T.DIAMOND_BLOCK, bot: T.DIAMOND_BLOCK, drop: 23, stack: 64, color: '#2ECEC8' },
    // 24 SNOW
    { name: 'Snow', solid: true, transparent: false, top: T.SNOW, side: T.SNOW, bot: T.DIRT, drop: 24, stack: 64, color: '#F0F0F8' },
    // 25 ICE
    { name: 'Ice', solid: true, transparent: true, top: T.ICE, side: T.ICE, bot: T.ICE, drop: 0, stack: 64, color: '#8AB5D4' },
    // 26 TNT
    { name: 'TNT', solid: true, transparent: false, top: T.TNT_TOP, side: T.TNT_SIDE, bot: T.TNT_TOP, drop: 26, stack: 64, color: '#CC2222' },
    // 27 BOOKSHELF
    { name: 'Bookshelf', solid: true, transparent: false, top: T.PLANKS, side: T.BOOKSHELF, bot: T.PLANKS, drop: 27, stack: 64, color: '#7B5A3E' },
    // 28 GLOWSTONE
    { name: 'Glowstone', solid: true, transparent: false, top: T.GLOWSTONE, side: T.GLOWSTONE, bot: T.GLOWSTONE, drop: 28, stack: 64, color: '#F0D060' },
    // 29 CACTUS
    { name: 'Cactus', solid: true, transparent: false, top: T.CACTUS, side: T.CACTUS, bot: T.CACTUS, drop: 29, stack: 64, color: '#2A7A2A' },
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
    [ITEM.STICK]: { name: 'Stick', color: '#8B6343', stack: 64 },
    [ITEM.COAL]: { name: 'Coal', color: '#222222', stack: 64 },
    [ITEM.IRON_INGOT]: { name: 'Iron Ingot', color: '#DDDDDD', stack: 64 },
    [ITEM.GOLD_INGOT]: { name: 'Gold Ingot', color: '#F5D000', stack: 64 },
    [ITEM.DIAMOND]: { name: 'Diamond', color: '#2ECEC8', stack: 64 },
    [ITEM.FLINT]: { name: 'Flint', color: '#666677', stack: 64 },
    [ITEM.WOODEN_PICKAXE]: { name: 'Wooden Pickaxe', color: '#B8935A', stack: 1 },
    [ITEM.STONE_PICKAXE]: { name: 'Stone Pickaxe', color: '#8A8A8A', stack: 1 },
    [ITEM.IRON_PICKAXE]: { name: 'Iron Pickaxe', color: '#CCCCCC', stack: 1 },
    [ITEM.GOLD_PICKAXE]: { name: 'Gold Pickaxe', color: '#F5D000', stack: 1 },
    [ITEM.DIAMOND_PICKAXE]: { name: 'Diamond Pickaxe', color: '#2ECEC8', stack: 1 },
    [ITEM.WOODEN_AXE]: { name: 'Wooden Axe', color: '#B8935A', stack: 1 },
    [ITEM.STONE_AXE]: { name: 'Stone Axe', color: '#8A8A8A', stack: 1 },
    [ITEM.IRON_AXE]: { name: 'Iron Axe', color: '#CCCCCC', stack: 1 },
    [ITEM.WOODEN_SHOVEL]: { name: 'Wooden Shovel', color: '#B8935A', stack: 1 },
    [ITEM.STONE_SHOVEL]: { name: 'Stone Shovel', color: '#8A8A8A', stack: 1 },
    [ITEM.IRON_SHOVEL]: { name: 'Iron Shovel', color: '#CCCCCC', stack: 1 },
    [ITEM.WOODEN_SWORD]: { name: 'Wooden Sword', color: '#B8935A', stack: 1 },
    [ITEM.STONE_SWORD]: { name: 'Stone Sword', color: '#8A8A8A', stack: 1 },
    [ITEM.IRON_SWORD]: { name: 'Iron Sword', color: '#CCCCCC', stack: 1 },
    [ITEM.DIAMOND_SWORD]: { name: 'Diamond Sword', color: '#2ECEC8', stack: 1 },
    [ITEM.WOODEN_HOE]: { name: 'Wooden Hoe', color: '#B8935A', stack: 1 },
    [ITEM.STONE_HOE]: { name: 'Stone Hoe', color: '#8A8A8A', stack: 1 },
    [ITEM.BOWL]: { name: 'Bowl', color: '#8B6343', stack: 64 },
    [ITEM.TORCH_ITEM]: { name: 'Torch', color: '#FFC040', stack: 64 },
};

export function getItemDef(id) {
    if (id > 0 && id < BLOCK_DEF.length) return BLOCK_DEF[id];
    return ITEM_DEF[id] || { name: 'Unknown', color: '#888', stack: 1 };
}
export function getItemColor(id) { return getItemDef(id)?.color || '#888'; }
export function getItemName(id) { return getItemDef(id)?.name || 'Unknown'; }
export function isBlockItem(id) { return id > 0 && id < BLOCK_DEF.length; }
export function getBlockDef(id) { return BLOCK_DEF[id] || BLOCK_DEF[0]; }
