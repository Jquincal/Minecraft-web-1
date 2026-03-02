import * as THREE from 'three';
import { World } from './engine/World.js';
import { Player } from './engine/Player.js';
import { ChunkManager } from './engine/ChunkManager.js';
import { buildTextureAtlas } from './assets/TextureAtlas.js';
import { HUD } from './ui/HUD.js';
import { MainMenu, LoadingScreen, PauseMenu, SettingsModal, CreditsModal } from './ui/Menus.js';
import { InventoryScreen, CraftingTableScreen } from './ui/InventoryScreens.js';

// ──────────────────────────────────────────────────────────
// State Machine
// ──────────────────────────────────────────────────────────
const STATE = { MENU: 'MENU', LOADING: 'LOADING', PLAYING: 'PLAYING', PAUSED: 'PAUSED', INVENTORY: 'INVENTORY', CRAFTING_TABLE: 'CRAFTING' };
let state = STATE.MENU;

// ──────────────────────────────────────────────────────────
// Three.js setup
// ──────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.sortObjects = true; // Ensure transparent objects are sorted

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 512);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.FogExp2(0x87CEEB, 0.018);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xfffbe0, 1.1);
sunLight.position.set(80, 120, 60);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 300;
sunLight.shadow.camera.left = -80; sunLight.shadow.camera.right = 80;
sunLight.shadow.camera.top = 80; sunLight.shadow.camera.bottom = -80;
scene.add(sunLight);

// Block highlight box
const hlGeo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.4 });
const hlMesh = new THREE.Mesh(hlGeo, hlMat);
hlMesh.visible = false;
scene.add(hlMesh);

// ──────────────────────────────────────────────────────────
// Game objects
// ──────────────────────────────────────────────────────────
let world, player, chunkManager, hud, invScreen, craftScreen;

// ──────────────────────────────────────────────────────────
// UI Setup
// ──────────────────────────────────────────────────────────
const loadingScreen = new LoadingScreen();

const mainMenu = new MainMenu({
    onPlay: startGame,
    onSettings: () => settingsModal.show(),
    onCredits: () => creditsModal.show(),
});

const pauseMenu = new PauseMenu({
    onResume: () => resumeGame(),
    onSettings: () => settingsModal.show(),
    onMenu: () => backToMenu(),
});

// Expose game to settings
const gameRef = {
    get player() { return player; },
    get camera() { return camera; },
    setRenderDistance(d) { if (chunkManager) chunkManager.setRenderDistance(d); }
};
const settingsModal = new SettingsModal(gameRef);
const creditsModal = new CreditsModal();

// Close settings/credits modals via .close-modal buttons already wired in Menus.js

// ──────────────────────────────────────────────────────────
// Game lifecycle
// ──────────────────────────────────────────────────────────
async function startGame() {
    mainMenu.hide();
    loadingScreen.show(0);
    state = STATE.LOADING;

    // Build atlas
    loadingScreen.setProgress(0.1);
    const atlas = await buildTextureAtlas();

    // Create world
    loadingScreen.setProgress(0.2);
    world = new World(Math.random());

    // Create player
    player = new Player(camera, world, canvas);

    // Create chunk manager
    chunkManager = new ChunkManager(world, scene, atlas);

    // Pre-generate starting chunks
    const spawnX = 0, spawnZ = 0;
    let chunksGenerated = 0;
    const totalChunks = 25;
    for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
            world.generateChunk(dx, dz);
            chunksGenerated++;
            loadingScreen.setProgress(0.2 + 0.6 * (chunksGenerated / totalChunks));
            await new Promise(r => setTimeout(r, 0)); // yield
        }
    }

    // Spawn player on top of terrain
    const spawnY = world.groundY(spawnX + 8, spawnZ + 8) + 1;
    player.pos.set(spawnX + 8, spawnY, spawnZ + 8);

    // Build UI
    hud = new HUD();
    invScreen = new InventoryScreen(player);
    craftScreen = new CraftingTableScreen(player);

    // Input for pause/inventory
    document.addEventListener('keydown', onGameKey);

    loadingScreen.setProgress(1);
    await new Promise(r => setTimeout(r, 300));

    loadingScreen.hide();
    hud.show();
    state = STATE.PLAYING;
    canvas.requestPointerLock();
}

