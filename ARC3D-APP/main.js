/**
 * ARC3D™ - Electron Main Process
 * Copyright © 2026 HSAN Studios. All rights reserved.
 */

const { app, BrowserWindow, Menu, shell, dialog, ipcMain, screen, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference to prevent garbage collection
let mainWindow = null;

// Check if running in development mode
const isDev = process.argv.includes('--dev');

// App configuration
const APP_CONFIG = {
    name: 'ARC3D™',
    version: '1.3.0',
    minWidth: 1024,
    minHeight: 768,
    defaultWidth: 1600,
    defaultHeight: 1000,
    backgroundColor: '#1a1a2e',
    useFramelessWindow: false, // Set to true for custom titlebar
    rememberWindowState: true
};

// Window state persistence
let windowState = {
    width: APP_CONFIG.defaultWidth,
    height: APP_CONFIG.defaultHeight,
    x: undefined,
    y: undefined,
    isMaximized: false
};

/**
 * Load saved window state from file
 */
function loadWindowState() {
    try {
        const stateFile = path.join(app.getPath('userData'), 'window-state.json');
        if (fs.existsSync(stateFile)) {
            const saved = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            windowState = { ...windowState, ...saved };
        }
    } catch (e) {
        // Use defaults if state file is corrupted
    }
}

/**
 * Save current window state to file
 */
function saveWindowState() {
    if (!mainWindow) return;
    try {
        const bounds = mainWindow.getBounds();
        windowState = {
            width: bounds.width,
            height: bounds.height,
            x: bounds.x,
            y: bounds.y,
            isMaximized: mainWindow.isMaximized()
        };
        const stateFile = path.join(app.getPath('userData'), 'window-state.json');
        fs.writeFileSync(stateFile, JSON.stringify(windowState));
    } catch (e) {
        // Ignore save errors
    }
}

/**
 * Validate window position is visible on a display
 */
function validateWindowPosition() {
    const displays = screen.getAllDisplays();
    const validPosition = displays.some(display => {
        const bounds = display.bounds;
        return (
            windowState.x >= bounds.x &&
            windowState.y >= bounds.y &&
            windowState.x < bounds.x + bounds.width &&
            windowState.y < bounds.y + bounds.height
        );
    });
    
    if (!validPosition) {
        windowState.x = undefined;
        windowState.y = undefined;
    }
}

/**
 * Create the main application window
 */
function createWindow() {
    // Load and validate saved window state
    if (APP_CONFIG.rememberWindowState) {
        loadWindowState();
        validateWindowPosition();
    }

    const windowOptions = {
        width: windowState.width,
        height: windowState.height,
        x: windowState.x,
        y: windowState.y,
        minWidth: APP_CONFIG.minWidth,
        minHeight: APP_CONFIG.minHeight,
        title: APP_CONFIG.name,
        icon: path.join(__dirname, 'build', 'knight(2)-1.ico'),
        backgroundColor: APP_CONFIG.backgroundColor,
        show: false, // Don't show until ready
        frame: !APP_CONFIG.useFramelessWindow,
        titleBarStyle: APP_CONFIG.useFramelessWindow ? 'hidden' : 'default',
        trafficLightPosition: APP_CONFIG.useFramelessWindow ? { x: 15, y: 15 } : undefined,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true,
            allowRunningInsecureContent: false,
            spellcheck: false,
            backgroundThrottling: false // Keep CAD app responsive in background
        }
    };

    mainWindow = new BrowserWindow(windowOptions);

    // Restore maximized state if applicable
    if (windowState.isMaximized) {
        mainWindow.maximize();
    }

    // Load the application
    const appPath = path.join(__dirname, 'app', 'arc3d.html');
    mainWindow.loadFile(appPath);

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
        // Explicitly focus the webContents so the CAD app receives all keyboard events
        mainWindow.webContents.focus();
        
        // Check for updates in production (auto-updater ready)
        if (!isDev) {
            checkForUpdates();
        }
    });

    // Re-focus webContents whenever the OS window regains focus
    // (e.g. after using native menus, dialogs, or alt-tabbing back)
    mainWindow.on('focus', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.focus();
        }
    });

    // Open DevTools in development mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Save window state on resize/move (debounced)
    let saveStateTimeout;
    const debouncedSaveState = () => {
        clearTimeout(saveStateTimeout);
        saveStateTimeout = setTimeout(saveWindowState, 500);
    };
    
    mainWindow.on('resize', debouncedSaveState);
    mainWindow.on('move', debouncedSaveState);
    mainWindow.on('maximize', saveWindowState);
    mainWindow.on('unmaximize', saveWindowState);

    // Handle window close
    mainWindow.on('close', () => {
        saveWindowState();
    });
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create application menu
    createApplicationMenu();
}

/**
 * Check for application updates (auto-updater ready structure)
 * To enable, install electron-updater: npm install electron-updater
 * and uncomment the autoUpdater code below
 */
