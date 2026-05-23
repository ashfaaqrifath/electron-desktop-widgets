const { app, BrowserWindow, ipcMain, screen, Tray, Menu, shell } = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

let mainWindow;
let tray;

function showWidgets() {
  if (mainWindow) {
    mainWindow.showInactive();
  }
}

function hideWidgets() {
  if (mainWindow) {
    mainWindow.hide();
  }
}

function reloadWidgets() {
  if (mainWindow) {
    mainWindow.webContents.reloadIgnoringCache();
  }
}

function getCountdownTargetPath() {
  return path.join(__dirname, 'countdown-date.txt');
}

function editCountdownDate() {
  shell.openPath(getCountdownTargetPath());
}

function openProjectFolder() {
  shell.openPath(__dirname);
}

function createTray() {
  const iconPath = path.join(__dirname, 'tray-icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Desktop Widgets');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show widgets', click: showWidgets },
    { label: 'Hide widgets', click: hideWidgets },
    { label: 'Refresh widgets', click: reloadWidgets },
    { type: 'separator' },
    { label: 'Edit countdown date', click: editCountdownDate },
    { label: 'Open project folder', click: openProjectFolder },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (!mainWindow) {
      return;
    }

    if (mainWindow.isVisible()) {
      hideWidgets();
      return;
    }

    showWidgets();
  });
}

function getInitialPosition() {
  const { workArea } = screen.getPrimaryDisplay();

  return {
    x: workArea.x + 16,
    y: workArea.y + 16,
  };
}

function getCountdownTargetDate() {
  const targetPath = getCountdownTargetPath();

  try {
    return fs.readFileSync(targetPath, 'utf8').trim();
  } catch {
    return '';
  }
}

function getBatteryStats() {
  if (process.platform !== 'win32') {
    return Promise.resolve(null);
  }

  const command = [
    '$type = Add-Type -PassThru -Name PowerStatus -Namespace Win32 -MemberDefinition \'[StructLayout(LayoutKind.Sequential)] public struct SYSTEM_POWER_STATUS { public byte ACLineStatus; public byte BatteryFlag; public byte BatteryLifePercent; public byte Reserved1; public int BatteryLifeTime; public int BatteryFullLifeTime; } [DllImport("kernel32.dll", SetLastError=true)] public static extern bool GetSystemPowerStatus(out SYSTEM_POWER_STATUS status);\'',
    '$status = New-Object Win32.PowerStatus+SYSTEM_POWER_STATUS',
    '[Win32.PowerStatus]::GetSystemPowerStatus([ref]$status) | Out-Null',
    '[pscustomobject]@{ BatteryLifePercent = $status.BatteryLifePercent; ACLineStatus = $status.ACLineStatus; BatteryFlag = $status.BatteryFlag } | ConvertTo-Json -Compress',
  ].join('; ');

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { windowsHide: true, timeout: 5000 },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        try {
          const data = JSON.parse(stdout || '{}');
          const percent = Number(data.BatteryLifePercent);
          const flag = Number(data.BatteryFlag);
          const hasBattery = Number.isFinite(flag) && (flag & 128) === 0 && percent !== 255;

          resolve({
            percent: hasBattery && Number.isFinite(percent) ? percent : null,
            isCharging: Number(data.ACLineStatus) === 1,
            hasBattery,
          });
        } catch {
          resolve(null);
        }
      },
    );
  });
}

function getStorageStats() {
  if (process.platform !== 'win32') {
    return Promise.resolve(null);
  }

  const command = [
    '$drive = [System.IO.DriveInfo]::GetDrives() | Where-Object { $_.Name -eq "C:\\" } | Select-Object -First 1',
    'if ($null -eq $drive) { Write-Output "{}"; exit 0 }',
    '[pscustomobject]@{ TotalSize = $drive.TotalSize; AvailableFreeSpace = $drive.AvailableFreeSpace } | ConvertTo-Json -Compress',
  ].join('; ');

  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { windowsHide: true, timeout: 5000 },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        try {
          const data = JSON.parse(stdout || '{}');
          const totalBytes = Number(data.TotalSize);
          const freeBytes = Number(data.AvailableFreeSpace);
          const hasStorage = Number.isFinite(totalBytes) && totalBytes > 0 && Number.isFinite(freeBytes);

          resolve({
            freeGb: hasStorage ? Math.round(freeBytes / 1073741824) : null,
            freePercent: hasStorage ? Math.round((freeBytes / totalBytes) * 100) : null,
            hasStorage,
          });
        } catch {
          resolve(null);
        }
      },
    );
  });
}

app.on('ready', () => {
  const position = getInitialPosition();

  mainWindow = new BrowserWindow({
    width: 118,
    height: 386,
    x: position.x,
    y: position.y,
    resizable: false,
    movable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    alwaysOnTop: false,
    backgroundColor: '#00000000',
  });

  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => {
    mainWindow.showInactive();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    app.emit('ready');
  }
});

ipcMain.handle('battery:get-stats', () => getBatteryStats());
ipcMain.handle('storage:get-stats', () => getStorageStats());
ipcMain.handle('countdown:get-target-date', () => getCountdownTargetDate());
ipcMain.handle('app:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});