function onGameKey(e) {
    if (state === STATE.PLAYING) {
        if (e.code === 'Escape') { pauseGame(); return; }
        if (e.code === 'KeyE') { openInventory(); return; }
    } else if (state === STATE.PAUSED) {
        if (e.code === 'Escape') { resumeGame(); return; }
    } else if (state === STATE.INVENTORY) {
        if (e.code === 'KeyE' || e.code === 'Escape') { closeScreens(); return; }
    } else if (state === STATE.CRAFTING_TABLE) {
        if (e.code === 'KeyE' || e.code === 'Escape') { closeScreens(); return; }
    }
}

function pauseGame() {
    state = STATE.PAUSED;
    document.exitPointerLock();
    pauseMenu.show();
}
function resumeGame() {
    state = STATE.PLAYING;
    pauseMenu.hide();
    canvas.requestPointerLock();
}
function openInventory() {
    state = STATE.INVENTORY;
    document.exitPointerLock();
    invScreen.show();
}
function closeScreens() {
    if (invScreen) invScreen.hide();
    if (craftScreen) craftScreen.hide();
    state = STATE.PLAYING;
    canvas.requestPointerLock();
}
function backToMenu() {
    document.removeEventListener('keydown', onGameKey);
    document.exitPointerLock();
    pauseMenu.hide();
    hud.hide();
    if (invScreen) invScreen.hide();
    if (craftScreen) craftScreen.hide();
    // remove chunk meshes
    if (chunkManager) {
        for (const [, mesh] of chunkManager.meshes) { scene.remove(mesh); mesh.geometry.dispose(); }
        chunkManager.meshes.clear();
    }
    world = null; player = null; chunkManager = null;
    state = STATE.MENU;
    mainMenu.show();
}

// ──────────────────────────────────────────────────────────
// Game Loop
// ──────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let lastFpsTime = 0, fpsFrames = 0, fps = 60;

function loop() {
    requestAnimationFrame(loop);

    const dt = Math.min(clock.getDelta(), 0.05); // cap at 50ms

    // FPS tracking
    fpsFrames++;
    const now = performance.now();
    if (now - lastFpsTime >= 500) {
        fps = Math.round(fpsFrames / ((now - lastFpsTime) / 1000));
        fpsFrames = 0; lastFpsTime = now;
    }

    if (state === STATE.PLAYING || state === STATE.INVENTORY || state === STATE.CRAFTING_TABLE) {
        if (player) {
            if (state === STATE.PLAYING) player.update(dt);
            player.fps = fps;

            // Chunk manager
            if (chunkManager) chunkManager.update(player.pos);

            // Highlight targeted block
            if (player.targeted && state === STATE.PLAYING) {
                const { x, y, z } = player.targeted.pos;
                hlMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
                hlMesh.visible = true;
            } else {
                hlMesh.visible = false;
            }

            // Crafting table right-click detection
            if (state === STATE.PLAYING && player.targeted) {
                // handled via mousedown event below
            }

            // HUD update
            if (hud && state === STATE.PLAYING) hud.update(player);

            // Render inventory if open
            if (state === STATE.INVENTORY && invScreen) invScreen.render();
            if (state === STATE.CRAFTING_TABLE && craftScreen) craftScreen.render();
        }
    }

    renderer.render(scene, camera);
}

// Detect crafting table right-click → open crafting screen
canvas.addEventListener('mousedown', async e => {
    if (e.button === 2 && state === STATE.PLAYING && player?.targeted && player.locked) {
        const { BLOCK } = await import('./engine/blocks.js');
        if (player.targeted.id === BLOCK.CRAFTING_TABLE) {
            state = STATE.CRAFTING_TABLE;
            document.exitPointerLock();
            craftScreen.show();
        }
    }
});

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start the render loop and show menu
mainMenu.show();
loop();
