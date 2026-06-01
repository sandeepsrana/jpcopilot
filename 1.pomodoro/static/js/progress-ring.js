"use strict";

/**
 * ProgressRing
 *
 * Animates an SVG circle element as a circular progress indicator
 * using stroke-dasharray / stroke-dashoffset.
 */
class ProgressRing {
  /**
   * @param {SVGCircleElement} circleElement – the foreground circle element
   */
  constructor(circleElement) {
    this._circle = circleElement;
    const r = parseFloat(circleElement.getAttribute("r"));
    this._circumference = 2 * Math.PI * r;
    this._circle.style.strokeDasharray = String(this._circumference);
    this._circle.style.strokeDashoffset = String(0);
  }

  /**
   * Update the ring fill.
   * @param {number} fraction – 1 = full ring (timer just started), 0 = empty ring
   */
  setProgress(fraction) {
    const clamped = Math.max(0, Math.min(1, fraction));
    this._circle.style.strokeDashoffset = String(this._circumference * (1 - clamped));
  }
}
