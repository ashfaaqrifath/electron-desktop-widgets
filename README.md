# Desktop Widgets

A small Electron desktop widget stack for Windows with a glass-style battery widget and a matching countdown widget.

The app is designed to sit quietly on the desktop, launch in the upper-left corner, stay out of the taskbar, and avoid floating over other apps.

## Features

- Glass-style desktop widget UI
- Battery percentage widget with a circular charge ring
- Charging state shown with a bolt icon and pulsing dot
- Countdown widget for a custom target date
- Countdown text changes color by urgency:
  - Green: more than 14 days left
  - Yellow: 14 days or less
  - Red: 7 days or less
- Draggable frameless window
- Starts at the upper-left corner of the desktop
- Does not stay always-on-top

## Requirements

- Windows
- Node.js
- npm

## Install

Clone the repo, then install dependencies:

```bash
npm install
```

## Run

```bash
npm start
```

If PowerShell blocks npm scripts, run:

```bash
npm.cmd start
```

## Configure The Countdown

Open `script.js` and edit this line:

```js
const COUNTDOWN_TARGET_DATE = '2026-05-29T00:00:00';
```

Use the format:

```text
YYYY-MM-DDT00:00:00
```

Example:

```js
const COUNTDOWN_TARGET_DATE = '2026-12-21T00:00:00';
```

The widget displays the date as `21/12/2026`.

## Start Automatically On Windows

To launch the widgets when you sign in:

1. Press `Win + R`
2. Type `shell:startup`
3. Press Enter
4. Create a new shortcut in that folder
5. Use this shortcut target:

```text
"E:\Documents\Desktop Widgets\node_modules\electron\dist\electron.exe" "E:\Documents\Desktop Widgets"
```

6. Set **Start in** to:

```text
E:\Documents\Desktop Widgets
```

Launching Electron directly avoids opening a console window.

If you clone the repo somewhere else, replace the paths above with your project folder path.

## Project Structure

```text
.
├── index.html      # Widget markup
├── main.js         # Electron window and battery IPC
├── preload.js      # Safe renderer bridge
├── script.js       # Battery and countdown logic
├── styles.css      # Widget styling
├── package.json
└── package-lock.json
```

## Notes

Battery data is read from Windows using `GetSystemPowerStatus`. The renderer also includes a browser battery API fallback where available.

The window is frameless, transparent, skipped from the taskbar, draggable, and not always-on-top.

## License

MIT
