class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ui = new UIController();
        this.generator = new LevelGenerator();
        this.grid = null;
        this.renderer = null;
        this.pathManager = null;
        this.inputHandler = null;
        this.solver = null;
        
        this.setupGame();
        this.setupEventListeners();
        this.newGame();
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
    }

    newGame() {
        this.difficulty = this.ui.getDifficulty();
        this.grid = this.generator.generate(this.difficulty);
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
        this.inputHandler.enable();
        this.render();
    }

    changeDifficulty() {
        this.ui.updateDifficulty(this.ui.getDifficulty());
        this.ui.updateLevel(1);
        this.newGame();
    }

    nextLevel() {
        this.ui.updateLevel(this.ui.levelNumber + 1);
        this.ui.hideVictory();
        this.newGame();
    }

    clearPath() {
        this.pathManager.clearPath();
        this.ui.setUndoEnabled(false);
        this.render();
    }

    undo() {
        if (this.pathManager.undo()) {
            this.render();
            this.ui.setUndoEnabled(this.pathManager.history.length > 0);
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
        this.ui.showVictory();
    }

    render() {
        this.renderer.draw(this.pathManager.getPath());
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
