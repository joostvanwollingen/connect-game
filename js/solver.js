class Solver {
    constructor(grid) {
        this.grid = grid;
    }

    findNextMove(currentPath) {
        if (currentPath.length === 0) {
            const firstNumberPos = this.grid.getNumberPosition(1);
            if (firstNumberPos) {
                return this.grid.getCell(firstNumberPos.row, firstNumberPos.col);
            }
            return this.grid.getCell(0, 0);
        }

        const lastCell = currentPath[currentPath.length - 1];
        const neighbors = this.grid.getNeighbors(lastCell.row, lastCell.col);
        
        const validNeighbors = neighbors.filter(cell => !cell.visited);

        if (validNeighbors.length === 0) {
            return null;
        }

        let bestCell = validNeighbors[0];
        let bestScore = -Infinity;

        for (const cell of validNeighbors) {
            const score = this.scoreMove(cell, currentPath);
            if (score > bestScore) {
                bestScore = score;
                bestCell = cell;
            }
        }

        return bestCell;
    }

    scoreMove(cell, currentPath) {
        let score = 0;

        const pathManager = new PathManager(this.grid);
        pathManager.path = [...currentPath];
        
        const nextRequiredNumber = this.getNextRequiredNumber(currentPath);
        
        if (cell.number === nextRequiredNumber) {
            score += 1000;
        }

        if (cell.number !== null && cell.number !== nextRequiredNumber) {
            score -= 10000;
        }

        const neighbors = this.grid.getNeighbors(cell.row, cell.col);
        const unvisitedNeighbors = neighbors.filter(n => !n.visited).length;
        score += unvisitedNeighbors * 10;

        if (nextRequiredNumber) {
            const nextPos = this.grid.getNumberPosition(nextRequiredNumber);
            if (nextPos) {
                const distance = Math.abs(cell.row - nextPos.row) + Math.abs(cell.col - nextPos.col);
                score -= distance;
            }
        }

        return score;
    }

    getNextRequiredNumber(path) {
        const numbersVisited = new Set();
        for (const cell of path) {
            if (cell.number !== null) {
                numbersVisited.add(cell.number);
            }
        }

        let next = 1;
        while (numbersVisited.has(next)) {
            next++;
        }

        if (this.grid.numbers.has(next)) {
            return next;
        }

        return null;
    }
}
