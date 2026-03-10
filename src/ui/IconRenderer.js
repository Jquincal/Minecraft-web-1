import * as THREE from 'three';
import { BLOCK_DEF, TEXTURE_FILES, T } from '../engine/blocks.js';

/**
 * Renders isometric 3D thumbnails of all block types using an offscreen canvas.
 * Resulting data URLs are cached and can be used directly as image sources.
 */
export class IconRenderer {
    constructor() {
        this.icons = {}; // { blockId: dataURL }
        
        // 64x64 is a good size for UI thumbnails
        this.width = 64;
        this.height = 64;

        this.renderer = new THREE.WebGLRenderer({
            alpha: true,           // transparent background
            preserveDrawingBuffer: true,
            antialias: false       // keep edges pixelated
        });
        this.renderer.setSize(this.width, this.height);

        this.scene = new THREE.Scene();

        // Isometric Orthographic Camera setup
        const d = 1.2; // Frustum size
        this.camera = new THREE.OrthographicCamera(-d, d, d, -d, 0.1, 10);
        
        // Diagonal position to see Top, Right, Front evenly
        this.camera.position.set(1.5, 1.2, 1.5);
        this.camera.lookAt(0, 0, 0);

        // Lighting: Illuminate Top face fully, shade sides
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);
        
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight1.position.set(2, 3, 1);
        this.scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dirLight2.position.set(-1, -1, 2);
        this.scene.add(dirLight2);

        this.geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    /**
     * Call this once during game initialization to generate icons for all blocks
     */
    async generateAllIcons() {
        // First load all basic textures individually
        const loader = new THREE.TextureLoader();
        const baseTextures = [];
        
        // Pre-load all textures as raw CanvasTextures with NearestFilter
        const promises = TEXTURE_FILES.map((name, i) => {
            return new Promise(resolve => {
                loader.load(`textures/block/${name}.png`, tex => {
                    tex.magFilter = THREE.NearestFilter;
                    tex.minFilter = THREE.NearestFilter;
                    tex.colorSpace = THREE.SRGBColorSpace;
                    baseTextures[i] = tex;
                    resolve();
                }, undefined, () => {
                    // Fallback on missing
                    baseTextures[i] = new THREE.Texture();
                    resolve();
                });
            });
        });

        await Promise.all(promises);

        // Render each solid block
        for (let id = 1; id < BLOCK_DEF.length; id++) {
            const def = BLOCK_DEF[id];
            
            // Only render blocks that have defined textures, not raw items
            if (!def || def.solid === undefined) continue;
            
            // MeshBasicMaterials (using 6 materials for the 6 faces)
            // Order: +x, -x, +y, -y, +z, -z
            const mats = [
                new THREE.MeshLambertMaterial({ map: baseTextures[def.side] }), // Right
                new THREE.MeshLambertMaterial({ map: baseTextures[def.side] }), // Left
                new THREE.MeshLambertMaterial({ map: baseTextures[def.top] }),  // Top
                new THREE.MeshLambertMaterial({ map: baseTextures[def.bot] }),  // Bottom
                new THREE.MeshLambertMaterial({ map: baseTextures[def.side] }), // Front
                new THREE.MeshLambertMaterial({ map: baseTextures[def.side] })  // Back
            ];

            // Some special cases for cutout/transparent blocks
            mats.forEach(m => {
                if (def.cutout) { m.alphaTest = 0.5; m.transparent = false; }
                if (def.transparent && !def.cutout) { m.transparent = true; m.opacity = 0.5; }
            });

            const mesh = new THREE.Mesh(this.geometry, mats);
            this.scene.add(mesh);

            // Render it
            this.renderer.render(this.scene, this.camera);
            
            // Extract the PNG
            this.icons[id] = this.renderer.domElement.toDataURL("image/png");

            // Cleanup for next loop
            this.scene.remove(mesh);
            mats.forEach(m => m.dispose());
        }

        // Add special "air" icon (transparent) just in case
        this.icons[0] = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    }
}
