class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ui = new UIController();
        this.generator = new LevelGenerator();
        this.grid = null;
        this.renderer = null;
        this.pathManager = null;
        this.inputHandler = null;
        this.editorInputHandler = null;
        this.editorUI = new EditorUI();
        this.editorGrid = null;
        this.mode = 'play';
        this.solver = null;
        this.generationId = 0;
        this.isCustomLevel = false;
        
        this.setupGame();
        this.setupEventListeners();
        const customLevel = Serializer.getLevelFromHash();
        if (customLevel) {
            this.loadCustomLevel(customLevel);
        } else {
            this.newGame();
        }
    }

    setupGame() {
        this.difficulty = this.ui.getDifficulty();
        this.ui.updateDifficulty(this.difficulty);
    }

    setupEventListeners() {
        this.ui.elements.newGameBtn.addEventListener('click', () => this.newGame());
        this.ui.elements.clearPathBtn.addEventListener('click', () => this.clearPath());
        this.ui.elements.undoBtn.addEventListener('click', () => this.undo());
        this.ui.elements.difficultySelect.addEventListener('change', () => this.changeDifficulty());
        this.ui.elements.nextLevelBtn.addEventListener('click', () => this.nextLevel());
        this.ui.elements.closeModalBtn.addEventListener('click', () => this.ui.hideVictory());

        this.editorUI.elements.createBtn.addEventListener('click', () => this.enterEditorMode());
        this.editorUI.elements.applyGridSizeBtn.addEventListener('click', () => this.applyEditorGridSize());
        this.editorUI.elements.exitEditorBtn.addEventListener('click', () => this.handleEditorExit());
        this.editorUI.elements.testLevelBtn.addEventListener('click', () => this.toggleTestMode());
        this.editorUI.elements.shareLevelBtn.addEventListener('click', () => this.shareCustomLevel());

        document.addEventListener('keydown', (event) => this.handleEditorShortcuts(event));
    }

    newGame() {
        if (this.mode !== 'play') {
            this.exitEditorMode();
        }

        if (this.isCustomLevel) {
            this.isCustomLevel = false;
            this.ui.elements.difficultySelect.disabled = false;
        }

        this.difficulty = this.ui.getDifficulty();
        this.generationId += 1;
        const generationId = this.generationId;
        const minLoadingVisibleMs = 500;
        const loadingShownAt = Date.now();

        if (this.inputHandler) {
            this.inputHandler.disable();
        }

        this.ui.showLoading();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (generationId !== this.generationId) {
                    return;
                }

                try {
                    this.initFromGrid(this.generator.generate(this.difficulty));
                } finally {
                    const elapsed = Date.now() - loadingShownAt;
                    const remaining = Math.max(0, minLoadingVisibleMs - elapsed);
                    setTimeout(() => {
                        if (generationId !== this.generationId) {
                            return;
                        }
                        this.ui.hideLoading();
                    }, remaining);
                }
            });
        });
    }

    changeDifficulty() {
        this.ui.updateDifficulty(this.ui.getDifficulty());
        this.ui.updateLevel(1);
        this.newGame();
    }

    nextLevel() {
        if (this.mode !== 'play') {
            return;
        }
        this.ui.updateLevel(this.ui.levelNumber + 1);
        this.ui.hideVictory();
        this.newGame();
    }

    clearPath() {
        this.pathManager.clearPath();
        this.ui.setUndoEnabled(false);
        // If the player cleared the path after finishing, re-enable input so they
        // can draw again and hide the victory modal if it's visible.
        if (this.inputHandler) {
            this.inputHandler.enable();
        }

        if (this.ui && this.ui.elements && !this.ui.elements.victoryModal.classList.contains('hidden')) {
            this.ui.hideVictory();
        }

        // Reset move count since we're clearing the path
        if (this.ui && typeof this.ui.resetMoveCount === 'function') {
            this.ui.resetMoveCount();
        }

        this.render();
    }

    undo() {
        if (this.pathManager.undo()) {
            this.render();
            this.ui.setUndoEnabled(this.pathManager.history.length > 0);
            // If undo was triggered after a victory, re-enable drawing so the player
            // can continue editing the path. Also hide the victory modal if visible.
            if (this.inputHandler) {
                // If the puzzle is no longer complete, allow input again
                if (!this.pathManager.isComplete()) {
                    this.inputHandler.enable();
                }
            }
            if (!this.ui.elements.victoryModal.classList.contains('hidden')) {
                this.ui.hideVictory();
            }
        }
    }

    onPathUpdate() {
        this.ui.incrementMoveCount();
        this.ui.setUndoEnabled(this.pathManager.history.length > 0);
        this.render();

        if (this.pathManager.isComplete()) {
            setTimeout(() => this.onVictory(), 300);
        }
    }

    onVictory() {
        this.inputHandler.disable();
        if (this.mode !== 'play') {
            this.ui.elements.nextLevelBtn.classList.add('hidden');
        } else {
            this.ui.elements.nextLevelBtn.classList.remove('hidden');
        }
        this.ui.showVictory();
    }

    initFromGrid(grid, mode = 'play') {
        this.mode = mode;
        this.grid = grid;
        this.renderer = new Renderer(this.canvas, this.grid);
        this.pathManager = new PathManager(this.grid);
        this.solver = new Solver(this.grid);

        if (this.inputHandler) {
            this.inputHandler.pathManager = this.pathManager;
            this.inputHandler.renderer = this.renderer;
        } else {
            this.inputHandler = new InputHandler(
                this.canvas,
                this.renderer,
                this.pathManager,
                () => this.onPathUpdate()
            );
        }

        this.ui.resetMoveCount();
        this.ui.setUndoEnabled(false);
        if (this.editorInputHandler) {
            this.editorInputHandler.disable();
        }
        this.inputHandler.enable();
        if (this.mode === 'play') {
            this.ui.elements.nextLevelBtn.classList.remove('hidden');
        } else {
            this.ui.elements.nextLevelBtn.classList.add('hidden');
        }
        this.render();
    }

    loadCustomLevel(base64String) {
        let grid;

        try {
            grid = Serializer.deserializeGrid(base64String);
        } catch (error) {
            console.warn('Invalid custom level data:', error);
            return;
        }

        if (!this.validateCustomGrid(grid)) {
            console.warn('Custom level failed validation');
            return;
        }

        this.isCustomLevel = true;
        this.ui.elements.difficultySelect.disabled = true;
        this.ui.updateDifficulty('Custom');
        this.ui.updateLevel(1);
        this.initFromGrid(grid);
    }

    validateCustomGrid(grid) {
        if (!grid || grid.rows < 2 || grid.cols < 2) {
            return false;
        }

        if (grid.numbers.size === 0) {
            return false;
        }

        if (!grid.numbers.has(1)) {
            return false;
        }

        const numbers = Array.from(grid.numbers.keys()).sort((a, b) => a - b);
        const maxNumber = numbers[numbers.length - 1];
        for (let n = 1; n <= maxNumber; n++) {
            if (!grid.numbers.has(n)) {
                return false;
            }
        }

        return true;
    }

    render() {
        if (!this.renderer) {
            return;
        }

        if (this.mode === 'edit') {
            this.renderer.draw([]);
            return;
        }

        this.renderer.draw(this.pathManager ? this.pathManager.getPath() : []);
    }

    enterEditorMode() {
        this.mode = 'edit';
        this.editorUI.show();
        this.editorUI.setTestMode(false);
        this.ui.elements.difficultySelect.disabled = true;
        this.ui.elements.difficultySelect.parentElement.classList.add('hidden');
        this.ui.updateDifficulty('Custom');
        this.ui.updateLevel(1);
        this.updateSolvableStatus('Not checked', 'status-pending');

        if (this.isCustomLevel && this.grid) {
            this.editorGrid = this.grid.clone();
            this.editorUI.elements.gridSizeSelect.value = String(this.editorGrid.rows);
        } else {
            const { rows, cols } = this.editorUI.getGridSize();
            this.editorGrid = new Grid(rows, cols);
        }
        this.renderer = new Renderer(this.canvas, this.editorGrid);
        this.syncEditorNextNumber();

        if (!this.editorInputHandler) {
            this.editorInputHandler = new EditorInputHandler(
                this.canvas,
                this.renderer,
                this.editorGrid,
                this.editorUI,
                () => this.onEditorEdit(),
                (grid) => this.replaceEditorGrid(grid)
            );
        } else {
            this.editorInputHandler.updateGrid(this.editorGrid, this.renderer);
        }

        if (this.inputHandler) {
            this.inputHandler.disable();
        }

        this.editorInputHandler.enable();
        this.render();
    }

    applyEditorGridSize() {
        if (this.mode !== 'edit') {
            return;
        }

        if (this.hasEditorChanges()) {
            const confirmed = window.confirm('Applying a new grid size will clear the current level. Continue?');
            if (!confirmed) {
                return;
            }
        }

        const { rows, cols } = this.editorUI.getGridSize();
        this.editorGrid = new Grid(rows, cols);
        this.renderer = new Renderer(this.canvas, this.editorGrid);
        this.editorInputHandler.updateGrid(this.editorGrid, this.renderer);
        this.syncEditorNextNumber();
        this.updateSolvableStatus('Not checked', 'status-pending');
        this.render();
    }

    replaceEditorGrid(grid) {
        this.editorGrid = grid;
        this.renderer = new Renderer(this.canvas, this.editorGrid);
        this.editorInputHandler.updateGrid(this.editorGrid, this.renderer);
        this.render();
    }

    handleEditorExit() {
        if (this.mode === 'test') {
            this.exitTestMode();
            return;
        }

        if (this.hasEditorChanges()) {
            const confirmed = window.confirm('Exit editor and discard your custom level?');
            if (!confirmed) {
                return;
            }
        }

        this.exitEditorMode();
        this.newGame();
    }

    exitEditorMode() {
        this.editorUI.hide();
        if (this.editorInputHandler) {
            this.editorInputHandler.disable();
        }
        this.mode = 'play';
        this.ui.elements.difficultySelect.parentElement.classList.remove('hidden');

        if (this.isCustomLevel) {
            this.ui.elements.difficultySelect.disabled = true;
            this.ui.updateDifficulty('Custom');
        } else {
            this.ui.elements.difficultySelect.disabled = false;
            this.ui.updateDifficulty(this.ui.getDifficulty());
        }
    }

    enterTestMode() {
        if (this.mode !== 'edit') {
            return;
        }

        this.mode = 'test';
        if (this.editorInputHandler) {
            this.editorInputHandler.disable();
        }

        this.isCustomLevel = true;
        this.ui.elements.difficultySelect.disabled = true;
        this.ui.updateDifficulty('Custom');

        if (!this.validateCustomGrid(this.editorGrid)) {
            this.updateSolvableStatus('No (invalid)', 'status-bad');
            if (typeof Toast !== 'undefined') {
                Toast.show('Add sequential numbers starting at 1 to test.', 'error');
            }
            return;
        }

        this.initFromGrid(this.editorGrid.clone(), 'test');
        this.editorUI.setTestMode(true);
        this.updateSolvableStatus('Checking...', 'status-pending');
        setTimeout(() => this.checkSolvable(), 10);
    }

    exitTestMode() {
        if (!this.editorGrid) {
            return;
        }

        this.mode = 'edit';
        this.renderer = new Renderer(this.canvas, this.editorGrid);
        if (this.inputHandler) {
            this.inputHandler.disable();
        }
        if (this.editorInputHandler) {
            this.editorInputHandler.updateGrid(this.editorGrid, this.renderer);
            this.editorInputHandler.enable();
        }
        this.editorUI.setTestMode(false);
        this.syncEditorNextNumber();
        this.render();
    }

    syncEditorNextNumber() {
        if (!this.editorGrid || !this.editorUI) {
            return;
        }

        if (this.editorGrid.numbers.size === 0) {
            this.editorUI.setNextNumber(1);
            return;
        }

        const maxNumber = Math.max(...Array.from(this.editorGrid.numbers.keys()));
        this.editorUI.setNextNumber(maxNumber + 1);
    }

    toggleTestMode() {
        if (this.mode === 'test') {
            this.exitTestMode();
            return;
        }

        this.enterTestMode();
    }

    hasEditorChanges() {
        return !!(this.editorGrid && (this.editorGrid.numbers.size > 0 || this.editorGrid.walls.size > 0));
    }

    onEditorEdit() {
        this.updateSolvableStatus('Not checked', 'status-pending');
        this.render();
    }

    updateSolvableStatus(text, statusClass) {
        const statusEl = document.getElementById('solvableStatus');
        if (!statusEl) {
            return;
        }

        statusEl.textContent = text;
        statusEl.classList.remove('status-ok', 'status-bad', 'status-pending');
        if (statusClass) {
            statusEl.classList.add(statusClass);
        }
    }

    checkSolvable() {
        if (!this.editorGrid) {
            return;
        }

        try {
            const solver = new Solver(this.editorGrid);
            const isSolvable = solver.isSolvable();
            this.updateSolvableStatus(isSolvable ? 'Yes' : 'No', isSolvable ? 'status-ok' : 'status-bad');
        } catch (error) {
            console.error('Solvability check failed', error);
            this.updateSolvableStatus('No', 'status-bad');
        }
    }

    shareCustomLevel() {
        if (!this.editorGrid) {
            Toast.show('Nothing to share yet.', 'error');
            return;
        }

        const levelData = Serializer.serializeGrid(this.editorGrid);
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}#level=${levelData}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                Toast.show('Share link copied to clipboard!', 'success');
            }).catch(() => {
                Toast.show('Unable to copy link.', 'error');
            });
        } else {
            const tempInput = document.createElement('input');
            tempInput.value = shareUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            const success = document.execCommand('copy');
            document.body.removeChild(tempInput);
            Toast.show(success ? 'Share link copied to clipboard!' : 'Unable to copy link.', success ? 'success' : 'error');
        }

        Serializer.updateLevelHash(levelData);
    }

    handleEditorShortcuts(event) {
        if (this.mode !== 'edit') {
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            if (this.editorInputHandler && this.editorInputHandler.undo()) {
                this.onEditorEdit();
            }
            return;
        }

        if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
            event.preventDefault();
            if (this.editorInputHandler && this.editorInputHandler.redo()) {
                this.onEditorEdit();
            }
            return;
        }

        if (event.key.toLowerCase() === 'w') {
            this.editorUI.setActiveTool('wall');
            return;
        }

        if (event.key.toLowerCase() === 'e') {
            this.editorUI.setActiveTool('erase');
            return;
        }

        if (event.key.toLowerCase() === 't') {
            this.enterTestMode();
            return;
        }

        if (event.key.toLowerCase() === 'n') {
            this.editorUI.setActiveTool('number');
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
