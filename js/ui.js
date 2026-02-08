class UIController {
    constructor() {
        this.levelNumber = 1;
        this.moveCount = 0;
        this.startTime = Date.now();
        this.difficulty = 'easy';
        
        this.elements = {
            levelNumber: document.getElementById('levelNumber'),
            difficultyLevel: document.getElementById('difficultyLevel'),
            newGameBtn: document.getElementById('newGameBtn'),
            clearPathBtn: document.getElementById('clearPathBtn'),
            undoBtn: document.getElementById('undoBtn'),
            hintBtn: document.getElementById('hintBtn'),
            difficultySelect: document.getElementById('difficultySelect'),
            victoryModal: document.getElementById('victoryModal'),
            nextLevelBtn: document.getElementById('nextLevelBtn'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            completionTime: document.getElementById('completionTime'),
            moveCountDisplay: document.getElementById('moveCount')
        };
    }

    updateLevel(level) {
        this.levelNumber = level;
        this.elements.levelNumber.textContent = level;
    }

    updateDifficulty(difficulty) {
        this.difficulty = difficulty;
        const displayNames = {
            easy: 'Easy',
            medium: 'Medium',
            hard: 'Hard',
            expert: 'Expert'
        };
        this.elements.difficultyLevel.textContent = displayNames[difficulty] || 'Easy';
    }

    incrementMoveCount() {
        this.moveCount++;
    }

    resetMoveCount() {
        this.moveCount = 0;
        this.startTime = Date.now();
    }

    showVictory() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        this.elements.completionTime.textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.elements.moveCountDisplay.textContent = this.moveCount;
        
        this.elements.victoryModal.classList.remove('hidden');
    }

    hideVictory() {
        this.elements.victoryModal.classList.add('hidden');
    }

    setUndoEnabled(enabled) {
        this.elements.undoBtn.disabled = !enabled;
    }

    getDifficulty() {
        return this.elements.difficultySelect.value;
    }
}
