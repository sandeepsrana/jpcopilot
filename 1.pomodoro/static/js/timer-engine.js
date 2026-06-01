"use strict";

/**
 * TimerEngine
 *
 * Manages the countdown, phase transitions and stats recording.
 * Uses end-time subtraction instead of simple 1-second decrement so that
 * the timer stays accurate even when the tab is inactive.
 */
class TimerEngine {
  /**
   * @param {StateStore} store
   * @param {() => void} onTick          – called every ~200 ms while running
   * @param {(phase: string) => void} onPhaseComplete – called when a phase ends
   */
  constructor(store, onTick, onPhaseComplete) {
    this._store = store;
    this._onTick = onTick;
    this._onPhaseComplete = onPhaseComplete;

    this.phase = "focus";
    this.isRunning = false;
    this.remainingSec = store.settings.focusSec;
    this.cycleCount = 0;

    this._intervalId = null;
    this._endTime = null;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this._endTime = Date.now() + this.remainingSec * 1000;
    this._intervalId = setInterval(() => this._tick(), 200);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearInterval(this._intervalId);
    this._intervalId = null;
  }

  reset() {
    this.stop();
    this.remainingSec = this._phaseDuration(this.phase);
    this._onTick();
  }

  toggleStartStop() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
    this._onTick();
  }

  /** Total duration of the current phase in seconds. */
  get totalDuration() {
    return this._phaseDuration(this.phase);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _tick() {
    const remaining = Math.max(0, Math.round((this._endTime - Date.now()) / 1000));
    this.remainingSec = remaining;
    this._onTick();

    if (remaining === 0) {
      this.stop();
      this._completePhase();
    }
  }

  _completePhase() {
    const completedPhase = this.phase;

    if (completedPhase === "focus") {
      this.cycleCount++;
      this._store.statsToday.completedCount++;
      this._store.statsToday.focusTotalSec += this._store.settings.focusSec;
      this._store.saveStatsToday();
    }

    this._onPhaseComplete(completedPhase);
    this._advancePhase();
    this._onTick();
  }

  _advancePhase() {
    if (this.phase === "focus") {
      const isLong = this.cycleCount % this._store.settings.longBreakCycle === 0;
      this.phase = isLong ? "longBreak" : "shortBreak";
    } else {
      this.phase = "focus";
    }
    this.remainingSec = this._phaseDuration(this.phase);
  }

  _phaseDuration(phase) {
    const { focusSec, shortBreakSec, longBreakSec } = this._store.settings;
    const map = { focus: focusSec, shortBreak: shortBreakSec, longBreak: longBreakSec };
    return map[phase] !== undefined ? map[phase] : focusSec;
  }
}
