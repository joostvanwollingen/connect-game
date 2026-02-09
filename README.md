# Connect — Logic Puzzle Game

Connect the numbers in order, fill every cell, and finish with the highest number.

Play at [https://github.com/joostvanwollingen/connect-game](https://github.com/joostvanwollingen/connect-game).

## Features

- Procedural levels with increasing difficulty (5×5 → 8×8)
- Path rules enforced: start at **1**, visit numbers in order, end at highest number
- Walls and number placement in a built-in level editor
- Test mode with solvability check
- Share custom levels via URL hash
- Loading modal for smooth level generation

## Run Locally

Just open `index.html` in a browser:

```bash
open index.html
```

No build step or dependencies required.

## How to Play

1. Start at **1**.
2. Draw a single continuous path through every cell.
3. Visit numbers in order (1 → 2 → 3...).
4. End on the highest number.

## Editor Mode

Click **Create** to build your own level. **Share** the level with your friends.

**Tools**

- **Number**: places sequential numbers (unlimited)
- **Wall**: click near any cell edge to toggle walls
- **Eraser**: remove numbers or walls

**Actions**

- **Test**: play your custom level and check solvability
- **Share**: copies a URL with your level encoded
- **Back to Play**: exits editor

### Keyboard Shortcuts (Editor)

- `N` — Number tool
- `W` — Wall tool
- `E` — Eraser tool
- `T` — Test/Back to Edit
- `Ctrl/Cmd + Z` — Undo
- `Ctrl/Cmd + Y` or `Ctrl/Cmd + Shift + Z` — Redo

## Sharing Custom Levels

When you click **Share**, the game generates a URL like:

```text
https://joostvanwollingen.github.io/connect-game/#level=<base64>
```

Opening that link loads the custom level automatically.

## Troubleshooting

- If a custom level won’t load, ensure it includes a **1** and has sequential numbers (1..N).

---

Built with vanilla HTML/CSS/JS. No frameworks, no nonsense.
