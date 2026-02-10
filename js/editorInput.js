class EditorInputHandler {
    constructor(canvas, renderer, grid, editorUI, onEdit, onGridReplace) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.grid = grid;
        this.editorUI = editorUI;
        this.onEdit = onEdit;
        this.onGridReplace = onGridReplace;
        this.onPreviewUpdate = null;

        this.isEnabled = false;
        this.history = [];
        this.redoHistory = [];

        this.handleStartBound = (event) => this.handleStart(event.clientX, event.clientY);
        this.canvas.addEventListener('mousedown', this.handleStartBound);
        this.canvas.addEventListener('touchstart', (event) => {
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            this.handleStart(touch.clientX, touch.clientY);
            event.preventDefault();
        }, { passive: false });
        this.bindPreviewEvents();
    }

    bindPreviewEvents() {
        this.canvas.addEventListener('mousemove', (event) => {
            if (!this.isEnabled) return;
            const tool = this.editorUI.activeTool;

            if (tool === 'number') {
                const cell = this.renderer.getCellFromPoint(event.clientX, event.clientY);
                if (cell && cell.number === null) {
                    this.editorUI.setPreview('number', this.editorUI.nextNumber, cell, null);
                } else {
                    this.editorUI.clearPreview();
                }
            } else if (tool === 'wall') {
                const edge = this.renderer.getEdgeFromPoint(event.clientX, event.clientY);
                if (edge && !this.grid.hasWall(edge.row, edge.col, edge.neighborRow, edge.neighborCol)) {
                    this.editorUI.setPreview('wall', null, null, edge);
                } else {
                    this.editorUI.clearPreview();
                }
            } else {
                this.editorUI.clearPreview();
            }

            if (this.onPreviewUpdate) {
                this.onPreviewUpdate();
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.editorUI.clearPreview();
            if (this.onPreviewUpdate) {
                this.onPreviewUpdate();
            }
        });
    }

    enable() {
        this.isEnabled = true;
        this.canvas.style.pointerEvents = 'auto';
    }

    disable() {
        this.isEnabled = false;
        this.canvas.style.pointerEvents = 'none';
    }

    updateGrid(grid, renderer) {
        this.grid = grid;
        this.renderer = renderer;
    }

    handleStart(x, y) {
        if (!this.isEnabled) return;

        const tool = this.editorUI.activeTool;
        if (tool === 'wall') {
            this.saveState();
            this.toggleWall(x, y);
            return;
        }

        const cell = this.renderer.getCellFromPoint(x, y);
        if (!cell) return;

        if (tool === 'number') {
            this.saveState();
            this.placeNumber(cell);
        } else if (tool === 'erase') {
            this.saveState();
            this.eraseAt(cell, x, y);
        }
    }

    toggleWall(x, y) {
        const edge = this.renderer.getEdgeFromPoint(x, y);
        if (!edge) return;

        const { row, col, neighborRow, neighborCol } = edge;
        if (this.grid.hasWall(row, col, neighborRow, neighborCol)) {
            this.grid.removeWall(row, col, neighborRow, neighborCol);
        } else {
            this.grid.addWall(row, col, neighborRow, neighborCol);
        }

        this.refreshNextNumber();
        this.onEdit();
    }

    placeNumber(cell) {
        if (cell.number !== null) {
            // Click a placed number to remove it (US3)
            const removedNumber = cell.number;
            this.grid.clearNumber(cell.row, cell.col);
            this.renumberAfterRemoval(removedNumber);
            this.refreshNextNumber();
            this.onEdit();
            return;
        }

        const nextNumber = this.editorUI.nextNumber;
        this.grid.setNumber(cell.row, cell.col, nextNumber);
        this.refreshNextNumber();
        this.onEdit();
    }

    eraseAt(cell, x, y) {
        const edge = this.renderer.getEdgeFromPoint(x, y);
        if (edge && this.grid.hasWall(edge.row, edge.col, edge.neighborRow, edge.neighborCol)) {
            this.grid.removeWall(edge.row, edge.col, edge.neighborRow, edge.neighborCol);
            this.refreshNextNumber();
            this.onEdit();
            return;
        }

        if (cell.number !== null) {
            const removedNumber = cell.number;
            this.grid.clearNumber(cell.row, cell.col);
            this.renumberAfterRemoval(removedNumber);
            this.refreshNextNumber();
            this.onEdit();
        }
    }

    renumberAfterRemoval(removedNumber) {
        if (!Number.isFinite(removedNumber)) {
            return;
        }

        if (this.grid.numbers.size === 0) {
            return;
        }

        const numbers = Array.from(this.grid.numbers.keys()).sort((a, b) => a - b);
        const maxNumber = numbers[numbers.length - 1];

        if (removedNumber >= maxNumber) {
            return;
        }

        const positions = [];
        for (let n = removedNumber + 1; n <= maxNumber; n++) {
            const pos = this.grid.getNumberPosition(n);
            if (!pos) {
                continue;
            }
            positions.push({ number: n, row: pos.row, col: pos.col });
        }

        positions.forEach(({ number }) => {
            this.grid.numbers.delete(number);
        });

        positions.forEach(({ number, row, col }) => {
            const cell = this.grid.getCell(row, col);
            if (cell) {
                cell.number = number - 1;
                this.grid.numbers.set(number - 1, { row, col });
            }
        });
    }

    saveState() {
        this.history.push(this.grid.clone());
        this.redoHistory = [];
    }

    undo() {
        if (this.history.length === 0) {
            return false;
        }

        this.redoHistory.push(this.grid.clone());
        const previous = this.history.pop();
        this.applyGridSnapshot(previous);
        return true;
    }

    redo() {
        if (this.redoHistory.length === 0) {
            return false;
        }

        this.history.push(this.grid.clone());
        const next = this.redoHistory.pop();
        this.applyGridSnapshot(next);
        return true;
    }

    applyGridSnapshot(grid) {
        if (typeof this.onGridReplace === 'function') {
            this.onGridReplace(grid);
        } else {
            this.updateGrid(grid, this.renderer);
        }

        this.refreshNextNumber();
        this.onEdit();
    }

    refreshNextNumber() {
        if (this.grid.numbers.size === 0) {
            this.editorUI.setNextNumber(1);
            return;
        }

        const maxNumber = Math.max(...Array.from(this.grid.numbers.keys()));
        this.editorUI.setNextNumber(maxNumber + 1);
    }
}
