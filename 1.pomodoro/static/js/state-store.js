"use strict";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  focusSec: 25 * 60,
  shortBreakSec: 5 * 60,
  longBreakSec: 15 * 60,
  longBreakCycle: 4,
};

function _defaultStatsToday() {
  return { dateKey: _todayKey(), completedCount: 0, focusTotalSec: 0 };
}

function _defaultGamification() {
  return {
    totalXP: 0,
    streakDays: 0,
    lastStreakDate: null,
    weeklyCompletions: {},
    totalCompletions: 0,
    unlockedBadges: [],
  };
}

// ─── StateStore ───────────────────────────────────────────────────────────────

class StateStore {
  constructor() {
    this.settings = this._load("pm_settings", { ...DEFAULT_SETTINGS });
    this.statsToday = this._loadStatsToday();
    this.gamification = this._load("pm_gamification", _defaultGamification());
  }

  /** Load a JSON value from localStorage, merging with defaultValue. */
  _load(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultValue;
      return Object.assign({}, defaultValue, JSON.parse(raw));
    } catch {
      return defaultValue;
    }
  }

  /**
   * Load today's stats. If the stored dateKey differs from today,
   * reset to a fresh object (daily rollover).
   */
  _loadStatsToday() {
    const def = _defaultStatsToday();
    try {
      const raw = localStorage.getItem("pm_stats_today");
      if (!raw) return def;
      const saved = JSON.parse(raw);
      if (saved.dateKey !== _todayKey()) {
        this._save("pm_stats_today", def);
        return def;
      }
      return Object.assign({}, def, saved);
    } catch {
      return def;
    }
  }

  _save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage save failed:", e);
    }
  }

  saveSettings() {
    this._save("pm_settings", this.settings);
  }

  saveStatsToday() {
    this._save("pm_stats_today", this.statsToday);
  }

  saveGamification() {
    this._save("pm_gamification", this.gamification);
  }
}
