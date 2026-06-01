"use strict";

// ─── Badge definitions ────────────────────────────────────────────────────────

const BADGES = [
  {
    id: "first_step",
    label: "初めての一歩",
    emoji: "🎯",
    desc: "初めてのポモドーロを完了",
    check: (g, _s) => g.totalCompletions >= 1,
  },
  {
    id: "streak_3",
    label: "3日連続",
    emoji: "🔥",
    desc: "3日連続でポモドーロを完了",
    check: (g, _s) => g.streakDays >= 3,
  },
  {
    id: "streak_7",
    label: "週間戦士",
    emoji: "⚡",
    desc: "7日連続でポモドーロを完了",
    check: (g, _s) => g.streakDays >= 7,
  },
  {
    id: "daily_5",
    label: "集中の達人",
    emoji: "💪",
    desc: "1日で5回ポモドーロを完了",
    check: (_g, s) => s.completedCount >= 5,
  },
  {
    id: "weekly_10",
    label: "今週10回",
    emoji: "🏆",
    desc: "今週10回ポモドーロを完了",
    check: (g, _s) => _weeklyTotal(g) >= 10,
  },
  {
    id: "total_100",
    label: "100回達成",
    emoji: "🌟",
    desc: "通算100回ポモドーロを完了",
    check: (g, _s) => g.totalCompletions >= 100,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sum completions over the last 7 days (including today).
 * @param {object} g – gamification state
 * @returns {number}
 */
function _weeklyTotal(g) {
  let total = 0;
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    total += g.weeklyCompletions[d.toISOString().slice(0, 10)] || 0;
  }
  return total;
}

/**
 * Compute level and XP progress from total accumulated XP.
 * Level N requires N * 100 XP to advance.
 *
 * @param {number} totalXP
 * @returns {{ level: number, xpInLevel: number, xpNeeded: number }}
 */
function computeLevel(totalXP) {
  let level = 1;
  let xp = totalXP;
  while (xp >= level * 100) {
    xp -= level * 100;
    level++;
  }
  return { level, xpInLevel: xp, xpNeeded: level * 100 };
}

// ─── Gamification ─────────────────────────────────────────────────────────────

class Gamification {
  /**
   * @param {StateStore} store
   */
  constructor(store) {
    this._store = store;
  }

  /**
   * Call when a focus phase completes. Updates XP, streak, weekly log and
   * unlocks any newly earned badges.
   *
   * @returns {{ xpGained: number, newBadges: object[] }}
   */
  onFocusComplete() {
    const g = this._store.gamification;
    const s = this._store.statsToday;

    const xpGained = 25;
    g.totalXP += xpGained;
    g.totalCompletions++;

    this._updateStreak();
    this._recordCompletion();
    this._pruneOldData();

    const newBadges = this._checkNewBadges(s);
    this._store.saveGamification();

    return { xpGained, newBadges };
  }

  /** Compute current level info from persisted total XP. */
  getLevelInfo() {
    return computeLevel(this._store.gamification.totalXP);
  }

  /** Return current streak day count. */
  getStreakDays() {
    return this._store.gamification.streakDays || 0;
  }

  /**
   * Return the last 7 days' completion counts ordered oldest → newest.
   * @returns {{ date: string, count: number }[]}
   */
  getWeeklyData() {
    const g = this._store.gamification;
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: g.weeklyCompletions[key] || 0 });
    }
    return result;
  }

  /**
   * Return all badge definitions with an `unlocked` boolean.
   * @returns {object[]}
   */
  getAllBadges() {
    const unlocked = this._store.gamification.unlockedBadges;
    return BADGES.map(b => Object.assign({}, b, { unlocked: unlocked.includes(b.id) }));
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  _updateStreak() {
    const g = this._store.gamification;
    const today = new Date().toISOString().slice(0, 10);

    if (!g.lastStreakDate) {
      g.streakDays = 1;
    } else {
      const diffDays = Math.round(
        (new Date(today) - new Date(g.lastStreakDate)) / 86400000
      );
      if (diffDays === 0) {
        // Already recorded today – streak unchanged
      } else if (diffDays === 1) {
        g.streakDays = (g.streakDays || 0) + 1;
      } else {
        g.streakDays = 1;
      }
    }
    g.lastStreakDate = today;
  }

  _recordCompletion() {
    const g = this._store.gamification;
    const today = new Date().toISOString().slice(0, 10);
    g.weeklyCompletions[today] = (g.weeklyCompletions[today] || 0) + 1;
  }

  /** Remove daily completion entries older than 30 days to keep storage lean. */
  _pruneOldData() {
    const g = this._store.gamification;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    for (const key of Object.keys(g.weeklyCompletions)) {
      if (new Date(key) < cutoff) {
        delete g.weeklyCompletions[key];
      }
    }
  }

  _checkNewBadges(statsToday) {
    const g = this._store.gamification;
    const newBadges = [];
    for (const badge of BADGES) {
      if (!g.unlockedBadges.includes(badge.id) && badge.check(g, statsToday)) {
        g.unlockedBadges.push(badge.id);
        newBadges.push(badge);
      }
    }
    return newBadges;
  }
}
