import { getItemColor, getItemName } from '../engine/blocks.js';
import { matchRecipe, consumeCraftingIngredients } from '../crafting/CraftingEngine.js';

// ──────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────

/** Create an absolutely-positioned clickable slot div directly in `container` */
function makeGuiSlot(container, left, top, onMouseDown) {
    const el = document.createElement('div');
    el.className  = 'gui-slot';
    el.style.left = left + 'px';
    el.style.top  = top  + 'px';
    el.addEventListener('mousedown', e => {
        if (e.button !== 0 && e.button !== 2) return;
        e.preventDefault();
        onMouseDown(e.button === 2);          // true = right-click
    });
    el.addEventListener('contextmenu', e => e.preventDefault());
    container.appendChild(el);
    return el;
}

/** Render an item stack into a gui-slot element */
function renderGuiSlot(el, item, icons) {
    if (!el) return;
    el.innerHTML          = '';
    el.style.backgroundImage  = '';
    el.style.backgroundColor  = '';
    el.title = '';
    if (item && item.id) {
        if (icons && icons[item.id]) {
            el.style.backgroundImage = `url(${icons[item.id]})`;
            el.style.backgroundSize  = 'contain';
        } else {
            el.style.backgroundColor = getItemColor(item.id);
        }
        el.title = getItemName(item.id);
        if (item.count > 1) {
            const c = document.createElement('span');
            c.className   = 'slot-count';
            c.textContent = item.count;
            el.appendChild(c);
        }
    }
}

// ──────────────────────────────────────────────────────────
// InventoryScreen
// Sprite: /textures/gui/container/inventory.png  (176 × 166 px)
//
// Slot layout (measured from PNG):
//   Armor     : x=8,  y=9+(i*18)    (4 slots vertical)
//   Craft 2×2 : x=99+(col*18), y=19+(row*18)
//   Craft out : x=154, y=28
//   Main 9×3  : x=9+(col*18), y=85+(row*18)
//   Hotbar    : x=9+(i*18),   y=142
// ──────────────────────────────────────────────────────────
export class InventoryScreen {
    constructor(player, icons = {}) {
        this.player = player;
        this.icons  = icons;
        this.el     = document.getElementById('inventory-screen');
        this.gui    = document.getElementById('inventory-gui');

        this.craftGrid    = Array(4).fill(null);  // 2×2
        this._craftResult = null;

        // Floating cursor element
        this.cursorEl = document.getElementById('floating-cursor');
        document.addEventListener('mousemove', e => {
            if (!this.isOpen()) return;
            this.cursorEl.style.left = e.clientX + 'px';
            this.cursorEl.style.top  = e.clientY + 'px';
        });

        this._build();
        document.addEventListener('keydown', e => {
            if ((e.code === 'KeyE' || e.code === 'Escape') && this.isOpen()) this.hide();
        });
    }

    _build() {
        const g = this.gui;
        g.innerHTML = '';

        // Armor (4 vertical slots)
        this.armorEls = [];
        for (let i = 0; i < 4; i++) {
            this.armorEls.push(makeGuiSlot(g, 8, 9 + i * 18, r => this._clickArmor(i, r)));
        }

        // Crafting 2×2
        this.craftEls = [];
        for (let i = 0; i < 4; i++) {
            const col = i % 2, row = Math.floor(i / 2);
            this.craftEls.push(makeGuiSlot(g, 99 + col * 18, 19 + row * 18, r => this._clickCraft(i, r)));
        }

        // Craft output
        this.craftOutEl = makeGuiSlot(g, 154, 28, r => this._clickCraftOutput(r));

        // Main inventory 9×3 (player.inventory slots 9–35)
        this.invEls = new Array(36).fill(null);
        for (let i = 9; i < 36; i++) {
            const idx = i - 9, col = idx % 9, row = Math.floor(idx / 9);
            this.invEls[i] = makeGuiSlot(g, 9 + col * 18, 85 + row * 18, r => this._clickInv(i, r));
        }

        // Hotbar (player.inventory slots 0–8)
        for (let i = 0; i < 9; i++) {
            this.invEls[i] = makeGuiSlot(g, 9 + i * 18, 142, r => this._clickInv(i, r));
        }
    }