function checkForUpdates() {
    // Auto-updater integration ready
    // Uncomment and configure when publishing to a server
    /*
    const { autoUpdater } = require('electron-updater');
    
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
        sendToRenderer('update-available');
    });
    
    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: 'A new version has been downloaded. Restart to apply the update?',
            buttons: ['Restart', 'Later']
        }).then(result => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });
    */
}

/**
 * Create the native application menu
 */
function createApplicationMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Project',
                    click: () => sendToRenderer('menu-new-project')
                },
                {
                    label: 'Open Project...',
                    click: () => handleOpenProject()
                },
                {
                    label: 'Save Project',
                    click: () => sendToRenderer('menu-save-project')
                },
                {
                    label: 'Save As...',
                    click: () => handleSaveProjectAs()
                },
                { type: 'separator' },
                {
                    label: 'Export',
                    submenu: [
                        {
                            label: 'Export as PNG',
                            click: () => sendToRenderer('menu-export-png')
                        },
                        {
                            label: 'Export as GLTF',
                            click: () => sendToRenderer('menu-export-gltf')
                        },
                        {
                            label: 'Export as OBJ',
                            click: () => sendToRenderer('menu-export-obj')
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo  (Ctrl+Z)',
                    click: () => sendToRenderer('menu-undo')
                },
                {
                    label: 'Redo  (Ctrl+Y)',
                    click: () => sendToRenderer('menu-redo')
                },
                { type: 'separator' },
                {
                    label: 'Copy',
                    click: () => sendToRenderer('menu-copy')
                },
                {
                    label: 'Paste',
                    click: () => sendToRenderer('menu-paste')
                },
                {
                    label: 'Duplicate',
                    // No accelerator — Ctrl+D handled by renderer keydown
                    click: () => sendToRenderer('menu-duplicate')
                },
                { type: 'separator' },
                {
                    label: 'Delete',
                    click: () => sendToRenderer('menu-delete')
                },
                {
                    label: 'Select All',
                    click: () => sendToRenderer('menu-select-all')
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: '2D View  (2)',
                    click: () => sendToRenderer('menu-view-2d')
                },
                {
                    label: '3D View  (3)',
                    click: () => sendToRenderer('menu-view-3d')
                },
                { type: 'separator' },
                {
                    label: 'Top View',
                    click: () => sendToRenderer('menu-view-top')
                },
                {
                    label: 'Front View',
                    click: () => sendToRenderer('menu-view-front')
                },
                {
                    label: 'Right View',
                    click: () => sendToRenderer('menu-view-right')
                },
                {
                    label: 'Isometric View',
                    click: () => sendToRenderer('menu-view-iso')
                },
                { type: 'separator' },
                {
                    label: 'Toggle Fullscreen',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                { type: 'separator' },
                {
                    label: 'Zoom In',
                    click: () => sendToRenderer('menu-zoom-in')
                },
                {
                    label: 'Zoom Out',
                    click: () => sendToRenderer('menu-zoom-out')
                },
                {
                    label: 'Reset Zoom',
                    click: () => sendToRenderer('menu-zoom-reset')
                }
            ]
        },
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Wall Tool (W)',
                    click: () => sendToRenderer('menu-tool-wall')
                },
                {
                    label: 'Door Tool (Shift+D)',
                    click: () => sendToRenderer('menu-tool-door')
                },
                {
                    label: 'Window Tool (Shift+W)',
                    click: () => sendToRenderer('menu-tool-window')
                },
                {
                    label: 'Stairs Tool (Shift+S)',
                    click: () => sendToRenderer('menu-tool-stairs')
                },
                {
                    label: 'Roof Tool (Shift+R)',
                    click: () => sendToRenderer('menu-tool-roof')
                },
                { type: 'separator' },
                {
                    label: 'Measure Tool',
                    click: () => sendToRenderer('menu-tool-measure')
                },
                {
                    label: 'Select Mode (S)',
                    click: () => sendToRenderer('menu-tool-select')
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Keyboard Shortcuts',
                    click: () => sendToRenderer('menu-show-shortcuts')
                },
                {
                    label: 'About ARC3D',
                    click: () => showAboutDialog()
                },
                { type: 'separator' },
                {
                    label: 'Developer Tools',
                    accelerator: 'F12',
                    click: () => mainWindow.webContents.toggleDevTools()
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        template.unshift({
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/**
 * Send message to renderer process
 */
function sendToRenderer(channel, data = null) {
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send(channel, data);
    }
}

/**
 * Handle Open Project dialog
 */
async function handleOpenProject() {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Open ARC3D Project',
        defaultPath: getProjectsDir(),
        filters: [
            { name: 'ARC3D Projects', extensions: ['ark', 'cadpro'] },
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            sendToRenderer('menu-load-project', { filePath, content });
        } catch (error) {
            dialog.showErrorBox('Error', `Failed to open project: ${error.message}`);
        }
    }
}

/**
 * Handle Save Project As dialog
 */
async function handleSaveProjectAs() {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save ARC3D Project',
        defaultPath: path.join(getProjectsDir(), 'project.ark'),
        filters: [
            { name: 'ARC3D Projects', extensions: ['ark'] },
            { name: 'JSON Files', extensions: ['json'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        sendToRenderer('menu-save-project-as', { filePath: result.filePath });
    }
}

/**
 * Show About dialog
 */
function showAboutDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About ARC3D',
        message: 'ARC3D™',
        detail: `Version ${APP_CONFIG.version}\n\nProfessional Architectural Design Software\n\nCopyright © 2026 HSAN Studios.\nAll rights reserved.\n\nPowered by BabylonJS`,
        buttons: ['OK']
    });
}

