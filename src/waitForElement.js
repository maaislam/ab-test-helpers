// waitForElement
// Resolve the moment a (possibly late-rendering) element appears, instead of
// guessing a setTimeout. Rejects after `timeout` ms so a missing element fails
// quietly rather than hanging. Disconnects the observer as soon as it is done.
//
// Full write-up: https://arafatcro.dev/guides/waitforelement-ab-test

function waitForElement(selector, { timeout = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    const found = document.querySelector(selector);
    if (found) return resolve(found);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`waitForElement timed out: ${selector}`));
    }, timeout);
  });
}

// usage
// waitForElement('[data-qa="add-to-basket"]')
//   .then((el) => { /* apply the variation */ })
//   .catch(() => { /* element never appeared, fail quietly */ });

export { waitForElement };
