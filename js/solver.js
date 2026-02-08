class Solver {
    constructor(grid) {
        this.grid = grid;
    }

    isSolvable(timeoutMs = 800) {
        const startTime = Date.now();
        const totalCells = this.grid.getTotalCells();

        if (this.grid.numbers.size === 0) {
            return false;
        }

        if (!this.grid.numbers.has(1)) {
            return false;
        }

        const numbers = Array.from(this.grid.numbers.keys()).sort((a, b) => a - b);
        const maxNumber = numbers[numbers.length - 1];
        for (let n = 1; n <= maxNumber; n++) {
            if (!this.grid.numbers.has(n)) {
                return false;
            }
        }

        const startPos = this.grid.getNumberPosition(1);
        const targetPositions = new Map();
        for (const [number, pos] of this.grid.numbers) {
            targetPositions.set(number, pos);
        }

        const visited = Array.from({ length: this.grid.rows }, () =>
            Array.from({ length: this.grid.cols }, () => false)
        );

        const dfs = (row, col, stepCount, nextRequired) => {
            if (Date.now() - startTime > timeoutMs) {
                return false;
            }

            const cell = this.grid.getCell(row, col);
            if (!cell) {
                return false;
            }

            if (cell.number !== null) {
                if (cell.number !== nextRequired) {
                    return false;
                }
                nextRequired += 1;

                if (cell.number === maxNumber && stepCount !== totalCells) {
                    return false;
                }
            }

            if (stepCount === totalCells) {
                return nextRequired === maxNumber + 1 && cell.number === maxNumber;
            }

            if (nextRequired <= maxNumber) {
                const target = targetPositions.get(nextRequired);
                const remaining = totalCells - stepCount;
                const distance = Math.abs(target.row - row) + Math.abs(target.col - col);
                if (distance > remaining) {
                    return false;
                }
            }

            const neighbors = this.grid.getNeighbors(cell.row, cell.col)
                .filter((neighbor) => !visited[neighbor.row][neighbor.col]);

            neighbors.sort((a, b) => {
                const aDegree = this.grid.getNeighbors(a.row, a.col).filter((n) => !visited[n.row][n.col]).length;
                const bDegree = this.grid.getNeighbors(b.row, b.col).filter((n) => !visited[n.row][n.col]).length;
                return aDegree - bDegree;
            });

            for (const neighbor of neighbors) {
                visited[neighbor.row][neighbor.col] = true;
                if (dfs(neighbor.row, neighbor.col, stepCount + 1, nextRequired)) {
                    return true;
                }
                visited[neighbor.row][neighbor.col] = false;
            }

            return false;
        };

        visited[startPos.row][startPos.col] = true;
        return dfs(startPos.row, startPos.col, 1, 1);
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
