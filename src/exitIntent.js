// exitIntent
// Fire a callback when the visitor shows intent to leave. On desktop that is the
// cursor leaving through the top of the viewport (heading for the tab bar, the
// close button, or the back arrow). Pointers do not leave the viewport on touch
// devices, so on mobile it falls back to a fast upward scroll (a flick toward the
// address bar or back gesture) and, optionally, an inactivity timeout.
//
// Fires once by default, then cleans itself up. Returns a teardown function so you
// can cancel it early, for example once the visitor converts.

function exitIntent(callback, {
  sensitivity = 20,        // px from the top edge that counts as "leaving"
  mobileScrollDelta = 60,  // px of fast upward scroll that counts as a flick
  idle = 0,                // ms of inactivity before firing (0 = off)
  once = true,
} = {}) {
  let fired = false;
  let lastY = window.scrollY;
  let idleTimer;

  function teardown() {
    document.removeEventListener("mouseout", onMouseOut);
    window.removeEventListener("scroll", onScroll);
    clearTimeout(idleTimer);
  }

  const trigger = () => {
    if (fired) return;
    if (once) fired = true;
    teardown();
    callback();
  };

  const onMouseOut = (e) => {
    // Real viewport exit only: cursor above the top edge, not into an iframe.
    if (!e.relatedTarget && e.clientY <= sensitivity) trigger();
  };

  const resetIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(trigger, idle);
  };

  const onScroll = () => {
    const y = window.scrollY;
    if (lastY - y > mobileScrollDelta) trigger(); // fast flick upward
    lastY = y;
    if (idle) resetIdle();
  };

  document.addEventListener("mouseout", onMouseOut);
  window.addEventListener("scroll", onScroll, { passive: true });
  if (idle) resetIdle();

  return teardown;
}

// usage
// const cancel = exitIntent(() => showOffer(), { idle: 15000 });
// converted.then(() => cancel()); // stop it if the visitor converts first

export { exitIntent };
