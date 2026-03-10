import { getItemColor, getItemName } from '../engine/blocks.js';

export class HUD {
    constructor(icons = {}) {
        this.icons = icons;
        this.el = document.getElementById('hud');
        this.fpsEl = document.getElementById('fps-counter');
        this.posEl = document.getElementById('pos-display');
        this.blkEl = document.getElementById('block-display');
        // Elements
        // Elements
        this.heartsEl = document.getElementById('health-hearts');
        this.hungerEl = document.getElementById('hunger-icons');
        this.hotbarEl = document.getElementById('hotbar-slots');
        this.miningProgress = document.getElementById('mining-progress');
        this.miningFill = document.getElementById('mining-fill');

        this._fps = 60; this._fpsAcc = 0; this._fpsFrames = 0;
        this._buildHotbar();
        this._buildHearts();
        this._buildHunger();
    }

    _buildHotbar() {
        this.hotbarEl.innerHTML = '';
        this.slotEls = [];
        for (let i = 0; i < 9; i++) {
            const el = document.createElement('div');
            el.className = 'hot-slot';
            el.innerHTML = `<span class="slot-key">${i + 1}</span>`;
            this.hotbarEl.appendChild(el);
            this.slotEls.push(el);
        }
    }

    _buildHearts() {
        this.heartsEl.innerHTML = '';
        this.heartEls = [];
        for (let i = 0; i < 10; i++) {
            const h = document.createElement('div'); h.className = 'heart';
            this.heartsEl.appendChild(h); this.heartEls.push(h);
        }
    }

    _buildHunger() {
        this.hungerEl.innerHTML = '';
        this.hungerEls = [];
        for (let i = 0; i < 10; i++) {
            const h = document.createElement('div'); h.className = 'hunger-icon';
            this.hungerEl.appendChild(h); this.hungerEls.push(h);
        }
    }

    show() { this.el.classList.remove('hidden'); }
    hide() { this.el.classList.add('hidden'); }

    update(player) {
        // FPS
        this._fpsFrames++;
        this._fpsAcc += player.fps;
        if (this._fpsFrames >= 10) {
            this.fpsEl.textContent = `FPS: ${(this._fpsAcc / this._fpsFrames) | 0}`;
            this._fpsAcc = 0; this._fpsFrames = 0;
        }

        // Position
        const p = player.pos;
        this.posEl.textContent = `X:${p.x.toFixed(1)} Y:${p.y.toFixed(1)} Z:${p.z.toFixed(1)}`;

        // Targeted block
        if (player.targeted) {
            const { id } = player.targeted;
            this.blkEl.textContent = `Bloque: ${getItemName(id)}`;
        } else {
            this.blkEl.textContent = 'Bloque: —';
        }

        // Health hearts
        const hp = Math.max(0, player.health);
        for (let i = 0; i < 10; i++) {
            const full = (i + 1) * 2 <= hp, half = (i * 2 + 1) === Math.ceil(hp) && hp % 2 === 1;
            this.heartEls[i].className = 'heart' + (full ? '' : half ? ' half' : ' empty');
        }

        // Hunger
        const hg = Math.max(0, player.hunger);
        for (let i = 0; i < 10; i++) {
            this.hungerEls[i].className = 'hunger-icon' + (i * 2 < hg ? '' : ' empty');
        }

        // Hotbar
        for (let i = 0; i < 9; i++) {
            const slot = player.inventory[i];
            const el = this.slotEls[i];
            // mark active
            el.className = 'hot-slot' + (i === player.hotbarSlot ? ' active' : '');
            // content
            const key = el.querySelector('.slot-key');
            el.innerHTML = ''; el.appendChild(key);
            if (slot && slot.id) {
                const swatch = document.createElement('div');
                swatch.className = 'block-swatch';
                
                if (this.icons[slot.id]) {
                    swatch.style.backgroundImage = `url(${this.icons[slot.id]})`;
                } else {
                    swatch.style.background = getItemColor(slot.id);
                }
                
                swatch.title = getItemName(slot.id);
                el.appendChild(swatch);
                if (slot.count > 1) {
                    const cnt = document.createElement('span');
                    cnt.className = 'slot-count'; cnt.textContent = slot.count;
                    el.appendChild(cnt);
                }
            }
        }

        // Break progress indicator
        if (player.breakProgress > 0 && player.breakTarget) {
            this.miningProgress.classList.remove('hidden');
            this.miningFill.style.width = (player.breakProgress * 100) + '%';
        } else {
            this.miningProgress.classList.add('hidden');
            this.miningFill.style.width = '0%';
        }
    }
}
