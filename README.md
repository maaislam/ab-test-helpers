# ab-test-helpers

Small, dependency-free JavaScript helpers for the problems that actually break client side A/B tests: late-rendering elements, single-page-app route changes, flicker, React controlled inputs, accessible variants, exit-intent triggers, and frequency capping.

Every helper is a single standalone file. There is no build step and nothing to install. Copy the function into your variation code and go. They are vendor-neutral, so they work the same whether you run Optimizely, VWO, Convert, Adobe Target, or your own setup.

Each one is the cleaned-up version of a technique I use on real client builds. The full write-up behind most of them lives at [arafatcro.dev/guides](https://arafatcro.dev/guides).

## Helpers

The set splits into three jobs: **apply** the variation reliably, **trigger** it at the right moment, and **persist** so you do not nag the same visitor.

| Helper | Job | Does |
| --- | --- | --- |
| `waitFor` | Apply | wait for an element or a condition |
| `onRouteChange` | Apply | re-run on SPA navigation |
| `hideUntilApplied` | Apply | element-scoped anti-flicker |
| `setReactValue` | Apply | set a React controlled input |
| `trapFocus` | Apply | accessible variant focus trap |
| `exitIntent` | Trigger | fire when the visitor goes to leave |
| `onElementVisible` | Trigger | fire when an element scrolls into view |
| `cookies` | Persist | get / set / remove cookies |
| `frequencyCap` | Persist | show once per session or per N days |

---

## Apply

### `waitFor(target, { timeout, interval })`

Wait for an element to appear, or for any condition to become true, then resolve. Pass a **selector string** and it resolves with the element the moment it appears (watched with a `MutationObserver`, so no guessing a `setTimeout`). Pass a **predicate function** and it resolves with the return value once it is truthy (polled, since a condition can flip without a DOM change). Rejects on timeout. Exported as `waitForElement` too.

```js
await waitFor('[data-qa="add-to-basket"]');       // element
await waitFor(() => window.dataLayer?.length > 0); // condition
```

Full write-up: [How to wait for an element in an A/B test](https://arafatcro.dev/guides/waitforelement-ab-test)

### `onRouteChange(callback)` and `onUrlChange(callback)`

Re-fire your test logic when a single-page app navigates. `onRouteChange` patches History once (guarded so experiments cannot stack patches) and listens for `popstate`. `onUrlChange` is the fallback when you cannot touch History, inferring navigation from DOM changes.

```js
const run = () => { teardown(); /* re-apply the variation for this view */ };
run();              // first load
onRouteChange(run); // every navigation after
```

Full write-up: [Optimizely experiment not firing on SPA route changes](https://arafatcro.dev/guides/optimizely-experiment-not-firing-spa-route-changes)

### `hideUntilApplied(selector, { timeout })`

Element-scoped anti-flicker. Hide only the elements your variation changes, then reveal on apply with a failsafe timeout. Uses `visibility:hidden` so the element keeps its space and revealing it does not trigger a layout shift.

```js
const reveal = hideUntilApplied('[data-qa="hero-cta"]');
waitFor('[data-qa="hero-cta"]').then((el) => {
  el.textContent = 'Start free trial';
  reveal();
});
```

Full write-up: [How to stop A/B test flicker without killing LCP](https://arafatcro.dev/guides/stop-ab-test-flicker)

### `setReactValue(input, value)`

Set a React controlled input so React's own value tracker updates and `onChange` fires. A plain `input.value = x` is silently ignored by React. Goes through the native setter and fires both `input` and `change`.

```js
const qty = document.querySelector('input[name="quantity"]');
setReactValue(qty, '3'); // basket total and stock check now recalculate
```

Full write-up: [Changing a React controlled input in an A/B test](https://arafatcro.dev/guides/react-controlled-input-ab-test)

### `trapFocus(container)`

Trap keyboard focus inside one modal, drawer, or variant your variation opens, then restore focus when it closes. Inerts the sibling content, loops Tab, closes on Escape. Returns a `close` function.

```js
const close = trapFocus(document.querySelector('.my-variant-modal'));
closeButton.addEventListener('click', close);
```

Full write-up: [Building accessible A/B test variants](https://arafatcro.dev/guides/accessible-ab-test-variants)

---

## Trigger

### `exitIntent(callback, options)`

Fire when the visitor shows intent to leave. On desktop that is the cursor leaving through the top of the viewport. On touch, where the pointer never leaves, it falls back to a fast upward scroll and an optional inactivity timeout. Fires once by default and returns a teardown you can call to cancel early.

```js
const cancel = exitIntent(() => showOffer(), { idle: 15000 });
// cancel() if the visitor converts before the offer is relevant
```

Options: `sensitivity` (px from the top edge), `mobileScrollDelta` (px of upward flick), `idle` (ms of inactivity, 0 = off), `once`.

_Guide coming: exit-intent A/B tests._

### `onElementVisible(target, callback, options)`

Fire the first time an element scrolls into view, via `IntersectionObserver`. Good for impression tracking, lazy-applied variations, and scroll-triggered changes. Fires once per element by default; returns a teardown.

```js
onElementVisible('.pricing-table', () => track('pricing_seen'));
```

Options: `threshold`, `once`, `root`, `rootMargin`.

---

## Persist

### `cookies` — `getCookie`, `setCookie`, `removeCookie`

Minimal cookie read/write. Persist a variation assignment, remember that a visitor saw something, or read an existing cookie for targeting. `setCookie` defaults to 30 days, root path, `SameSite=Lax`, and `Secure` on https.

```js
setCookie('exp_hero', 'variant_b', { days: 14 });
if (getCookie('exp_hero') === 'variant_b') applyVariant();
```

### `frequencyCap` — `allowOncePerDays`, `allowOncePerSession`

Show a popup, banner, or one-time variation at most once per session or once per N days. Each returns `true` the first time and `false` after, so you gate inline. Uses Web Storage, so it is self-contained, and fails open if storage is blocked.

```js
exitIntent(() => {
  if (allowOncePerDays('exit_offer', 14)) showOffer();
});
```

_Guide coming: frequency capping for popups and banners._

---

## Usage

Each file in [`src`](src) exports its function as an ES module, so you can import it:

```js
import { waitFor } from './src/waitFor.js';
```

Or, for a variation editor that takes a plain script, copy the function body straight out of the file and drop the `export` line. There are no other dependencies, and the helpers do not import each other, so each one stands alone.

## Guides to write

The repo runs ahead of the writing. These helpers are the next write-ups planned for [arafatcro.dev/guides](https://arafatcro.dev/guides):

- `exit-intent-ab-test` — getting exit intent right on desktop and mobile
- `frequency-capping-popups` — show it once, not on every page

## About

Maintained by Arafat, a freelance CRO developer. I build and ship client side experiments and write up the hard parts at [arafatcro.dev](https://arafatcro.dev). If a helper here saved you time, the [guides](https://arafatcro.dev/guides) go deeper on the why.

## License

[MIT](LICENSE)