// ─────────────────────────────────────────────────────────────────
// IPC: Generic file operations
// ─────────────────────────────────────────────────────────────────
ipcMain.handle('save-file', async (event, { filePath, content }) => {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// ─────────────────────────────────────────────────────────────────
// IPC: Project file management (Documents/ARC3D-Projects)
// ─────────────────────────────────────────────────────────────────
let PROJECTS_FOLDER = 'ARC3D-Projects';
let customProjectsDir = null; // User-selected custom directory

function getProjectsDir() {
    if (customProjectsDir) return customProjectsDir;
    const docsPath = app.getPath('documents');
    return path.join(docsPath, PROJECTS_FOLDER);
}

// Load saved custom directory from settings
function loadCustomProjectsDir() {
    try {
        const settingsPath = path.join(app.getPath('userData'), 'arc3d-settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            if (settings.customProjectsDir && fs.existsSync(settings.customProjectsDir)) {
                customProjectsDir = settings.customProjectsDir;
            }
        }
    } catch (e) {
        console.warn('Failed to load custom projects dir:', e);
    }
}

function saveCustomProjectsDir(dir) {
    try {
        const settingsPath = path.join(app.getPath('userData'), 'arc3d-settings.json');
        let settings = {};
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
        settings.customProjectsDir = dir;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.warn('Failed to save custom projects dir:', e);
    }
}

loadCustomProjectsDir();

function ensureProjectsDir() {
    const dir = getProjectsDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

// Return the projects directory path
ipcMain.handle('get-projects-path', async () => {
    try {
        const dir = ensureProjectsDir();
        return { success: true, path: dir };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Save a project file to Documents/ARC3D-Projects/
ipcMain.handle('save-project-file', async (event, { filename, content }) => {
    try {
        const dir = ensureProjectsDir();
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true, path: filePath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Read a project file from Documents/ARC3D-Projects/
ipcMain.handle('read-project-file', async (event, filename) => {
    try {
        const dir = getProjectsDir();
        const filePath = path.join(dir, filename);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// List all .ark/.cadpro files in the projects folder
ipcMain.handle('list-project-files', async () => {
    try {
        const dir = getProjectsDir();
        if (!fs.existsSync(dir)) {
            return { success: true, files: [] };
        }
        const entries = fs.readdirSync(dir);
        const files = entries
            .filter(name => name.endsWith('.ark') || name.endsWith('.cadpro'))
            .map(name => {
                const filePath = path.join(dir, name);
                const stat = fs.statSync(filePath);
                return {
                    name: name,
                    size: stat.size,
                    modified: stat.mtimeMs,
                    path: filePath
                };
            })
            .sort((a, b) => b.modified - a.modified);
        return { success: true, files };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Delete a project file
ipcMain.handle('delete-project-file', async (event, filename) => {
    try {
        const dir = getProjectsDir();
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Rename a project file
ipcMain.handle('rename-project-file', async (event, { oldFilename, newFilename }) => {
    try {
        const dir = getProjectsDir();
        const oldPath = path.join(dir, oldFilename);
        const newPath = path.join(dir, newFilename);
        if (!fs.existsSync(oldPath)) {
            return { success: false, error: 'File not found' };
        }
        fs.renameSync(oldPath, newPath);
        return { success: true, path: newPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Open the projects folder in file explorer
ipcMain.handle('open-projects-folder', async () => {
    try {
        const dir = ensureProjectsDir();
        shell.openPath(dir);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Change the projects save location
ipcMain.handle('change-projects-folder', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Select Save Location',
            defaultPath: getProjectsDir(),
            properties: ['openDirectory', 'createDirectory']
        });
        if (result.canceled || !result.filePaths.length) {
            return { success: false, canceled: true };
        }
        const newDir = result.filePaths[0];
        customProjectsDir = newDir;
        saveCustomProjectsDir(newDir);
        return { success: true, path: newDir };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Reset projects folder to default
ipcMain.handle('reset-projects-folder', async () => {
    try {
        customProjectsDir = null;
        saveCustomProjectsDir(null);
        const dir = ensureProjectsDir();
        return { success: true, path: dir };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Window control IPC handlers (for frameless window mode)
ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});

// Dialog IPC handlers
ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
});

// App lifecycle events
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event) => {
        event.preventDefault();
    });
});
