# Desktop Widgets

A small Electron desktop widget stack for Windows with three glass-style desktop widgets: battery, C: drive storage, and countdown.

The app sits quietly on the desktop, launches in the upper-left corner, stays out of the taskbar, and does not float over other apps.

## Features

- Glass-style stacked desktop widgets
- Battery percentage widget with circular charge ring
- Charging state shown with a bolt icon and pulsing dot
- C: drive storage widget with circular free-space ring
- Storage turns red when C: drive free space is 50 GB or less
- Countdown widget controlled by a plain text file
- Countdown text and dot colors:
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

Edit `countdown-date.txt` and enter the target date on one line.

Recommended format:

```text
YYYY-MM-DD
```

Example:

```text
2026-12-21
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
"C:\path\to\Desktop Widgets\node_modules\electron\dist\electron.exe" "C:\path\to\Desktop Widgets"
```

6. Set **Start in** to:

```text
C:\path\to\Desktop Widgets
```

Launching Electron directly avoids opening a console window.

If you clone the repo somewhere else, replace the paths above with your project folder path.

## Project Structure

```text
.
+-- countdown-date.txt  # Countdown target date
+-- index.html          # Widget markup
+-- main.js             # Electron window, battery, storage, and date IPC
+-- preload.js          # Safe renderer bridge
+-- script.js           # Widget logic
+-- styles.css          # Widget styling
+-- package.json
+-- package-lock.json
```

## Notes

Battery data is read from Windows using `GetSystemPowerStatus` with a browser battery API fallback where available.

C: drive storage is read with Windows/.NET `DriveInfo`.

The window is frameless, transparent, skipped from the taskbar, draggable, and not always-on-top.

## License

MIT