    // ── Pure cursor logic ──────────────────────────────────
    _swapOrMerge(slotItem, cursor, isRight) {
        if (!cursor && !slotItem) return { slot: null, cursor: null };

        // Pick up from slot
        if (!cursor && slotItem) {
            if (isRight) {
                const take = Math.ceil(slotItem.count / 2);
                const left = slotItem.count - take;
                return {
                    slot:   left > 0 ? { id: slotItem.id, count: left } : null,
                    cursor: { id: slotItem.id, count: take }
                };
            }
            return { slot: null, cursor: { id: slotItem.id, count: slotItem.count } };
        }

        // Place into empty slot
        if (cursor && !slotItem) {
            if (isRight) {
                const nc = cursor.count > 1 ? { ...cursor, count: cursor.count - 1 } : null;
                return { slot: { id: cursor.id, count: 1 }, cursor: nc };
            }
            return { slot: { ...cursor }, cursor: null };
        }

        // Both non-empty
        if (cursor.id === slotItem.id) {
            const add  = isRight ? 1 : cursor.count;
            const move = Math.min(add, 64 - slotItem.count);
            if (move <= 0) return { slot: slotItem, cursor };
            return {
                slot:   { id: slotItem.id, count: slotItem.count + move },
                cursor: cursor.count - move > 0 ? { id: cursor.id, count: cursor.count - move } : null
            };
        }

        // Swap (left-click only; right-click leaves both unchanged)
        return isRight
            ? { slot: slotItem, cursor }
            : { slot: { ...cursor }, cursor: { ...slotItem } };
    }

    _clickInv(idx, isRight) {
        const r = this._swapOrMerge(this.player.inventory[idx], this.player.cursor, isRight);
        this.player.inventory[idx] = r.slot;
        this.player.cursor         = r.cursor;
        this.render();
    }

    _clickArmor(idx, isRight) {
        const r = this._swapOrMerge(this.player.armor[idx], this.player.cursor, isRight);
        this.player.armor[idx] = r.slot;
        this.player.cursor     = r.cursor;
        this.render();
    }

    _clickCraft(idx, isRight) {
        const r = this._swapOrMerge(this.craftGrid[idx], this.player.cursor, isRight);
        this.craftGrid[idx] = r.slot;
        this.player.cursor  = r.cursor;
        this.render();
    }

    _clickCraftOutput(isRight) {
        if (!this._craftResult) return;
        const res = this._craftResult;
        if (this.player.cursor) {
            if (this.player.cursor.id !== res.id || this.player.cursor.count + res.count > 64) return;
            this.player.cursor.count += res.count;
        } else {
            this.player.cursor = { id: res.id, count: res.count };
        }
        // Consume one of each ingredient
        for (let i = 0; i < 4; i++) {
            if (this.craftGrid[i]) {
                this.craftGrid[i].count--;
                if (this.craftGrid[i].count <= 0) this.craftGrid[i] = null;
            }
        }
        this._craftResult = null;
        this.render();
    }

    _checkRecipe() {
        const g    = this.craftGrid.map(s => s ? s.id : null);
        const flat = [g[0], g[1], null, g[2], g[3], null, null, null, null];
        this._craftResult = matchRecipe(flat, false);
    }

    render() {
        if (!this.isOpen()) return;
        for (let i = 0; i < 36; i++) renderGuiSlot(this.invEls[i],   this.player.inventory[i], this.icons);
        for (let i = 0; i < 4;  i++) renderGuiSlot(this.armorEls[i],  this.player.armor[i],     this.icons);
        for (let i = 0; i < 4;  i++) renderGuiSlot(this.craftEls[i],  this.craftGrid[i],         this.icons);
        this._checkRecipe();
        renderGuiSlot(this.craftOutEl, this._craftResult, this.icons);

        // Floating cursor
        const cur = this.player.cursor;
        if (cur) {
            this.cursorEl.classList.remove('hidden');
            this.cursorEl.innerHTML = '';
            if (this.icons[cur.id]) {
                this.cursorEl.style.backgroundImage  = `url(${this.icons[cur.id]})`;
                this.cursorEl.style.backgroundColor = '';
            } else {
                this.cursorEl.style.backgroundImage  = '';
                this.cursorEl.style.backgroundColor = getItemColor(cur.id);
            }
            if (cur.count > 1) {
                const c = document.createElement('span');
                c.className = 'slot-count';
                c.textContent = cur.count;
                this.cursorEl.appendChild(c);
            }
        } else {
            this.cursorEl.classList.add('hidden');
        }
    }

