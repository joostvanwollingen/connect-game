class InputHandler {
    constructor(canvas, renderer, pathManager, onPathUpdate) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.pathManager = pathManager;
        this.onPathUpdate = onPathUpdate;
        this.isDrawing = false;
        this.lastCell = null;
        
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
        const cell = this.renderer.getCellFromPoint(x, y);
        if (!cell) return;

        if (this.pathManager.path.length === 0) {
            this.isDrawing = true;
            this.pathManager.addCell(cell);
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
        this.isDrawing = false;
        this.lastCell = null;
    }

    enable() {
        this.canvas.style.pointerEvents = 'auto';
    }

    disable() {
        this.canvas.style.pointerEvents = 'none';
    }
}
