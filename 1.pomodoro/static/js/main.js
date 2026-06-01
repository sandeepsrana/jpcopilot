// ── Pomodoro Timer with visual feedback ──────────────────────────────────────

const FOCUS_DURATION = 25 * 60;  // seconds
const BREAK_DURATION =  5 * 60;

// DOM references
const ring         = document.getElementById('progress-ring__bar');
const timeDisplay  = document.getElementById('time-display');
const sessionLabel = document.getElementById('session-label');
const sessionCount = document.getElementById('session-count');
const btnStart     = document.getElementById('btn-start');
const btnReset     = document.getElementById('btn-reset');
const timerContainer = document.querySelector('.timer-container');

// ── SVG ring setup ────────────────────────────────────────────────────────────
const RADIUS       = ring.r.baseVal.value;          // 96
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
ring.style.strokeDasharray  = `${CIRCUMFERENCE}`;
ring.style.strokeDashoffset = '0';

// ── State ─────────────────────────────────────────────────────────────────────
let totalSeconds     = FOCUS_DURATION;
let remainingSeconds = FOCUS_DURATION;
let isFocus          = true;
let isRunning        = false;
let tickInterval     = null;
let sessionNum       = 1;

// ── Color helpers ─────────────────────────────────────────────────────────────
// Colours: blue → yellow → red as ratio goes from 1 → 0
const BLUE   = [59,  130, 246];
const YELLOW = [245, 158,  11];
const RED    = [239,  68,  68];

/**
 * Linear interpolation between two RGB triples.
 * @param {number[]} c1
 * @param {number[]} c2
 * @param {number}   t   0 → c1, 1 → c2
 * @returns {number[]}
 */
function lerpRgb(c1, c2, t) {
  return c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
}

/**
 * Returns an [r,g,b] triple for the given progress ratio (1=full, 0=expired).
 * @param {number} ratio
 * @returns {number[]}
 */
function progressRgb(ratio) {
  if (ratio >= 0.5) {
    // blue → yellow  (ratio 1.0 … 0.5)
    return lerpRgb(BLUE, YELLOW, (1 - ratio) * 2);
  }
  // yellow → red  (ratio 0.5 … 0.0)
  return lerpRgb(YELLOW, RED, (0.5 - ratio) * 2);
}

function rgbStr([r, g, b]) {
  return `rgb(${r},${g},${b})`;
}

function rgbaStr([r, g, b], a) {
  return `rgba(${r},${g},${b},${a})`;
}

// ── Ring update ───────────────────────────────────────────────────────────────
function updateRing() {
  const ratio  = remainingSeconds / totalSeconds;
  const offset = CIRCUMFERENCE * (1 - ratio);
  ring.style.strokeDashoffset = `${offset}`;
  ring.style.stroke = rgbStr(progressRgb(ratio));
}

// ── Display ───────────────────────────────────────────────────────────────────
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function refreshDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  updateRing();
}

// ── Ripple burst ──────────────────────────────────────────────────────────────
function spawnRipple() {
  const el = document.createElement('div');
  el.className = 'ripple';
  // Sync ripple colour with current ring colour
  const ratio = remainingSeconds / totalSeconds;
  el.style.borderColor = rgbStr(progressRgb(ratio));
  timerContainer.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ── Particle canvas ───────────────────────────────────────────────────────────
const canvas = document.getElementById('particle-canvas');
const ctx    = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  particles = [];
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function spawnParticle() {
  const ratio = remainingSeconds / totalSeconds;
  particles.push({
    x:      Math.random() * canvas.width,
    y:      canvas.height + 12,
    vx:     (Math.random() - 0.5) * 0.8,
    vy:     -(0.6 + Math.random() * 1.0),
    radius: 1.5 + Math.random() * 3,
    alpha:  0.35 + Math.random() * 0.45,
    color:  progressRgb(ratio),
  });
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Spawn new particles only during a running focus session
  if (isRunning && isFocus && particles.length < 90) {
    spawnParticle();
    spawnParticle();
  }

  // Update and draw
  particles = particles.filter(p => p.y > -20 && p.alpha > 0.01);
  for (const p of particles) {
    p.x     += p.vx;
    p.y     += p.vy;
    p.alpha *= 0.997;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = rgbaStr(p.color, p.alpha);
    ctx.fill();
  }

  requestAnimationFrame(animateParticles);
}
animateParticles();

// ── Timer logic ───────────────────────────────────────────────────────────────
function tick() {
  if (remainingSeconds <= 0) {
    clearInterval(tickInterval);
    isRunning = false;
    btnStart.textContent = 'スタート';
    onSessionEnd();
    return;
  }
  remainingSeconds--;
  refreshDisplay();
  // Ripple every full minute and during the final 10 seconds
  if (remainingSeconds > 0 && (remainingSeconds % 60 === 0 || remainingSeconds <= 10)) {
    spawnRipple();
  }
}

function onSessionEnd() {
  if (isFocus) {
    sessionNum++;
    sessionCount.textContent = `セッション: ${sessionNum}`;
    isFocus = false;
    totalSeconds = remainingSeconds = BREAK_DURATION;
    sessionLabel.textContent = '休憩';
  } else {
    isFocus = true;
    totalSeconds = remainingSeconds = FOCUS_DURATION;
    sessionLabel.textContent = '集中';
  }
  refreshDisplay();
  startTimer();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  btnStart.textContent = '一時停止';
  tickInterval = setInterval(tick, 1000);
}

function pauseTimer() {
  clearInterval(tickInterval);
  isRunning = false;
  btnStart.textContent = 'スタート';
}

function resetTimer() {
  clearInterval(tickInterval);
  isRunning            = false;
  isFocus              = true;
  totalSeconds         = FOCUS_DURATION;
  remainingSeconds     = FOCUS_DURATION;
  sessionNum           = 1;
  btnStart.textContent = 'スタート';
  sessionLabel.textContent  = '集中';
  sessionCount.textContent  = 'セッション: 1';
  particles = [];
  refreshDisplay();
}

// ── Event listeners ───────────────────────────────────────────────────────────
btnStart.addEventListener('click', () => {
  if (isRunning) { pauseTimer(); } else { startTimer(); }
});
btnReset.addEventListener('click', resetTimer);

// ── Initial render ────────────────────────────────────────────────────────────
refreshDisplay();
