// waitFor
// Wait for either a CSS selector to appear OR an arbitrary condition to become
// truthy, then resolve. Rejects after `timeout` ms so a missing target fails
// quietly rather than hanging.
//
//   - Pass a selector string: resolves with the matching element the moment it
//     appears, watched with a MutationObserver (fires only on real DOM changes,
//     so it is cheaper and more responsive than polling on a fixed interval).
//   - Pass a predicate function: resolves with its return value once it is
//     truthy. A condition like `window.cart?.ready` can flip without any DOM
//     mutation, so this path polls on a short interval.
//
// `waitForElement` is exported as an alias, for the selector-only history and
// because it is the term people search.
//
// Full write-up: https://arafatcro.dev/guides/waitforelement-ab-test

function waitFor(target, { timeout = 5000, interval = 100 } = {}) {
  const check =
    typeof target === "function" ? target : () => document.querySelector(target);

  return new Promise((resolve, reject) => {
    const hit = check();
    if (hit) return resolve(hit);

    let observer;
    let poll;
    const stop = () => {
      if (observer) observer.disconnect();
      if (poll) clearInterval(poll);
      clearTimeout(timer);
    };
    const tick = () => {
      const result = check();
      if (result) { stop(); resolve(result); }
    };

    if (typeof target === "function") {
      // A condition can become true without a DOM change, so poll.
      poll = setInterval(tick, interval);
    } else {
      // An element appears via a DOM mutation, so observe: instant and cheap.
      observer = new MutationObserver(tick);
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    const timer = setTimeout(() => {
      stop();
      reject(new Error(`waitFor timed out: ${typeof target === "function" ? "condition" : target}`));
    }, timeout);
  });
}

// usage
// await waitFor('[data-qa="add-to-basket"]');          // element
// await waitFor(() => window.dataLayer?.length > 0);    // condition
// waitFor('.cta', { timeout: 3000 }).then(apply).catch(() => { /* never appeared */ });

export { waitFor, waitFor as waitForElement };
