/**
 * Serializer module for Grid serialization/deserialization
 * Handles encoding/decoding grids to/from base64 strings for URL sharing
 */

const Serializer = {
    /**
     * Serialize a Grid instance to a base64 string
     * @param {Grid} grid - The grid to serialize
     * @returns {string} Base64 encoded grid data
     */
    serializeGrid(grid) {
        // Convert walls Set to array of strings
        const wallsArray = Array.from(grid.walls);

        // Convert numbers Map to object with string keys
        const numbersObj = {};
        for (const [number, position] of grid.numbers) {
            numbersObj[number.toString()] = [position.row, position.col];
        }

        // Create JSON object
        const data = {
            rows: grid.rows,
            cols: grid.cols,
            numbers: numbersObj,
            walls: wallsArray
        };

        // Convert to JSON string and encode to base64
        try {
            const jsonString = JSON.stringify(data);
            const base64String = btoa(jsonString);
            return base64String;
        } catch (error) {
            console.error('Error serializing grid:', error);
            throw new Error('Failed to serialize grid');
        }
    },

    /**
     * Deserialize a base64 string to a Grid instance
     * @param {string} base64String - The base64 encoded grid data
     * @returns {Grid} Reconstructed Grid instance
     */
    deserializeGrid(base64String) {
        try {
            // Decode base64 and parse JSON
            const jsonString = atob(base64String);
            const data = JSON.parse(jsonString);

            // Validate structure
            if (!data.rows || !data.cols || !data.numbers || !data.walls) {
                throw new Error('Invalid grid data structure');
            }

            // Create new Grid instance
            const grid = new Grid(data.rows, data.cols);

            // Restore walls
            if (Array.isArray(data.walls)) {
                for (const wallKey of data.walls) {
                    // Parse wall key format: "row1,col1-row2,col2"
                    const [start, end] = wallKey.split('-');
                    const [row1, col1] = start.split(',').map(Number);
                    const [row2, col2] = end.split(',').map(Number);
                    grid.addWall(row1, col1, row2, col2);
                }
            }

            // Restore numbers
            if (typeof data.numbers === 'object' && data.numbers !== null) {
                for (const [numberStr, position] of Object.entries(data.numbers)) {
                    const number = Number(numberStr);
                    const [row, col] = position;
                    grid.setNumber(row, col, number);
                }
            }

            return grid;
        } catch (error) {
            console.error('Error deserializing grid:', error);
            throw new Error('Failed to deserialize grid: ' + error.message);
        }
    }
    ,
    /**
     * Read the level hash parameter from the URL (e.g., #level=BASE64)
     * @returns {string|null}
     */
    getLevelFromHash() {
        const hash = window.location.hash.replace(/^#/, '');
        if (!hash) {
            return null;
        }

        const params = new URLSearchParams(hash);
        let level = params.get('level');
        if (!level) {
            return null;
        }

        level = level.replace(/\s/g, '+');
        try {
            level = decodeURIComponent(level);
        } catch (error) {
            // Keep original if decoding fails
        }

        return level || null;
    },

    /**
     * Update the URL hash with the provided base64 level data
     * @param {string} base64String
     */
    updateLevelHash(base64String) {
        const params = new URLSearchParams();
        params.set('level', encodeURIComponent(base64String));
        window.location.hash = params.toString();
    },

    /**
     * Clear the level hash from the URL
     */
    clearLevelHash() {
        window.location.hash = '';
    }
};
