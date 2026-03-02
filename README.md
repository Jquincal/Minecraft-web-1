# Minecraft Web Edition 🌍⛏️

A fully playable, browser-based voxel game inspired by Minecraft, built from scratch using pure JavaScript and **Three.js**. 

This project runs entirely on the client-side (no backend required) and features infinite procedural generation, an advanced crafting system, block interaction, and optimized chunk rendering architectures.

## Features ✨

* **Infinite Procedural Terrain:** Uses multi-octave `simplex-noise` to generate biomes (forests, deserts, snow), mountains, water, trees, cacti, and ore veins inside caves.
* **Optimized Chunk Mesher:** Implements "Greedy Face Culling" in a **Web Worker** to render only the exposed faces of blocks, allowing high frame rates on large render distances.
* **Physics & Controls:** Full AABB collision detection, gravity, jumping, and sneaking. Uses the HTML5 Pointer Lock API for first-person camera control.
* **Interaction:** Raycasting to break (hold Left Click) and place blocks (Right Click).
* **Inventory & Hotbar:** 36-slot inventory system with a 9-slot hotbar, controlled via keyboard numbers or mouse wheel.
* **Crafting System:** Fully functional 2×2 player crafting and 3×3 Crafting Table logic. Features over 35+ shaped and shapeless recipes including tools, decorative blocks, and material conversion.
* **Texture Atlas:** Hybrid approach combining procedural `<canvas>` drawn textures and real Minecraft PNG template extraction (for flawless dirt and grass).
* **UI/UX:** Animated main menu, loading screens, dynamic crosshair, health/hunger bars, FPS counter, and settings menu to control render distance and FOV.

## Technology Stack 🛠️

* **Core:** Vanilla JavaScript (ES Modules), HTML5, CSS3
* **3D Engine:** [Three.js](https://threejs.org/)
* **Noise Generation:** `simplex-noise`
* **Bundler & Dev Server:** [Vite](https://vitejs.dev/)

## Quick Start 🚀

To run the game locally, you'll need [Node.js](https://nodejs.org/) installed on your system.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/minecraftweb.git
   cd minecraftweb
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Play:**
   Open your browser and navigate to `http://localhost:5173`. Click **"Jugar"** to enter the world.

## Controls 🎮

| Action | Control |
|---|---|
| Move | `W` `A` `S` `D` |
| Jump | `Space` |
| Sneak / Crouch | `Shift` |
| Look Around | `Mouse` (Pointer Lock) |
| Break Block | `Left Click` (Hold) |
| Place Block | `Right Click` |
| Open Inventory | `E` |
| Pause Game / Menu | `ESC` |
| Action Bar Slots | `1` - `9` or `Mouse Wheel` |
| Use Crafting Table | Aim at Table + `Right Click` |

## Project Structure 📁

```text
minecraftweb/
├── public/                # Static assets and template images
│   └── dirt_template.png
├── src/
│   ├── assets/            # Texture atlas generation
│   ├── crafting/          # Recipes and recipe pattern matching engine
│   ├── engine/            # World generation, Physics, AABB, Player, and Chunks
│   ├── styles/            # UI and HUD CSS styling
│   ├── ui/                # UI overlays (Menus, HUD, Inventory)
│   ├── workers/           # Web Worker for chunk mesh generation
│   └── main.js            # Three.js setup, Game loop, State machine
├── index.html             # Shell and UI mounting points
├── package.json           
└── vite.config.js         # Vite configuration with strict Worker support
```

## Crafting Reference 🪚
* **Planks:** 1 Wood (Log) → 4 Planks
* **Sticks:** 2 Planks (Vertical) → 4 Sticks
* **Crafting Table:** 4 Planks (2x2 grid)
* **Wooden/Stone/Iron Tools:** Standard Minecraft recipe shapes using Sticks + Material.

## License 📄
This project is an educational tribute. Not affiliated with Mojang or Microsoft. "Minecraft" is a trademark of Mojang Synergies AB.
