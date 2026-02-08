class InputHandler {
    constructor(canvas, renderer, pathManager, onPathUpdate) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.pathManager = pathManager;
        this.onPathUpdate = onPathUpdate;
        this.isDrawing = false;
        this.lastCell = null;
        this.isEnabled = true;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', () => this.handleEnd());
        this.canvas.addEventListener('mouseleave', () => this.handleEnd());

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleStart(touch.clientX, touch.clientY);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMove(touch.clientX, touch.clientY);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        });
    }

    handleStart(x, y) {
        if (!this.isEnabled) return;
        const cell = this.renderer.getCellFromPoint(x, y);
        if (!cell) return;

        if (this.pathManager.path.length === 0) {
            const { minNumber, minPosition } = this.getMinNumberFromGrid();
            if (minNumber === null) {
                return;
            }

            if (minPosition) {
                if (cell.row !== minPosition.row || cell.col !== minPosition.col) {
                    return;
                }
            } else if (cell.number !== minNumber) {
                return;
            }

            if (!this.pathManager.addCell(cell)) {
                return;
            }

            this.isDrawing = true;
            this.lastCell = cell;
            this.onPathUpdate();
        } else {
            const lastCell = this.pathManager.getLastCell();
            if (cell === lastCell) {
                this.isDrawing = true;
                this.lastCell = cell;
            } else {
                const cellIndex = this.pathManager.path.indexOf(cell);
                if (cellIndex !== -1) {
                    this.isDrawing = true;
                    this.pathManager.backtrackTo(cellIndex);
                    this.lastCell = cell;
                    this.onPathUpdate();
                }
            }
        }
    }

    handleMove(x, y) {
        if (!this.isEnabled) return;
        if (!this.isDrawing) return;

        const cell = this.renderer.getCellFromPoint(x, y);
        
        if (cell && cell !== this.lastCell) {
            const cellIndex = this.pathManager.path.indexOf(cell);
            
            if (cellIndex !== -1) {
                this.pathManager.backtrackTo(cellIndex);
                this.lastCell = cell;
                this.onPathUpdate();
            } else if (this.pathManager.addCell(cell)) {
                this.lastCell = cell;
                this.onPathUpdate();
            }
        }
    }

    handleEnd() {
        if (!this.isEnabled) return;
        this.isDrawing = false;
        this.lastCell = null;
    }

    getMinNumberFromGrid() {
        const grid = this.renderer.grid;
        if (grid.numbers.size > 0) {
            const minNumber = Math.min(...Array.from(grid.numbers.keys()));
            const minPosition = grid.getNumberPosition(minNumber);
            return { minNumber, minPosition };
        }

        let minNumber = null;
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const cell = grid.cells[row][col];
                if (Number.isFinite(cell.number)) {
                    minNumber = minNumber === null ? cell.number : Math.min(minNumber, cell.number);
                }
            }
        }

        return { minNumber, minPosition: null };
    }

    enable() {
        this.isEnabled = true;
        this.canvas.style.pointerEvents = 'auto';
    }

    disable() {
        this.isEnabled = false;
        this.isDrawing = false;
        this.lastCell = null;
        this.canvas.style.pointerEvents = 'none';
    }
}
