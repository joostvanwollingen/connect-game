class Grid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.cells = [];
        this.walls = new Set();
        this.numbers = new Map();
        this.initializeCells();
    }

    initializeCells() {
        this.cells = [];
        for (let row = 0; row < this.rows; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.cells[row][col] = {
                    row,
                    col,
                    visited: false,
                    number: null
                };
            }
        }
    }

    getCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return null;
        }
        return this.cells[row][col];
    }

    setNumber(row, col, number) {
        const cell = this.getCell(row, col);
        if (cell) {
            cell.number = number;
            this.numbers.set(number, { row, col });
        }
    }

    getNumberPosition(number) {
        return this.numbers.get(number);
    }

    addWall(row1, col1, row2, col2) {
        const wall = this.createWallKey(row1, col1, row2, col2);
        this.walls.add(wall);
    }

    hasWall(row1, col1, row2, col2) {
        const wall = this.createWallKey(row1, col1, row2, col2);
        return this.walls.has(wall);
    }

    createWallKey(row1, col1, row2, col2) {
        const minRow = Math.min(row1, row2);
        const minCol = Math.min(col1, col2);
        const maxRow = Math.max(row1, row2);
        const maxCol = Math.max(col1, col2);
        return `${minRow},${minCol}-${maxRow},${maxCol}`;
    }

    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            const cell = this.getCell(newRow, newCol);
            
            if (cell && !this.hasWall(row, col, newRow, newCol)) {
                neighbors.push(cell);
            }
        }

        return neighbors;
    }

    reset() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.cells[row][col].visited = false;
            }
        }
    }

    getTotalCells() {
        return this.rows * this.cols;
    }
}
