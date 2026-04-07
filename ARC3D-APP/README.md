# ARCHKNIGHT™ 3D - Desktop Application

Professional Architectural Design Software built with Electron and BabylonJS.

## Features

- **Native Desktop App** - Runs on Windows, macOS, and Linux
- **Window State Persistence** - Remembers window size and position
- **Auto-Updater Ready** - Built-in update system (configure server URL)
- **Native File Dialogs** - Open/Save project files
- **Native Menus** - Full menu bar with keyboard shortcuts
- **Offline Support** - Works without internet connection

## Requirements

- Node.js 18+ (LTS recommended)
- npm 9+

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Run in development mode (with DevTools)
npm run dev

# Run in production mode
npm start
```

## Building Installers

### Windows
```bash
npm run build:win
```
Creates:
- `dist/ARCHKNIGHT 3D-1.1.0-win-x64.exe` (Installer)
- `dist/ARCHKNIGHT 3D-1.1.0-win-ia32.exe` (Installer 32-bit)
- `dist/ARCHKNIGHT 3D-1.1.0-win.exe` (Portable)

### macOS
```bash
npm run build:mac
```
Creates:
- `dist/ARCHKNIGHT 3D-1.1.0-mac-x64.dmg`
- `dist/ARCHKNIGHT 3D-1.1.0-mac-arm64.dmg` (Apple Silicon)

### Linux
```bash
npm run build:linux
```
Creates:
- `dist/ARCHKNIGHT 3D-1.1.0-x64.AppImage`
- `dist/archknight-3d_1.1.0_amd64.deb`
- `dist/archknight-3d-1.1.0.x86_64.rpm`

### All Platforms
```bash
npm run build:all
```

## Project Structure

```
ARCHKNIGHT-App/
├── app/                    # Application files
│   └── Archknight-3d.html  # Main application
├── build/                  # Build resources
│   ├── knight(2)-1.ico    # Windows icon
│   ├── icon.icns          # macOS icon
│   ├── icon.png           # Linux icon (512x512)
│   ├── icons/             # Linux icon set (optional)
│   ├── LICENSE.txt        # EULA for installer
│   └── entitlements.mac.plist  # macOS entitlements
├── dist/                   # Built installers (generated)
├── main.js                 # Electron main process
├── preload.js              # Secure bridge script
├── package.json            # Project configuration
└── README.md               # This file
```

## App Icons

Place your icons in the `build/` folder:

| File | Platform | Size |
|------|----------|------|
| `knight(2)-1.ico` | Windows | 256x256 (multi-size ICO) |
| `icon.icns` | macOS | 512x512 (use iconutil) |
| `icon.png` | Linux/General | 512x512 or 1024x1024 |

### Creating Icons

**From PNG to ICO (Windows):**
Use online converter or ImageMagick:
```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

**From PNG to ICNS (macOS):**
```bash
mkdir icon.iconset
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
```

## Auto-Updater Configuration

To enable auto-updates:

1. Edit `package.json` → `build.publish.url` with your update server URL
2. Uncomment the autoUpdater code in `main.js` → `checkForUpdates()`
3. Host your releases on the configured server

## Frameless Window Mode

To use a custom titlebar (frameless window):

1. Edit `main.js` → set `useFramelessWindow: true` in `APP_CONFIG`
2. Add custom titlebar HTML/CSS to your app
3. Use `window.electronAPI.windowMinimize/Maximize/Close()` for controls

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Project | Ctrl+N |
| Open Project | Ctrl+O |
| Save Project | Ctrl+S |
| Save As | Ctrl+Shift+S |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y |
| Delete | Delete |
| 2D View | F2 |
| 3D View | F3 |
| Fullscreen | F11 |
| Wall Tool | W |
| Door Tool | D |
| Window Tool | I |
| Stairs Tool | T |
| Measure Tool | M |
| Select Tool | Escape |
| DevTools (dev only) | F12 |

## License

Copyright © 2026 ARCHKNIGHT. All rights reserved.
This software is proprietary and confidential.
