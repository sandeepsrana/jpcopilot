"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // ── Bootstrap ───────────────────────────────────────────────────────────────
  const store = new StateStore();
  const gamification = new Gamification(store);
  const ring = new ProgressRing(document.getElementById("progress-ring-fg"));

  const engine = new TimerEngine(
    store,
    () => ui.update(),
    (completedPhase) => {
      if (completedPhase === "focus") {
        const { xpGained, newBadges } = gamification.onFocusComplete();
        ui.fullUpdate();
        ui.showNotification(`✅ 作業完了！ +${xpGained} XP`);

        // Show badge notifications sequentially after the XP toast
        newBadges.forEach((badge, i) => {
          setTimeout(
            () => ui.showNotification(`🏅 バッジ獲得: ${badge.label} ${badge.emoji}`),
            3400 + i * 3400
          );
        });
      } else {
        ui.fullUpdate();
        ui.showNotification(completedPhase === "longBreak" ? "☕ 長休憩終了！作業を再開しましょう" : "⏰ 休憩終了！作業を再開しましょう");
      }
    }
  );

  // UIController binds button events internally
  const ui = new UIController(engine, ring, gamification);

  // ── Initial render ──────────────────────────────────────────────────────────
  ui.fullUpdate();
});
