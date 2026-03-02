import { getItemColor, getItemName, getItemDef } from '../engine/blocks.js';
import { matchRecipe, consumeCraftingIngredients } from '../crafting/CraftingEngine.js';

function makeSlot(id, slotIdx, onClick) {
    const el = document.createElement('div');
    el.className = 'item-slot';
    el.dataset.slot = slotIdx;
    el.addEventListener('click', () => onClick(slotIdx, el));
    return el;
}

function renderSlot(el, item) {
    el.innerHTML = '';
    if (item && item.id) {
        const sw = document.createElement('div');
        sw.className = 'slot-swatch';
        sw.style.background = getItemColor(item.id);
        sw.title = getItemName(item.id);
        el.appendChild(sw);
        if (item.count > 1) {
            const c = document.createElement('span'); c.className = 'slot-count';
            c.textContent = item.count; el.appendChild(c);
        }
    }
}

export class InventoryScreen {
    constructor(player) {
        this.player = player;
        this.el = document.getElementById('inventory-screen');
        this.craftGrid = Array(4).fill(null); // 2×2

        this._build();
        document.addEventListener('keydown', e => {
            if (e.code === 'KeyE' || e.code === 'Escape') this.hide();
        });
    }

    _build() {
        // Craft 2×2
        const cg = document.getElementById('craft-grid-2x2');
        cg.className = 'craft-grid-2'; cg.innerHTML = '';
        this.craftSlotEls = [];
        for (let i = 0; i < 4; i++) {
            const el = makeSlot(null, i, () => this._craftClick(i));
            cg.appendChild(el); this.craftSlotEls.push(el);
        }
        // Craft output
        this.craftOutEl = document.getElementById('craft-output-2x2');
        this.craftOutEl.addEventListener('click', () => this._takeCraftResult());

        // 36 inventory slots
        const ig = document.getElementById('inventory-grid');
        ig.className = 'inv-grid'; ig.innerHTML = '';
        this.invSlotEls = [];
        // rows 1–3 (slots 9–35)
        for (let i = 9; i < 36; i++) {
            const el = makeSlot(null, i, () => this._invClick(i));
            ig.appendChild(el); this.invSlotEls.push(el);
        }
        // hotbar row
        const hb = document.getElementById('inv-hotbar');
        hb.className = 'inv-grid'; hb.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const el = makeSlot(null, i, () => this._invClick(i));
            hb.appendChild(el); this.invSlotEls.unshift(el); // prepend so index matches
        }
        // fix: rebuild properly
        this.invSlotEls = [];
        ig.innerHTML = ''; hb.innerHTML = '';
        for (let i = 9; i < 36; i++) {
            const el = makeSlot(null, i, (idx) => this._invClick(idx));
            el.dataset.invIdx = i;
            ig.appendChild(el); this.invSlotEls[i] = el;
        }
        for (let i = 0; i < 9; i++) {
            const el = makeSlot(null, i, (idx) => this._invClick(idx));
            el.dataset.invIdx = i;
            hb.appendChild(el); this.invSlotEls[i] = el;
        }
    }

    _invClick(idx) {
        // simple: if holding nothing and slot has item, pick it up mentally (just log)
        // For simplicity: toggle selection to move items
    }

    _craftClick(idx) {
        // Cycle through nearby items when clicking craft grid slot
    }

    _takeCraftResult() {
        if (!this._craftResult) return;
        const grid3 = this._padTo3x3(this.craftGrid);
        const ok = this.player.addItem(this._craftResult.id, this._craftResult.count);
        if (ok) {
            // consume 1 of each ingredient
            const consumed = consumeCraftingIngredients(this.player.inventory, grid3);
            this.player.inventory = consumed;
            this.craftGrid = Array(4).fill(null);
            this._craftResult = null;
        }
        this.render();
    }

    _padTo3x3(g2) {
        // pad 2×2 grid [0,1,2,3] → 3×3 grid [0,1,null,2,3,null,null,null,null]
        return [g2[0], g2[1], null, g2[2], g2[3], null, null, null, null];
    }

    _checkRecipe() {
        const grid3 = this._padTo3x3(this.craftGrid);
        this._craftResult = matchRecipe(grid3, false);
    }

    render() {
        if (this.el.classList.contains('hidden')) return;
        // craft grid
        for (let i = 0; i < 4; i++) {
            renderSlot(this.craftSlotEls[i], this.craftGrid[i] ? { id: this.craftGrid[i], count: 1 } : null);
        }
        this._checkRecipe();
        renderSlot(this.craftOutEl, this._craftResult ? { id: this._craftResult.id, count: this._craftResult.count } : null);
        // inventory
        for (let i = 0; i < 36; i++) {
            if (this.invSlotEls[i]) renderSlot(this.invSlotEls[i], this.player.inventory[i]);
        }
    }

    show() {
        this.el.classList.remove('hidden');
        this.render();
    }
    hide() { this.el.classList.add('hidden'); }
    isOpen() { return !this.el.classList.contains('hidden'); }
}

