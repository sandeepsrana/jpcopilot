"use strict";

const PHASE_LABELS = { focus: "作業中", shortBreak: "短休憩", longBreak: "長休憩" };
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
const NOTIFICATION_DURATION_MS = 3000;

/**
 * UIController
 *
 * Owns all DOM read/write operations and user event bindings.
 * Kept separate from business logic to keep TimerEngine and Gamification
 * framework-agnostic.
 */
class UIController {
  /**
   * @param {TimerEngine}  engine
   * @param {ProgressRing} ring
   * @param {Gamification} gamification
   */
  constructor(engine, ring, gamification) {
    this._engine = engine;
    this._ring = ring;
    this._gamification = gamification;
    this._notifTimer = null;

    this._els = {
      timeDisplay: document.getElementById("time-display"),
      phaseLabel: document.getElementById("phase-label"),
      startStopBtn: document.getElementById("start-stop-btn"),
      completedCount: document.getElementById("completed-count"),
      focusTotal: document.getElementById("focus-total"),
      levelDisplay: document.getElementById("level-display"),
      xpBarFill: document.getElementById("xp-bar-fill"),
      xpBarContainer: document.getElementById("xp-bar-fill").parentElement,
      xpText: document.getElementById("xp-text"),
      streakDisplay: document.getElementById("streak-display"),
      badgesContainer: document.getElementById("badges-container"),
      weeklyChart: document.getElementById("weekly-chart"),
      notification: document.getElementById("gamification-notification"),
    };

    this._bindEvents();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Lightweight update called on every timer tick (~200 ms).
   * Updates only values that change frequently.
   */
  update() {
    this._updateTime();
    this._updatePhase();
    this._updateButtons();
    this._updateStats();
    this._updateLevel();
    this._updateStreak();
    this._updateRing();
  }

  /**
   * Full update including badge grid and chart.
   * Call after a phase completes or on initial render.
   */
  fullUpdate() {
    this.update();
    this._renderBadges();
    this._renderChart();
  }

  /**
   * Show a temporary toast notification.
   * @param {string} message
   */
  showNotification(message) {
    const el = this._els.notification;
    el.textContent = message;
    el.classList.add("notification--visible");
    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(
      () => el.classList.remove("notification--visible"),
      NOTIFICATION_DURATION_MS
    );
  }

  // ── Private update helpers ──────────────────────────────────────────────────

  _updateTime() {
    const sec = this._engine.remainingSec;
    const mm = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    this._els.timeDisplay.textContent = `${mm}:${ss}`;
  }

  _updatePhase() {
    const phase = this._engine.phase;
    this._els.phaseLabel.textContent = PHASE_LABELS[phase] || "作業中";
    document.body.className = `phase--${phase}`;
  }

  _updateButtons() {
    const running = this._engine.isRunning;
    this._els.startStopBtn.textContent = running ? "停止" : "開始";
    this._els.startStopBtn.setAttribute(
      "aria-label",
      running ? "タイマーを停止" : "タイマーを開始"
    );
  }

  _updateStats() {
    const { completedCount, focusTotalSec } = this._engine.statsToday;
    this._els.completedCount.textContent = String(completedCount);

    const totalMin = Math.floor(focusTotalSec / 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    this._els.focusTotal.textContent = h > 0 ? `${h}時間${m}分` : `${m}分`;
  }

  _updateLevel() {
    const { level, xpInLevel, xpNeeded } = this._gamification.getLevelInfo();
    this._els.levelDisplay.textContent = `Lv.${level}`;
    const pct = Math.round((xpInLevel / xpNeeded) * 100);
    this._els.xpBarFill.style.width = `${pct}%`;
    this._els.xpBarContainer.setAttribute("aria-valuenow", String(pct));
    this._els.xpText.textContent = `${xpInLevel} / ${xpNeeded} XP`;
  }

  _updateStreak() {
    const days = this._gamification.getStreakDays();
    this._els.streakDisplay.textContent = `🔥 ${days}日連続`;
    this._els.streakDisplay.setAttribute("aria-label", `ストリーク ${days}日連続`);
  }

  _updateRing() {
    const total = this._engine.totalDuration;
    const fraction = total > 0 ? this._engine.remainingSec / total : 0;
    this._ring.setProgress(fraction);
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  _renderBadges() {
    const badges = this._gamification.getAllBadges();
    this._els.badgesContainer.innerHTML = badges
      .map(
        b => `
        <div class="badge ${b.unlocked ? "badge--unlocked" : "badge--locked"}" title="${b.desc}">
          <span class="badge__emoji">${b.emoji}</span>
          <span class="badge__label">${b.label}</span>
        </div>`
      )
      .join("");
  }

  _renderChart() {
    const data = this._gamification.getWeeklyData();
    const maxCount = Math.max(...data.map(d => d.count), 1);

    this._els.weeklyChart.innerHTML = `
      <div class="chart-bars">
        ${data
          .map(d => {
            const date = new Date(d.date + "T00:00:00");
            const dayLabel = DAY_NAMES[date.getDay()];
            const heightPct = d.count > 0
              ? Math.max((d.count / maxCount) * 100, 8)
              : 0;
            return `
              <div class="chart-bar-col">
                <div class="chart-bar-wrapper">
                  <div class="chart-bar" style="height:${heightPct}%"
                       aria-label="${d.date}: ${d.count}回">
                    ${d.count > 0
                      ? `<span class="chart-bar-value">${d.count}</span>`
                      : ""}
                  </div>
                </div>
                <div class="chart-bar-label">${dayLabel}</div>
              </div>`;
          })
          .join("")}
      </div>`;
  }

  // ── Event binding ───────────────────────────────────────────────────────────

  _bindEvents() {
    document
      .getElementById("start-stop-btn")
      .addEventListener("click", () => this._engine.toggleStartStop());

    document
      .getElementById("reset-btn")
      .addEventListener("click", () => this._engine.reset());
  }
}
