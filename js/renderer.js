class Renderer {
    constructor(canvas, grid) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
        this.cellSize = 0;
        this.padding = 40;
        this.hintCell = null;
        this.hintAnimationStart = 0;
        this.calculateDimensions();
    }

    calculateDimensions() {
        const maxCanvasSize = Math.min(500, window.innerWidth - 100);
        const gridSize = Math.max(this.grid.rows, this.grid.cols);
        this.cellSize = Math.floor((maxCanvasSize - this.padding * 2) / gridSize);
        
        this.canvas.width = this.cellSize * this.grid.cols + this.padding * 2;
        this.canvas.height = this.cellSize * this.grid.rows + this.padding * 2;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(path = []) {
        this.clear();
        this.drawGrid();
        this.drawWalls();
        this.drawNumbers();
        this.drawPath(path);
        this.drawHint();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;

        for (let row = 0; row <= this.grid.rows; row++) {
            const y = this.padding + row * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, y);
            this.ctx.lineTo(this.padding + this.grid.cols * this.cellSize, y);
            this.ctx.stroke();
        }

        for (let col = 0; col <= this.grid.cols; col++) {
            const x = this.padding + col * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.padding);
            this.ctx.lineTo(x, this.padding + this.grid.rows * this.cellSize);
            this.ctx.stroke();
        }
    }

    drawWalls() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';

        for (const wall of this.grid.walls) {
            const [start, end] = wall.split('-');
            const [row1, col1] = start.split(',').map(Number);
            const [row2, col2] = end.split(',').map(Number);

            if (row1 === row2) {
                const x = this.padding + Math.max(col1, col2) * this.cellSize;
                const y1 = this.padding + row1 * this.cellSize;
                const y2 = y1 + this.cellSize;
                
                this.ctx.beginPath();
                this.ctx.moveTo(x, y1);
                this.ctx.lineTo(x, y2);
                this.ctx.stroke();
            } else {
                const y = this.padding + Math.max(row1, row2) * this.cellSize;
                const x1 = this.padding + col1 * this.cellSize;
                const x2 = x1 + this.cellSize;
                
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y);
                this.ctx.lineTo(x2, y);
                this.ctx.stroke();
            }
        }
    }

    drawNumbers() {
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.font = `bold ${this.cellSize * 0.5}px Arial`;

        for (const [number, pos] of this.grid.numbers) {
            const x = this.padding + pos.col * this.cellSize + this.cellSize / 2;
            const y = this.padding + pos.row * this.cellSize + this.cellSize / 2;

            this.ctx.fillStyle = '#e3f2fd';
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.cellSize * 0.4, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.fillStyle = '#667eea';
            this.ctx.fillText(number.toString(), x, y);
        }
    }

    drawPath(path) {
        if (path.length < 2) return;

        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = this.cellSize * 0.15;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        const firstCell = path[0];
        const startX = this.padding + firstCell.col * this.cellSize + this.cellSize / 2;
        const startY = this.padding + firstCell.row * this.cellSize + this.cellSize / 2;
        this.ctx.moveTo(startX, startY);

        for (let i = 1; i < path.length; i++) {
            const cell = path[i];
            const x = this.padding + cell.col * this.cellSize + this.cellSize / 2;
            const y = this.padding + cell.row * this.cellSize + this.cellSize / 2;
            this.ctx.lineTo(x, y);
        }

        this.ctx.stroke();

        for (const cell of path) {
            const x = this.padding + cell.col * this.cellSize + this.cellSize / 2;
            const y = this.padding + cell.row * this.cellSize + this.cellSize / 2;
            
            this.ctx.fillStyle = '#667eea';
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.cellSize * 0.08, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawHint() {
        if (!this.hintCell) return;

        const elapsed = Date.now() - this.hintAnimationStart;
        if (elapsed > 3000) {
            this.hintCell = null;
            return;
        }

        const pulse = Math.sin(elapsed / 150) * 0.5 + 0.5;
        const alpha = Math.max(0, 1 - elapsed / 3000);

        const x = this.padding + this.hintCell.col * this.cellSize;
        const y = this.padding + this.hintCell.row * this.cellSize;

        this.ctx.fillStyle = `rgba(255, 193, 7, ${alpha * pulse * 0.6})`;
        this.ctx.fillRect(x, y, this.cellSize, this.cellSize);

        this.ctx.strokeStyle = `rgba(255, 193, 7, ${alpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
    }

    showHint(cell) {
        this.hintCell = cell;
        this.hintAnimationStart = Date.now();
    }

    getCellFromPoint(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;

        const col = Math.floor((canvasX - this.padding) / this.cellSize);
        const row = Math.floor((canvasY - this.padding) / this.cellSize);

        return this.grid.getCell(row, col);
    }
}