    show() {
        this.el.classList.remove('hidden');
        this.render();
    }

    hide() {
        this.el.classList.add('hidden');
        // Put held cursor item back into inventory
        if (this.player.cursor) {
            this.player.addItem(this.player.cursor.id, this.player.cursor.count);
            this.player.cursor = null;
        }
        this.cursorEl.classList.add('hidden');
    }

    isOpen() { return !this.el.classList.contains('hidden'); }
}

// ──────────────────────────────────────────────────────────
// CraftingTableScreen
// Sprite: /textures/gui/container/crafting_table.png (176 × 166 px)
//
// Slot layout:
//   Craft 3×3 : x=30+(col*18), y=17+(row*18)
//   Craft out : x=124, y=35
//   Main 9×3  : x=7+(col*18),  y=84+(row*18)
//   Hotbar    : x=7+(i*18),    y=141
// ──────────────────────────────────────────────────────────
export class CraftingTableScreen {
    constructor(player, icons = {}) {
        this.player = player;
        this.icons  = icons;
        this.el     = document.getElementById('crafting-table-screen');
        this.gui    = document.getElementById('ct-gui');

        this.craftGrid     = Array(9).fill(null);
        this._craftResult  = null;
        this._selectedItem = null;

        this._build();
        document.getElementById('btn-close-crafting')?.addEventListener('click', () => this.hide());
        document.addEventListener('keydown', e => {
            if ((e.code === 'KeyE' || e.code === 'Escape') && this.isOpen()) this.hide();
        });
    }

    _build() {
        const g = this.gui;
        if (!g) return;
        g.innerHTML = '';

        // 3×3 crafting grid
        this.craftEls = [];
        for (let i = 0; i < 9; i++) {
            const col = i % 3, row = Math.floor(i / 3);
            this.craftEls.push(makeGuiSlot(g, 30 + col * 18, 17 + row * 18, () => this._handleCraftClick(i)));
        }

        // Output
        this.craftOutEl = makeGuiSlot(g, 124, 35, () => this._takeCraftResult());

        // Main inventory 9×3
        this.invEls = new Array(36).fill(null);
        for (let i = 9; i < 36; i++) {
            const idx = i - 9, col = idx % 9, row = Math.floor(idx / 9);
            this.invEls[i] = makeGuiSlot(g, 7 + col * 18, 84 + row * 18, () => this._handleInvClick(i));
        }
        // Hotbar
        for (let i = 0; i < 9; i++) {
            this.invEls[i] = makeGuiSlot(g, 7 + i * 18, 141, () => this._handleInvClick(i));
        }
    }

    _handleCraftClick(idx) {
        if (this._selectedItem) {
            const cur = this.craftGrid[idx];
            if (cur === null || cur === this._selectedItem.id) {
                this.craftGrid[idx] = this._selectedItem.id;
                this._selectedItem.count--;
                if (this._selectedItem.count <= 0) this._selectedItem = null;
            }
        } else {
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
            this.craftGrid        = Array(9).fill(null);
            this._craftResult     = null;
        }
        this.render();
    }

    render() {
        if (!this.isOpen() || !this.gui) return;
        this._checkRecipe();
        for (let i = 0; i < 9;  i++) renderGuiSlot(this.craftEls[i], this.craftGrid[i] ? { id: this.craftGrid[i], count: 1 } : null, this.icons);
        renderGuiSlot(this.craftOutEl, this._craftResult, this.icons);
        for (let i = 0; i < 36; i++) renderGuiSlot(this.invEls[i], this.player.inventory[i], this.icons);
    }

    show()   { this.el.classList.remove('hidden'); this.render(); }
    hide()   { this.el.classList.add('hidden'); }
    isOpen() { return !this.el.classList.contains('hidden'); }
}
