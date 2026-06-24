// trapFocus
// Trap keyboard focus inside one modal, drawer, or variant your variation opens,
// then restore focus to wherever it was when the layer closes. Inerts the
// sibling content so screen readers and Tab cannot reach the page behind it,
// loops Tab within the layer, and closes on Escape.
//
// Returns a `close` function. Call it to tear the layer down and restore focus.
// This traps ONE layer. When you stack layers (a drawer with a modal on top),
// inert each new layer relative to the layer above it, not the body.
//
// Full write-up: https://arafatcro.dev/guides/accessible-ab-test-variants

function trapFocus(container) {
  const previouslyFocused = document.activeElement;
  container.setAttribute("tabindex", "-1"); // so .focus() works even with no children

  // Re-query each call: only visible stops, and never stale as content changes.
  const stops = () =>
    [...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter((el) => el.offsetParent !== null);

  // Inert the siblings of THIS layer.
  const inerted = [...document.body.children].filter(
    (el) => el !== container && !el.contains(container)
  );
  inerted.forEach((el) => el.setAttribute("inert", ""));
  (stops()[0] || container).focus();

  const close = () => {
    container.removeEventListener("keydown", onKeydown);
    inerted.forEach((el) => el.removeAttribute("inert"));
    previouslyFocused?.focus();
  };

  // Listen on the container, not document, and stop the event there, so Escape
  // closes only this layer instead of collapsing the whole stack beneath it.
  const onKeydown = (e) => {
    if (e.key === "Escape") { e.stopPropagation(); return close(); }
    if (e.key !== "Tab") return;
    const items = stops();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener("keydown", onKeydown);

  return close;
}

// usage
// const close = trapFocus(document.querySelector('.my-variant-modal'));
// closeButton.addEventListener('click', close);

export { trapFocus };