export class CraftingTableScreen {
    constructor(player) {
        this.player = player;
        this.el = document.getElementById('crafting-table-screen');
        this.craftGrid = Array(9).fill(null);
        this._craftResult = null;
        this._selectedItem = null; // {id,count} being held

        this._build();
        document.getElementById('btn-close-crafting').addEventListener('click', () => this.hide());
        document.addEventListener('keydown', e => {
            if ((e.code === 'KeyE' || e.code === 'Escape') && !this.el.classList.contains('hidden')) this.hide();
        });
    }

    _build() {
        const cg = document.getElementById('craft-grid-3x3');
        cg.className = 'craft-grid-3'; cg.innerHTML = '';
        this.craftSlotEls = [];
        for (let i = 0; i < 9; i++) {
            const el = makeSlot(null, i, () => this._handleCraftClick(i));
            cg.appendChild(el); this.craftSlotEls.push(el);
        }
        this.craftOutEl = document.getElementById('craft-output-3x3');
        this.craftOutEl.addEventListener('click', () => this._takeCraftResult());

        // inventory rows
        const ig = document.getElementById('ct-inventory-grid');
        ig.className = 'inv-grid'; ig.innerHTML = '';
        const hb = document.getElementById('ct-hotbar');
        hb.className = 'inv-grid'; hb.innerHTML = '';
        this.invSlotEls = [];
        for (let i = 9; i < 36; i++) {
            const el = makeSlot(null, i, () => this._handleInvClick(i));
            ig.appendChild(el); this.invSlotEls[i] = el;
        }
        for (let i = 0; i < 9; i++) {
            const el = makeSlot(null, i, () => this._handleInvClick(i));
            hb.appendChild(el); this.invSlotEls[i] = el;
        }
    }

    _handleCraftClick(idx) {
        if (this._selectedItem) {
            // place one of selected item into slot
            const cur = this.craftGrid[idx];
            if (cur === null || cur === this._selectedItem.id) {
                this.craftGrid[idx] = this._selectedItem.id;
                this._selectedItem.count--;
                if (this._selectedItem.count <= 0) this._selectedItem = null;
            }
        } else {
            // pick up from slot
            if (this.craftGrid[idx] !== null) {
                this._selectedItem = { id: this.craftGrid[idx], count: 1 };
                this.craftGrid[idx] = null;
            }
        }
        this._checkRecipe();
        this.render();
    }

    _handleInvClick(idx) {
        const slot = this.player.inventory[idx];
        if (this._selectedItem) {
            // put back
            this.player.addItem(this._selectedItem.id, this._selectedItem.count);
            this._selectedItem = null;
        } else if (slot) {
            this._selectedItem = { id: slot.id, count: slot.count };
            this.player.inventory[idx] = null;
        }
        this.render();
    }

    _checkRecipe() {
        this._craftResult = matchRecipe(this.craftGrid.map(v => v || null), true);
    }

    _takeCraftResult() {
        if (!this._craftResult) return;
        const ok = this.player.addItem(this._craftResult.id, this._craftResult.count);
        if (ok) {
            const consumed = consumeCraftingIngredients(this.player.inventory, this.craftGrid);
            this.player.inventory = consumed;
            this.craftGrid = Array(9).fill(null);
            this._craftResult = null;
        }
        this.render();
    }

    render() {
        if (this.el.classList.contains('hidden')) return;
        for (let i = 0; i < 9; i++) {
            renderSlot(this.craftSlotEls[i], this.craftGrid[i] ? { id: this.craftGrid[i], count: 1 } : null);
        }
        this._checkRecipe();
        renderSlot(this.craftOutEl, this._craftResult ? this._craftResult : null);
        for (let i = 0; i < 36; i++) {
            if (this.invSlotEls[i]) renderSlot(this.invSlotEls[i], this.player.inventory[i]);
        }
    }

    show() {
        this.el.classList.remove('hidden');
        this.render();
    }
    hide() { this.el.classList.add('hidden'); }
    isOpen() { return !this.el.classList.contains('hidden'); }
}
