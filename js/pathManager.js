class PathManager {
    constructor(grid) {
        this.grid = grid;
        this.path = [];
        this.history = [];
        this.nextRequiredNumber = this.getMinNumber() ?? 1;
    }

    reset() {
        this.path = [];
        this.history = [];
        this.nextRequiredNumber = this.getMinNumber() ?? 1;
        this.grid.reset();
    }

    canAddCell(cell) {
        if (!cell) return false;
        if (cell.visited) return false;

        if (this.path.length === 0) {
            // Enforce that the path must start at the cell numbered 1
            const startPos = this.grid.getNumberPosition(1);
            if (!startPos) {
                // No explicit '1' placed -> disallow starting
                return false;
            }

            return cell.row === startPos.row && cell.col === startPos.col;
        }

        const lastCell = this.path[this.path.length - 1];
        
        if (!this.grid.areAdjacent(lastCell.row, lastCell.col, cell.row, cell.col)) {
            return false;
        }

        if (this.grid.hasWall(lastCell.row, lastCell.col, cell.row, cell.col)) {
            return false;
        }

        if (cell.number !== null) {
            if (cell.number !== this.nextRequiredNumber) {
                return false;
            }
        } else {
            const nextNumberPos = this.grid.getNumberPosition(this.nextRequiredNumber);
            if (nextNumberPos) {
                const distance = this.calculateDistance(cell, nextNumberPos);
                const remainingCells = this.grid.getTotalCells() - this.path.length - 1;
                
                if (distance > remainingCells) {
                    return false;
                }
            }
        }

        return true;
    }

    addCell(cell) {
        if (!this.canAddCell(cell)) {
            return false;
        }

        this.saveState();
        
        this.path.push(cell);
        cell.visited = true;

        if (cell.number === this.nextRequiredNumber) {
            this.nextRequiredNumber++;
        }

        return true;
    }

    saveState() {
        this.history.push({
            path: [...this.path],
            nextRequiredNumber: this.nextRequiredNumber,
            visitedStates: this.grid.cells.map(row => 
                row.map(cell => cell.visited)
            )
        });
    }

    undo() {
        if (this.history.length === 0) {
            return false;
        }

        const state = this.history.pop();
        this.path = state.path;
        this.nextRequiredNumber = state.nextRequiredNumber;

        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                this.grid.cells[row][col].visited = state.visitedStates[row][col];
            }
        }

        return true;
    }

    getPath() {
        return this.path;
    }

    isComplete() {
        if (this.path.length !== this.grid.getTotalCells()) {
            return false;
        }

        const maxNumber = Math.max(...Array.from(this.grid.numbers.keys()));
        if (this.nextRequiredNumber !== maxNumber + 1) {
            return false;
        }

        const lastCell = this.path[this.path.length - 1];
        if (lastCell.number !== maxNumber) {
            return false;
        }

        return true;
    }

    calculateDistance(cell, targetPos) {
        return Math.abs(cell.row - targetPos.row) + Math.abs(cell.col - targetPos.col);
    }

    getLastCell() {
        return this.path.length > 0 ? this.path[this.path.length - 1] : null;
    }

    clearPath() {
        this.history = [];
        this.reset();
    }

    backtrackTo(index) {
        if (index < 0 || index >= this.path.length) {
            return false;
        }

        this.saveState();

        const removedCells = this.path.slice(index + 1);
        this.path = this.path.slice(0, index + 1);

        for (const cell of removedCells) {
            cell.visited = false;
        }

        this.recalculateNextRequiredNumber();
        return true;
    }

    recalculateNextRequiredNumber() {
        const numbersVisited = new Set();
        for (const cell of this.path) {
            if (cell.number !== null) {
                numbersVisited.add(cell.number);
            }
        }

        this.nextRequiredNumber = this.getMinNumber() ?? 1;
        while (numbersVisited.has(this.nextRequiredNumber)) {
            this.nextRequiredNumber++;
        }
    }

    getMinNumber() {
        if (this.grid.numbers.size > 0) {
            return Math.min(...Array.from(this.grid.numbers.keys()));
        }

        let minNumber = null;
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const cell = this.grid.cells[row][col];
                if (cell.number !== null) {
                    minNumber = minNumber === null ? cell.number : Math.min(minNumber, cell.number);
                }
            }
        }

        return minNumber;
    }
}
