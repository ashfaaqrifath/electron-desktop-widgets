class BatteryWidget {
  constructor() {
    this.elements = {
      batteryIcon: document.querySelector('.battery-icon'),
      widget: document.querySelector('.battery-widget'),
      batteryFill: document.getElementById('batteryFill'),
      batteryPercent: document.getElementById('batteryPercent'),
    };

    this.refresh();
    this.intervalId = setInterval(() => this.refresh(), 60000);
  }

  async refresh() {
    const stats = await this.getBatteryStats();
    this.render(stats);
  }

  async getBatteryStats() {
    if (window.electronAPI?.getBatteryStats) {
      const stats = await window.electronAPI.getBatteryStats();

      if (stats?.hasBattery && stats.percent !== null) {
        return stats;
      }
    }

    if (navigator.getBattery) {
      const battery = await navigator.getBattery();

      return {
        percent: Math.round(battery.level * 100),
        isCharging: battery.charging,
        hasBattery: true,
      };
    }

    return {
      percent: null,
      isCharging: false,
      hasBattery: false,
    };
  }

  render(stats) {
    if (!stats?.hasBattery || stats.percent === null) {
      this.elements.batteryPercent.textContent = '--%';
      this.elements.batteryFill.style.strokeDashoffset = getRingOffset(0);
      this.elements.batteryIcon.dataset.level = 'unknown';
      this.elements.batteryIcon.dataset.charging = 'false';
      this.elements.widget.dataset.charging = 'false';
      return;
    }

    const percent = clamp(stats.percent, 0, 100);
    const level = getBatteryLevel(percent);

    this.elements.batteryPercent.textContent = `${percent}%`;
    this.elements.batteryFill.style.strokeDashoffset = getRingOffset(percent);
    this.elements.batteryIcon.dataset.level = level;
    this.elements.batteryIcon.dataset.charging = stats.isCharging ? 'true' : 'false';
    this.elements.widget.dataset.charging = stats.isCharging ? 'true' : 'false';
  }
}

class StorageWidget {
  constructor() {
    this.elements = {
      widget: document.querySelector('.storage-widget'),
      fill: document.getElementById('storageFill'),
      value: document.getElementById('storageValue'),
    };

    this.refresh();
    this.intervalId = setInterval(() => this.refresh(), 14400000);
  }

  async refresh() {
    if (!window.electronAPI?.getStorageStats) {
      this.render(null);
      return;
    }

    const stats = await window.electronAPI.getStorageStats();
    this.render(stats);
  }

  render(stats) {
    if (!stats?.hasStorage || stats.freeGb === null) {
      this.elements.value.textContent = '--';
      this.elements.fill.style.strokeDashoffset = getRingOffset(0);
      this.elements.widget.dataset.level = 'low';
      return;
    }

    const freeGb = Math.max(0, stats.freeGb);
    const usedPercent = clamp(100 - stats.freePercent, 0, 100);
    const level = freeGb <= 50 ? 'low' : 'high';

    this.elements.value.textContent = String(freeGb);
    this.elements.fill.style.strokeDashoffset = getRingOffset(usedPercent);
    this.elements.widget.dataset.level = level;
  }
}

class CountdownWidget {
  constructor(targetDate) {
    this.targetDate = new Date(normalizeDateInput(targetDate));
    this.elements = {
      widget: document.querySelector('.countdown-widget'),
      value: document.getElementById('countdownValue'),
      date: document.getElementById('countdownDate'),
    };

    this.refresh();
    this.intervalId = setInterval(() => this.refresh(), 21600000);
  }

  refresh() {
    const remainingMs = this.targetDate.getTime() - Date.now();

    if (!Number.isFinite(this.targetDate.getTime())) {
      this.elements.value.textContent = '--';
      this.elements.value.dataset.level = 'low';
      this.elements.widget.dataset.level = 'low';
      this.elements.date.textContent = 'Set date';
      return;
    }

    this.elements.date.textContent = formatTargetDate(this.targetDate);

    if (remainingMs <= 0) {
      this.elements.value.textContent = '0';
      this.elements.value.dataset.level = 'low';
      this.elements.widget.dataset.level = 'low';
      return;
    }

    const remainingDays = Math.ceil(remainingMs / 86400000);
    const level = getCountdownLevel(remainingDays);

    this.elements.value.textContent = String(remainingDays);
    this.elements.value.dataset.level = level;
    this.elements.widget.dataset.level = level;
  }
}

function getBatteryLevel(percent) {
  if (percent <= 20) {
    return 'low';
  }

  if (percent <= 50) {
    return 'medium';
  }

  return 'high';
}

function getCountdownLevel(remainingDays) {
  if (remainingDays <= 7) {
    return 'low';
  }

  if (remainingDays <= 14) {
    return 'medium';
  }

  return 'high';
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function getRingOffset(percent) {
  const circumference = 194.78;
  return String(circumference - (circumference * percent) / 100);
}

function normalizeDateInput(value) {
  const date = String(value || '').trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${date}T00:00:00`;
  }

  return date;
}

function formatTargetDate(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

async function getCountdownTargetDate() {
  if (window.electronAPI?.getCountdownTargetDate) {
    return window.electronAPI.getCountdownTargetDate();
  }

  return '';
}

document.addEventListener('DOMContentLoaded', async () => {
  new BatteryWidget();
  new StorageWidget();
  new CountdownWidget(await getCountdownTargetDate());
});
