class EditorUI {
    constructor() {
        this.activeTool = 'number';
        this.nextNumber = 1;

        this.elements = {
            panel: document.getElementById('editorPanel'),
            createBtn: document.getElementById('createLevelBtn'),
            gridSizeSelect: document.getElementById('gridSizeSelect'),
            applyGridSizeBtn: document.getElementById('applyGridSizeBtn'),
            toolNumberBtn: document.getElementById('toolNumberBtn'),
            toolWallBtn: document.getElementById('toolWallBtn'),
            toolEraserBtn: document.getElementById('toolEraserBtn'),
            nextNumberDisplay: document.getElementById('nextNumberDisplay'),
            testLevelBtn: document.getElementById('testLevelBtn'),
            shareLevelBtn: document.getElementById('shareLevelBtn'),
            exitEditorBtn: document.getElementById('exitEditorBtn')
        };

        this.bindToolButtons();
    }

    bindToolButtons() {
        this.elements.toolNumberBtn.addEventListener('click', () => this.setActiveTool('number'));
        this.elements.toolWallBtn.addEventListener('click', () => this.setActiveTool('wall'));
        this.elements.toolEraserBtn.addEventListener('click', () => this.setActiveTool('erase'));
    }

    show() {
        this.elements.panel.classList.remove('hidden');
    }

    hide() {
        this.elements.panel.classList.add('hidden');
    }

    setActiveTool(tool) {
        this.activeTool = tool;
        this.elements.toolNumberBtn.classList.toggle('active', tool === 'number');
        this.elements.toolWallBtn.classList.toggle('active', tool === 'wall');
        this.elements.toolEraserBtn.classList.toggle('active', tool === 'erase');
    }

    setNextNumber(value) {
        this.nextNumber = value;
        this.elements.nextNumberDisplay.textContent = value;
    }

    setTestMode(isTestMode) {
        if (!this.elements.testLevelBtn) {
            return;
        }

        this.elements.testLevelBtn.textContent = isTestMode ? 'Back to Edit' : 'Test';
        this.elements.toolNumberBtn.disabled = isTestMode;
        this.elements.toolWallBtn.disabled = isTestMode;
        this.elements.toolEraserBtn.disabled = isTestMode;
        this.elements.applyGridSizeBtn.disabled = isTestMode;
        this.elements.shareLevelBtn.disabled = false;
    }

    getGridSize() {
        const size = Number(this.elements.gridSizeSelect.value);
        return { rows: size, cols: size };
    }
}
