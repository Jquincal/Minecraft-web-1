export class MainMenu {
    constructor({ onPlay, onSettings, onCredits }) {
        this.el = document.getElementById('main-menu');
        document.getElementById('btn-play').addEventListener('click', onPlay);
        document.getElementById('btn-settings').addEventListener('click', onSettings);
        document.getElementById('btn-credits').addEventListener('click', onCredits);
    }
    show() { this.el.classList.remove('hidden'); }
    hide() { this.el.classList.add('hidden'); }
}

export class LoadingScreen {
    constructor() {
        this.el = document.getElementById('loading-screen');
        this.fill = document.getElementById('loading-fill');
        this.hint = document.getElementById('loading-hint');
        this._hints = [
            'Consejo: Presiona E para abrir el inventario',
            'Consejo: Presiona ESC para pausar',
            'Consejo: RMB coloca bloques',
            'Consejo: LMB mantén para romper bloques',
            'Consejo: Rueda del ratón cambia el slot',
        ];
    }
    show(p = 0) {
        this.el.classList.remove('hidden');
        this.hint.textContent = this._hints[Math.floor(Math.random() * this._hints.length)];
        this.setProgress(p);
    }
    hide() { this.el.classList.add('hidden'); }
    setProgress(p) { this.fill.style.width = `${Math.min(100, p * 100)}%`; }
}

export class PauseMenu {
    constructor({ onResume, onSettings, onMenu }) {
        this.el = document.getElementById('pause-menu');
        document.getElementById('btn-resume').addEventListener('click', onResume);
        document.getElementById('btn-pause-settings').addEventListener('click', onSettings);
        document.getElementById('btn-main-menu').addEventListener('click', onMenu);
    }
    show() { this.el.classList.remove('hidden'); }
    hide() { this.el.classList.add('hidden'); }
}

export class SettingsModal {
    constructor(game) {
        this.el = document.getElementById('settings-modal');
        this.rdSlider = document.getElementById('render-distance');
        this.rdVal = document.getElementById('rd-val');
        this.msSlider = document.getElementById('mouse-speed');
        this.msVal = document.getElementById('ms-val');
        this.fovSlider = document.getElementById('fov-slider');
        this.fovVal = document.getElementById('fov-val');
        this.game = game;

        this.rdSlider.addEventListener('input', () => {
            this.rdVal.textContent = this.rdSlider.value;
            game.setRenderDistance(+this.rdSlider.value);
        });
        this.msSlider.addEventListener('input', () => {
            this.msVal.textContent = (+this.msSlider.value).toFixed(1);
            if (game.player) game.player.mouseSensitivity = +this.msSlider.value * 0.001;
        });
        this.fovSlider.addEventListener('input', () => {
            this.fovVal.textContent = this.fovSlider.value;
            if (game.camera) { game.camera.fov = +this.fovSlider.value; game.camera.updateProjectionMatrix(); }
        });

        this.el.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => this.hide()));
    }
    show() { this.el.classList.remove('hidden'); }
    hide() { this.el.classList.add('hidden'); }
}

export class CreditsModal {
    constructor() {
        this.el = document.getElementById('credits-modal');
        this.el.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => this.hide()));
    }
    show() { this.el.classList.remove('hidden'); }
    hide() { this.el.classList.add('hidden'); }
}
