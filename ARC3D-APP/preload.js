/**
 * ARCHKNIGHT™ 3D - Electron Preload Script
 * Provides secure bridge between main and renderer processes
 * Copyright © 2026 ARCHKNIGHT. All rights reserved.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Platform info
    platform: process.platform,
    isElectron: true,
    
    // Window controls (for frameless window mode)
    windowMinimize: () => ipcRenderer.send('window-minimize'),
    windowMaximize: () => ipcRenderer.send('window-maximize'),
    windowClose: () => ipcRenderer.send('window-close'),
    windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),

    // File operations
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', { filePath, content }),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    
    // Project file operations (Documents/Archknight-Projects)
    getProjectsPath: () => ipcRenderer.invoke('get-projects-path'),
    saveProjectFile: (filename, content) => ipcRenderer.invoke('save-project-file', { filename, content }),
    readProjectFile: (filename) => ipcRenderer.invoke('read-project-file', filename),
    listProjectFiles: () => ipcRenderer.invoke('list-project-files'),
    deleteProjectFile: (filename) => ipcRenderer.invoke('delete-project-file', filename),
    renameProjectFile: (oldFilename, newFilename) => ipcRenderer.invoke('rename-project-file', { oldFilename, newFilename }),
    openProjectsFolder: () => ipcRenderer.invoke('open-projects-folder'),
    changeProjectsFolder: () => ipcRenderer.invoke('change-projects-folder'),
    resetProjectsFolder: () => ipcRenderer.invoke('reset-projects-folder'),
    
    // Dialog operations
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

    // Menu event listeners
    onMenuNewProject: (callback) => ipcRenderer.on('menu-new-project', callback),
    onMenuSaveProject: (callback) => ipcRenderer.on('menu-save-project', callback),
    onMenuSaveProjectAs: (callback) => ipcRenderer.on('menu-save-project-as', callback),
    onMenuLoadProject: (callback) => ipcRenderer.on('menu-load-project', callback),
    onMenuUndo: (callback) => ipcRenderer.on('menu-undo', callback),
    onMenuRedo: (callback) => ipcRenderer.on('menu-redo', callback),
    onMenuCopy: (callback) => ipcRenderer.on('menu-copy', callback),
    onMenuPaste: (callback) => ipcRenderer.on('menu-paste', callback),
    onMenuDuplicate: (callback) => ipcRenderer.on('menu-duplicate', callback),
    onMenuDelete: (callback) => ipcRenderer.on('menu-delete', callback),
    onMenuSelectAll: (callback) => ipcRenderer.on('menu-select-all', callback),
    onMenuView2D: (callback) => ipcRenderer.on('menu-view-2d', callback),
    onMenuView3D: (callback) => ipcRenderer.on('menu-view-3d', callback),
    onMenuViewTop: (callback) => ipcRenderer.on('menu-view-top', callback),
    onMenuViewFront: (callback) => ipcRenderer.on('menu-view-front', callback),
    onMenuViewRight: (callback) => ipcRenderer.on('menu-view-right', callback),
    onMenuViewIso: (callback) => ipcRenderer.on('menu-view-iso', callback),
    onMenuZoomIn: (callback) => ipcRenderer.on('menu-zoom-in', callback),
    onMenuZoomOut: (callback) => ipcRenderer.on('menu-zoom-out', callback),
    onMenuZoomReset: (callback) => ipcRenderer.on('menu-zoom-reset', callback),
    onMenuToolWall: (callback) => ipcRenderer.on('menu-tool-wall', callback),
    onMenuToolDoor: (callback) => ipcRenderer.on('menu-tool-door', callback),
    onMenuToolWindow: (callback) => ipcRenderer.on('menu-tool-window', callback),
    onMenuToolStairs: (callback) => ipcRenderer.on('menu-tool-stairs', callback),
    onMenuToolRoof: (callback) => ipcRenderer.on('menu-tool-roof', callback),
    onMenuToolMeasure: (callback) => ipcRenderer.on('menu-tool-measure', callback),
    onMenuToolSelect: (callback) => ipcRenderer.on('menu-tool-select', callback),
    onMenuShowShortcuts: (callback) => ipcRenderer.on('menu-show-shortcuts', callback),
    onMenuExportPNG: (callback) => ipcRenderer.on('menu-export-png', callback),
    onMenuExportGLTF: (callback) => ipcRenderer.on('menu-export-gltf', callback),
    onMenuExportOBJ: (callback) => ipcRenderer.on('menu-export-obj', callback),
    
    // Update events
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),

    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Log that preload script has loaded (only in dev)
if (process.argv.includes('--dev')) {
    console.log('ARCHKNIGHT 3D: Electron bridge initialized');
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT FOCUS FIX: BabylonJS canvas steals DOM focus from properties panel
// inputs in Electron. This restores focus to the clicked input element after
// all synchronous event handlers (including canvas.focus()) have completed.
// ─────────────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // Track the last input element the user clicked on
    let pendingFocusTarget = null;

    // Capture-phase mousedown: detect clicks on any input/textarea/select
    document.addEventListener('mousedown', (e) => {
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            pendingFocusTarget = e.target;
            // Re-focus after 50ms so all synchronous handlers (including
            // BabylonJS InputManager canvas.focus()) have completed
            setTimeout(() => {
                if (pendingFocusTarget &&
                    document.body.contains(pendingFocusTarget) &&
                    document.activeElement !== pendingFocusTarget) {
                    pendingFocusTarget.focus({ preventScroll: true });
                }
                pendingFocusTarget = null;
            }, 50);
        } else {
            // Intentional non-input click — clear pending focus
            pendingFocusTarget = null;
        }
    }, true); // capture phase runs before any bubbling handlers
});
