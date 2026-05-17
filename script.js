const COUNTDOWN_TARGET_DATE = '2026-05-29T00:00:00';

class BatteryWidget {
  constructor() {
    this.elements = {
      batteryIcon: document.querySelector('.battery-icon'),
      widget: document.querySelector('.battery-widget'),
      batteryFill: document.getElementById('batteryFill'),
      batteryPercent: document.getElementById('batteryPercent'),
    };

    this.refresh();
    this.intervalId = setInterval(() => this.refresh(), 30000);
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
      this.elements.batteryIcon.style.setProperty('--charge', '0%');
      this.elements.batteryFill.style.strokeDashoffset = getRingOffset(0);
      this.elements.batteryIcon.dataset.level = 'unknown';
      this.elements.batteryIcon.dataset.charging = 'false';
      this.elements.widget.dataset.charging = 'false';
      return;
    }

    const percent = clamp(stats.percent, 0, 100);
    const level = getLevel(percent);

    this.elements.batteryPercent.textContent = `${percent}%`;
    this.elements.batteryIcon.style.setProperty('--charge', `${percent}%`);
    this.elements.batteryFill.style.strokeDashoffset = getRingOffset(percent);
    this.elements.batteryIcon.dataset.level = level;
    this.elements.batteryIcon.dataset.charging = stats.isCharging ? 'true' : 'false';
    this.elements.widget.dataset.charging = stats.isCharging ? 'true' : 'false';
  }
}

class CountdownWidget {
  constructor(targetDate) {
    this.targetDate = new Date(targetDate);
    this.totalDays = Math.max(1, Math.ceil((this.targetDate.getTime() - Date.now()) / 86400000));
    this.elements = {
      widget: document.querySelector('.countdown-widget'),
      value: document.getElementById('countdownValue'),
      date: document.getElementById('countdownDate'),
    };

    this.refresh();
    this.intervalId = setInterval(() => this.refresh(), 60000);
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

    this.elements.date.textContent = `${formatTargetDate(this.targetDate)}`;

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

function getLevel(percent) {
  if (percent <= 20) {
    return 'low';
  }

  if (percent <= 50) {
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

function getCountdownLevel(remainingDays) {
  if (remainingDays <= 7) {
    return 'low';
  }

  if (remainingDays <= 14) {
    return 'medium';
  }

  return 'high';
}

function formatTargetDate(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

document.addEventListener('DOMContentLoaded', () => {
  new BatteryWidget();
  new CountdownWidget(COUNTDOWN_TARGET_DATE);
});
