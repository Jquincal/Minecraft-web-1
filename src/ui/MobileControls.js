export class MobileControls {
    constructor(player) {
        this.player = player;
        this.el = document.getElementById('mobile-controls');

        // Only initialize if touch is supported AND elements exist
        if (!('ontouchstart' in window) || !this.el) return;

        this.touchPad = document.getElementById('touch-pad-zone');
        this.joystickZone = document.getElementById('joystick-zone');
        this.stick = document.getElementById('joystick-stick');

        // Try to show controls if it's a touch device
        this.show();

        this._bindJoystick();
        this._bindCamera();
        this._bindButtons();
    }

    show() {
        if (this.el) this.el.classList.remove('hidden');
    }

    hide() {
        if (this.el) this.el.classList.add('hidden');
    }

    _bindJoystick() {
        let joyId = null;
        const maxDist = 40; // Max pixels joystick can move from center

        const resetJoystick = () => {
            joyId = null;
            this.stick.style.transform = `translate(-50%, -50%)`;
            // Release all WASD keys
            this.player.keys['KeyW'] = false;
            this.player.keys['KeyS'] = false;
            this.player.keys['KeyA'] = false;
            this.player.keys['KeyD'] = false;
        };

        this.joystickZone.addEventListener('touchstart', e => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            joyId = touch.identifier;
            this._handleJoyMove(touch);
        });

        this.joystickZone.addEventListener('touchmove', e => {
            e.preventDefault();
            for (const touch of e.changedTouches) {
                if (touch.identifier === joyId) {
                    this._handleJoyMove(touch);
                }
            }
        });

        this.joystickZone.addEventListener('touchend', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === joyId) resetJoystick();
            }
        });
        this.joystickZone.addEventListener('touchcancel', resetJoystick);
    }

    _handleJoyMove(touch) {
        const rect = this.joystickZone.getBoundingClientRect();
        // Calculate relative to the center of the joystick zone
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 40) { // clamp to max Dist
            dx = (dx / dist) * 40;
            dy = (dy / dist) * 40;
        }

        this.stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        // Normalize inputs to WASD
        const normX = dx / 40;
        const normY = dy / 40;
        const threshold = 0.3;

        this.player.keys['KeyW'] = normY < -threshold;
        this.player.keys['KeyS'] = normY > threshold;
        this.player.keys['KeyA'] = normX < -threshold;
        this.player.keys['KeyD'] = normX > threshold;
    }

    _bindCamera() {
        let camTouchId = null;
        let lastX = 0;
        let lastY = 0;
        // Sensitivity for touch
        const touchSens = 0.005;

        this.touchPad.addEventListener('touchstart', e => {
            if (camTouchId !== null) return; // already tracking one
            const touch = e.changedTouches[0];
            camTouchId = touch.identifier;
            lastX = touch.clientX;
            lastY = touch.clientY;
        });

        this.touchPad.addEventListener('touchmove', e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === camTouchId) {
                    const dx = touch.clientX - lastX;
                    const dy = touch.clientY - lastY;
                    lastX = touch.clientX;
                    lastY = touch.clientY;

                    // Apply to player yaw/pitch exactly like mouse does
                    // Note: mobile doesn't need pointer lock
                    this.player.yaw -= dx * touchSens;
                    this.player.pitch -= dy * touchSens;

                    const lim = Math.PI / 2 - 0.01;
                    this.player.pitch = Math.max(-lim, Math.min(lim, this.player.pitch));
                }
            }
        });

        const endCam = e => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === camTouchId) camTouchId = null;
            }
        };

        this.touchPad.addEventListener('touchend', endCam);
        this.touchPad.addEventListener('touchcancel', endCam);
    }

    _bindButtons() {
        const bindBtn = (id, onDown, onUp) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', e => { e.preventDefault(); onDown(); });
            btn.addEventListener('touchend', e => { e.preventDefault(); if (onUp) onUp(); });
        };

        // Mine
        bindBtn('btn-touch-mine',
            () => { this.player.breakHeld = true; },
            () => {
                this.player.breakHeld = false;
                this.player.breakProgress = 0;
                this.player.breakTarget = null;
            }
        );

        // Place
        bindBtn('btn-touch-place', () => { this.player._placeBlock(); });

        // Jump
        bindBtn('btn-touch-jump',
            () => { this.player.keys['Space'] = true; },
            () => { this.player.keys['Space'] = false; }
        );

        // Pause / Inventory
        // These dispatch keyboard events to be caught by main.js state machine
        bindBtn('btn-touch-pause', () => {
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
        });
        bindBtn('btn-touch-inv', () => {
            document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
        });
    }
}
