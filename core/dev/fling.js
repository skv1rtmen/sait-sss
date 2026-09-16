/* helper: trackpad-like fling dispatched in-page (Playwright's mouse.wheel is ~90 ms apart, real trackpads ~8-16 ms) */
module.exports = (page, total, ms, dir=1) => page.evaluate(([total, ms, dir]) => new Promise(res => {
  const n = Math.max(4, Math.round(ms / 12)); let i = 0; const per = total / n;
  const tick = () => { const k = i / n; const d = per * (1.6 - 1.2 * k); /* decaying like inertia */
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: dir * Math.round(d), deltaMode: 0, bubbles: true, cancelable: true }));
    if (++i < n) setTimeout(tick, 12); else res(); };
  tick();
}), [total, ms, dir]);
