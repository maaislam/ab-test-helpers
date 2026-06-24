# ab-test-helpers

Small, dependency-free JavaScript helpers for the problems that actually break client side A/B tests: late-rendering elements, single-page-app route changes, flicker, React controlled inputs, and accessible variants.

Every helper is a single standalone file. There is no build step and nothing to install. Copy the function into your variation code and go. They are vendor-neutral, so they work the same whether you run Optimizely, VWO, Convert, Adobe Target, or your own setup.

Each one is the cleaned-up version of a technique I use on real client builds. The full write-up behind every helper lives at [arafatcro.dev/guides](https://arafatcro.dev/guides).

## Helpers

### `waitForElement(selector, { timeout })`

Resolve the moment an element appears, instead of guessing a `setTimeout`. Backed by a `MutationObserver` that disconnects as soon as it finds the element or the timeout fires. This is the one to reach for when a tool's editor cannot target an element that renders late.

```js
waitForElement('[data-qa="add-to-basket"]')
  .then((el) => { /* apply the variation */ })
  .catch(() => { /* element never appeared, fail quietly */ });
```

Full write-up: [How to wait for an element in an A/B test](https://arafatcro.dev/guides/waitforelement-ab-test)

### `onRouteChange(callback)` and `onUrlChange(callback)`

Re-fire your test logic when a single-page app navigates. Client side tools run their snippet once on the first load, so on an SPA the variation never re-applies after the user moves between views. `onRouteChange` patches History once (guarded so experiments cannot stack patches) and listens for `popstate`. `onUrlChange` is the fallback when you cannot touch History, inferring navigation from DOM changes.

```js
const run = () => { teardown(); /* re-apply the variation for this view */ };
run();              // first load
onRouteChange(run); // every navigation after
```

Full write-up: [Optimizely experiment not firing on SPA route changes](https://arafatcro.dev/guides/optimizely-experiment-not-firing-spa-route-changes)

### `hideUntilApplied(selector, { timeout })`

Element-scoped anti-flicker. Hide only the elements your variation changes, never the whole page, then reveal them the moment you apply the change. A failsafe timeout reveals them anyway if the test is slow or breaks. It uses `visibility:hidden` so the element keeps its space and revealing it does not trigger a layout shift.

```js
const reveal = hideUntilApplied('[data-qa="hero-cta"]');
waitForElement('[data-qa="hero-cta"]').then((el) => {
  el.textContent = 'Start free trial';
  reveal();
});
```

Full write-up: [How to stop A/B test flicker without killing LCP](https://arafatcro.dev/guides/stop-ab-test-flicker)

### `setReactValue(input, value)`

Set a React controlled input so React's own value tracker updates and `onChange` fires. A plain `input.value = x` moves the text on screen but React never sees it, so totals, validation, and stock checks ignore it. This goes through the native setter and fires both `input` and `change`.

```js
const qty = document.querySelector('input[name="quantity"]');
setReactValue(qty, '3'); // basket total and stock check now recalculate
```

Full write-up: [Changing a React controlled input in an A/B test](https://arafatcro.dev/guides/react-controlled-input-ab-test)

### `trapFocus(container)`

Trap keyboard focus inside one modal, drawer, or variant your variation opens, then restore focus when it closes. It inerts the sibling content, loops Tab within the layer, and closes on Escape. Returns a `close` function.

```js
const close = trapFocus(document.querySelector('.my-variant-modal'));
closeButton.addEventListener('click', close);
```

Full write-up: [Building accessible A/B test variants](https://arafatcro.dev/guides/accessible-ab-test-variants)

## Usage

Each file in [`src`](src) exports its function as an ES module, so you can import it:

```js
import { waitForElement } from './src/waitForElement.js';
```

Or, for a variation editor that takes a plain script, copy the function body straight out of the file and drop the `export` line. There are no other dependencies.

## About

Maintained by Arafat, a freelance CRO developer. I build and ship client side experiments and write up the hard parts at [arafatcro.dev](https://arafatcro.dev). If a helper here saved you time, the [guides](https://arafatcro.dev/guides) go deeper on the why.

## License

[MIT](LICENSE)
