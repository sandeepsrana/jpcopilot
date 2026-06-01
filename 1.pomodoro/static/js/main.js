const STORAGE_KEY = 'pomodoro.custom.settings.v1';

const state = {
  mode: 'focus',
  isRunning: false,
  remainingSec: 25 * 60,
  timerId: null,
  settings: {
    focusMinutes: 25,
    breakMinutes: 5,
    theme: 'light',
    sounds: {
      start: true,
      end: true,
      tick: false,
    },
  },
};

const dom = {
  body: document.body,
  phaseLabel: document.getElementById('phaseLabel'),
  timeDisplay: document.getElementById('timeDisplay'),
  startStopBtn: document.getElementById('startStopBtn'),
  resetBtn: document.getElementById('resetBtn'),
  modeBtn: document.getElementById('modeBtn'),
  focusDurationSelect: document.getElementById('focusDurationSelect'),
  breakDurationSelect: document.getElementById('breakDurationSelect'),
  themeSelect: document.getElementById('themeSelect'),
  soundStart: document.getElementById('soundStart'),
  soundEnd: document.getElementById('soundEnd'),
  soundTick: document.getElementById('soundTick'),
};

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioContext = AudioContextClass ? new AudioContextClass() : null;

function beep(frequency = 660, durationMs = 80, gainValue = 0.03) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + durationMs / 1000);
}

function playStartSound() {
  if (state.settings.sounds.start) {
    beep(740, 100);
  }
}

function playTickSound() {
  if (state.settings.sounds.tick) {
    beep(520, 40, 0.015);
  }
}

function playEndSound() {
  if (state.settings.sounds.end) {
    beep(520, 90);
    setTimeout(() => beep(740, 140), 110);
  }
}

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getModeDurationSec(mode) {
  return (mode === 'focus' ? state.settings.focusMinutes : state.settings.breakMinutes) * 60;
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  } catch {
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (![15, 25, 35, 45].includes(parsed.focusMinutes)) return;
    if (![5, 10, 15].includes(parsed.breakMinutes)) return;
    if (!['light', 'dark', 'focus'].includes(parsed.theme)) return;
    state.settings = {
      focusMinutes: parsed.focusMinutes,
      breakMinutes: parsed.breakMinutes,
      theme: parsed.theme,
      sounds: {
        start: Boolean(parsed.sounds?.start),
        end: Boolean(parsed.sounds?.end),
        tick: Boolean(parsed.sounds?.tick),
      },
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function syncFormFromState() {
  dom.focusDurationSelect.value = String(state.settings.focusMinutes);
  dom.breakDurationSelect.value = String(state.settings.breakMinutes);
  dom.themeSelect.value = state.settings.theme;
  dom.soundStart.checked = state.settings.sounds.start;
  dom.soundEnd.checked = state.settings.sounds.end;
  dom.soundTick.checked = state.settings.sounds.tick;
  dom.body.dataset.theme = state.settings.theme;
}

function updateModeLabel() {
  if (state.mode === 'focus') {
    dom.phaseLabel.textContent = '作業モード';
    dom.modeBtn.textContent = '休憩へ切替';
  } else {
    dom.phaseLabel.textContent = '休憩モード';
    dom.modeBtn.textContent = '作業へ切替';
  }
}

function updateTime() {
  dom.timeDisplay.textContent = formatTime(state.remainingSec);
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  state.isRunning = false;
  dom.startStopBtn.textContent = '開始';
}

function resetCurrentMode() {
  state.remainingSec = getModeDurationSec(state.mode);
  updateTime();
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;
  dom.startStopBtn.textContent = '停止';
  playStartSound();
  state.timerId = setInterval(() => {
    if (state.remainingSec <= 0) {
      stopTimer();
      playEndSound();
      return;
    }
    state.remainingSec -= 1;
    playTickSound();
    updateTime();
  }, 1000);
}

function setupEvents() {
  dom.startStopBtn.addEventListener('click', () => {
    if (state.isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  dom.resetBtn.addEventListener('click', () => {
    stopTimer();
    resetCurrentMode();
  });

  dom.modeBtn.addEventListener('click', () => {
    stopTimer();
    state.mode = state.mode === 'focus' ? 'break' : 'focus';
    updateModeLabel();
    resetCurrentMode();
  });

  dom.focusDurationSelect.addEventListener('change', (event) => {
    state.settings.focusMinutes = Number(event.target.value);
    saveSettings();
    if (state.mode === 'focus') {
      stopTimer();
      resetCurrentMode();
    }
  });

  dom.breakDurationSelect.addEventListener('change', (event) => {
    state.settings.breakMinutes = Number(event.target.value);
    saveSettings();
    if (state.mode === 'break') {
      stopTimer();
      resetCurrentMode();
    }
  });

  dom.themeSelect.addEventListener('change', (event) => {
    state.settings.theme = event.target.value;
    dom.body.dataset.theme = state.settings.theme;
    saveSettings();
  });

  dom.soundStart.addEventListener('change', (event) => {
    state.settings.sounds.start = event.target.checked;
    saveSettings();
  });

  dom.soundEnd.addEventListener('change', (event) => {
    state.settings.sounds.end = event.target.checked;
    saveSettings();
  });

  dom.soundTick.addEventListener('change', (event) => {
    state.settings.sounds.tick = event.target.checked;
    saveSettings();
  });
}

function init() {
  loadSettings();
  syncFormFromState();
  updateModeLabel();
  resetCurrentMode();
  setupEvents();
}

init();
