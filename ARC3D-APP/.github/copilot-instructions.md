# ARCHKNIGHT™ 3D - AI Coding Instructions

## Architecture Overview

This is an **Electron desktop application** for professional architectural CAD/3D modeling, powered by BabylonJS.

**Process Architecture:**
- `main.js` - Electron main process (window management, native menus, file I/O, IPC handlers)
- `preload.js` - Secure bridge exposing `window.electronAPI` to renderer (context isolation enabled)
- `app/Archknight-3d.html` - Single-file renderer containing all UI, CSS, and JavaScript (~82k lines)

**Key Design Decisions:**
- All frontend code lives in one HTML file - inline styles and scripts for distribution simplicity
- Context isolation is enabled; renderer communicates with main via `ipcRenderer`/`ipcMain` channels
- Window state (position/size) persists to `userData/window-state.json`

## IPC Communication Pattern

Menu actions and file operations use a consistent channel-based pattern:

```javascript
// main.js - Send to renderer
sendToRenderer('menu-save-project', { filePath });

// preload.js - Expose listener
onMenuSaveProject: (callback) => ipcRenderer.on('menu-save-project', callback)

// Renderer - Listen via electronAPI
window.electronAPI.onMenuSaveProject((event, data) => { ... });
```

When adding new menu items or IPC channels, update all three files in sync.

## Development Workflow

```bash
npm install          # Install dependencies
npm run dev          # Development mode (DevTools auto-open)
npm start            # Production mode locally
npm run build:win    # Build Windows installer → dist/
```

Development mode is triggered by `--dev` flag, enabling DevTools and console logging.

## Key Classes in Renderer

Located in `app/Archknight-3d.html`:
- `SceneManager` - BabylonJS scene, cameras, lighting, grid system
- `CADModeler` - Core modeling operations
- `buildingTools` - Wall, door, window, stairs creation tools
- `settingsManager` - User preferences and default dimensions

## Project File Format

Projects save as `.ark` or `.json` files via native dialogs. File operations route through:
- Main process: `handleOpenProject()`, `handleSaveProjectAs()` 
- IPC handlers: `save-file`, `read-file`

## Build Configuration

- `electron-builder` config in `package.json` under `"build"`
- Icons: `build/icon.{ico,icns,png}` - must be 256x256+ for Windows, 512x512 for macOS
- Cross-platform builds require running on respective OS (or use CI)
- Output goes to `dist/` folder

## Code Conventions

- Use `APP_CONFIG` object in main.js for window defaults and app settings
- All keyboard shortcuts defined in menu template (main.js) and duplicated in keyHandlers (HTML)
- CSS uses custom properties with dark theme default; `body.light-mode` for light theme
- BabylonJS meshes follow naming: `'Grid'`, `'skybox'`, etc.

## Security Notes

- `nodeIntegration: false`, `contextIsolation: true` - maintain these settings
- External links open in system browser via `shell.openExternal()`
- Renderer content protection: disabled right-click, print, selection (for IP protection)
