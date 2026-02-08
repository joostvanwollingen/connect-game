class LevelGenerator {
    constructor() {
        this.solution = [];
    }

    generate(difficulty = 'easy') {
        const config = this.getDifficultyConfig(difficulty);
        const grid = new Grid(config.rows, config.cols);

        if (!this.generateHamiltonianPath(grid)) {
            this.generateSnakePath(grid);
        }

        this.placeNumbers(grid, config.numberCount);
        this.placeWalls(grid, config.wallCount);

        return grid;
    }

    getDifficultyConfig(difficulty) {
        const configs = {
            easy: { rows: 5, cols: 5, numberCount: 3, wallCount: 0 },
            medium: { rows: 6, cols: 6, numberCount: 4, wallCount: 3 },
            hard: { rows: 7, cols: 7, numberCount: 5, wallCount: 6 },
            expert: { rows: 8, cols: 8, numberCount: 6, wallCount: 10 }
        };
        return configs[difficulty] || configs.easy;
    }

    generateSnakePath(grid) {
        this.solution = [];
        let direction = 1;
        
        for (let row = 0; row < grid.rows; row++) {
            if (direction === 1) {
                for (let col = 0; col < grid.cols; col++) {
                    this.solution.push({ row, col });
                }
            } else {
                for (let col = grid.cols - 1; col >= 0; col--) {
                    this.solution.push({ row, col });
                }
            }
            direction *= -1;
        }
    }

    generateHamiltonianPath(grid) {
        this.solution = [];
        const visited = Array(grid.rows).fill(null).map(() => Array(grid.cols).fill(false));
        
        const startRow = Math.floor(Math.random() * grid.rows);
        const startCol = Math.floor(Math.random() * grid.cols);

        this.startTime = Date.now();
        this.maxTime = 1000; // 1 second timeout

        return this.backtrack(grid, startRow, startCol, visited, []);
    }

    backtrack(grid, row, col, visited, path) {
        // Timeout check
        if (Date.now() - this.startTime > this.maxTime) {
            return false;
        }

        if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) {
            return false;
        }

        if (visited[row][col]) {
            return false;
        }

        path.push({ row, col });
        visited[row][col] = true;

        if (path.length === grid.getTotalCells()) {
            this.solution = [...path];
            return true;
        }

        const directions = this.shuffleArray([
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);

        for (const [dr, dc] of directions) {
            if (this.backtrack(grid, row + dr, col + dc, visited, path)) {
                return true;
            }
        }

        path.pop();
        visited[row][col] = false;
        return false;
    }

    placeNumbers(grid, count) {
        const spacing = Math.floor(this.solution.length / (count + 1));
        
        for (let i = 1; i <= count; i++) {
            const index = i * spacing;
            if (index < this.solution.length) {
                const pos = this.solution[index];
                grid.setNumber(pos.row, pos.col, i);
            }
        }
    }

    placeWalls(grid, wallCount) {
        let placed = 0;
        const maxAttempts = wallCount * 10;
        let attempts = 0;

        const solutionSet = new Set(
            this.solution.map(cell => `${cell.row},${cell.col}`)
        );

        const solutionEdges = new Set();
        for (let i = 0; i < this.solution.length - 1; i++) {
            const c1 = this.solution[i];
            const c2 = this.solution[i + 1];
            const edge = this.createEdgeKey(c1.row, c1.col, c2.row, c2.col);
            solutionEdges.add(edge);
        }

        while (placed < wallCount && attempts < maxAttempts) {
            const row1 = Math.floor(Math.random() * grid.rows);
            const col1 = Math.floor(Math.random() * grid.cols);
            
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            const [dr, dc] = directions[Math.floor(Math.random() * directions.length)];
            const row2 = row1 + dr;
            const col2 = col1 + dc;

            if (!grid.getCell(row2, col2)) {
                attempts++;
                continue;
            }

            const edge = this.createEdgeKey(row1, col1, row2, col2);
            if (solutionEdges.has(edge)) {
                attempts++;
                continue;
            }

            if (grid.hasWall(row1, col1, row2, col2)) {
                attempts++;
                continue;
            }

            grid.addWall(row1, col1, row2, col2);
            placed++;
            attempts++;
        }
    }

    createEdgeKey(row1, col1, row2, col2) {
        if (row1 < row2 || (row1 === row2 && col1 < col2)) {
            return `${row1},${col1}-${row2},${col2}`;
        }
        return `${row2},${col2}-${row1},${col1}`;
    }





    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getSolution() {
        return this.solution;
    }
}
