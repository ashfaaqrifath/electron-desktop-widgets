const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

let mainWindow;

function getInitialPosition() {
  const { workArea } = screen.getPrimaryDisplay();

  return {
    x: workArea.x + 16,
    y: workArea.y + 16,
  };
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

app.on('ready', () => {
  const position = getInitialPosition();

  mainWindow = new BrowserWindow({
    width: 118,
    height: 252,
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
ipcMain.handle('app:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});
