# 🧪 ab-test-helpers

![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![build](https://img.shields.io/badge/build-none-informational)
![vendor](https://img.shields.io/badge/vendor-neutral-blueviolet)
![license](https://img.shields.io/badge/license-MIT-black)

> Tiny, copy-paste JavaScript helpers for the problems that actually break client side A/B tests.

No build step. No install. No dependencies. Each helper is one standalone file you paste straight into your variation code. They are vendor-neutral, so they work the same on Optimizely, VWO, Convert, Adobe Target, or your own rig.

Every helper is the cleaned-up version of a technique used on real client builds. The full write-up behind most of them lives at 👉 [arafatcro.dev/guides](https://arafatcro.dev/guides).

## ✨ Why these exist

Client side tests live on top of pages you do not control. Elements render late, frameworks reclaim the DOM, SPAs never reload, and one thrown error can take down the host page. These helpers handle those sharp edges so your variation behaves, and so a mistake in your code can never break the client's site.

## 📋 The helpers at a glance

The set splits into three jobs: **apply** the variation reliably, **trigger** it at the right moment, and **persist** so you do not nag the same visitor.

| Helper | Job | What it does |
| --- | --- | --- |
| ⏳ `waitFor` | Apply | wait for an element or a condition |
| 🔗 `waitForAll` / `waitForAny` | Apply | wait for several things together |
| 🧭 `onRouteChange` | Apply | re-run on SPA navigation |
| 🙈 `hideUntilApplied` | Apply | element-scoped anti-flicker |
| ⚛️ `setReactValue` | Apply | set a React controlled input |
| ♿ `trapFocus` | Apply | accessible variant focus trap |
| 👋 `exitIntent` | Trigger | fire when the visitor goes to leave |
| 👀 `onElementVisible` | Trigger | fire when an element scrolls into view |
| 🍪 `cookies` | Persist | get / set / remove cookies |
| 🔁 `frequencyCap` | Persist | show once per session or per N days |

<br>

# 🎯 Apply

Get the variation onto the page reliably, without breaking the host site.

---

## ⏳ `waitFor(selectorOrPredicate, callback, timeoutMs?)`

Wait for a DOM element or an arbitrary condition, then fire `callback` once.

- 🔎 **Selector (string):** polls `document.querySelector` and fires `callback(element)` on the first match.
- 🧠 **Predicate (function):** polls the function and fires `callback(null)` when it returns truthy. Use this for non-DOM waits, like `() => typeof window.tealiumDataLayer === 'object'`.

Built for variant code: it polls every 50ms, gives up silently after `timeoutMs` (default 5000), and wraps the lookup, the predicate, AND the callback in try/catch, so nothing here can break the host page. Fires at most once. Returns a `cancel()`. Exported as `waitForElement` too.

```js
waitFor('[data-qa="add-to-basket"]', (el) => { /* apply the variation */ });
waitFor(() => window.dataLayer?.length > 0, () => track('ready'));

const cancel = waitFor('.late', apply); // call cancel() to stop early
```

📝 Full write-up: [How to wait for an element in an A/B test](https://arafatcro.dev/guides/waitforelement-ab-test)

---

## 🔗 `waitForAll(targets, callback, timeoutMs?)` and `waitForAny(targets, callback, timeoutMs?)`

Same poll loop, for a combination of things. `targets` is an array of selectors and/or predicates, mixed freely.

- ✅ **`waitForAll`** fires once **every** target is satisfied, and hands you the results in order (`callback(results)`), so you never re-query. `results[i]` is the matched element for a selector, or `true` for a predicate.
- 🔀 **`waitForAny`** fires as soon as the **first** target is satisfied, with `callback(result, index)`, so you know which one won. Handy when a layout can render one of several ways.

```js
// wait for all three, then use the elements directly
waitForAll(['.price', '.add-to-cart', () => window.app?.ready], ([price, cta]) => {
  // price and cta are the matched elements; app is ready
});

// whichever modal renders first
waitForAny(['.modal-v1', '.modal-v2'], (el, i) => trapFocus(el));
```

> 💡 You can always do a combination with a single `waitFor` predicate too (`() => a && b`). `waitForAll` just saves you the re-query by handing the elements back.

---

## 🧭 `onRouteChange(callback)` and `onUrlChange(callback)`

Re-fire your test logic when a single-page app navigates. `onRouteChange` patches History once (guarded so experiments cannot stack patches) and listens for `popstate`. `onUrlChange` is the fallback when you cannot touch History, inferring navigation from DOM changes.

```js
const run = () => { teardown(); /* re-apply the variation for this view */ };
run();              // first load
onRouteChange(run); // every navigation after
```

📝 Full write-up: [Optimizely experiment not firing on SPA route changes](https://arafatcro.dev/guides/optimizely-experiment-not-firing-spa-route-changes)

---

## 🙈 `hideUntilApplied(selector, { timeout })`

Element-scoped anti-flicker. Hide only the elements your variation changes, then reveal on apply with a failsafe timeout. Uses `visibility:hidden` so the element keeps its space and revealing it does not trigger a layout shift.

```js
const reveal = hideUntilApplied('[data-qa="hero-cta"]');
waitFor('[data-qa="hero-cta"]', (el) => {
  el.textContent = 'Start free trial';
  reveal();
});
```

📝 Full write-up: [How to stop A/B test flicker without killing LCP](https://arafatcro.dev/guides/stop-ab-test-flicker)

---

## ⚛️ `setReactValue(input, value)`

Set a React controlled input so React's own value tracker updates and `onChange` fires. A plain `input.value = x` is silently ignored by React. Goes through the native setter and fires both `input` and `change`.

```js
const qty = document.querySelector('input[name="quantity"]');
setReactValue(qty, '3'); // basket total and stock check now recalculate
```

📝 Full write-up: [Changing a React controlled input in an A/B test](https://arafatcro.dev/guides/react-controlled-input-ab-test)

---

## ♿ `trapFocus(container)`

Trap keyboard focus inside one modal, drawer, or variant your variation opens, then restore focus when it closes. Inerts the sibling content, loops Tab, closes on Escape. Returns a `close` function.

```js
const close = trapFocus(document.querySelector('.my-variant-modal'));
closeButton.addEventListener('click', close);
```

📝 Full write-up: [Building accessible A/B test variants](https://arafatcro.dev/guides/accessible-ab-test-variants)

<br>

# ⚡ Trigger

Fire the variation at the right moment.

---

## 👋 `exitIntent(callback, options)`

Fire when the visitor shows intent to leave. On desktop that is the cursor leaving through the top of the viewport. On touch, where the pointer never leaves, it falls back to a fast upward scroll and an optional inactivity timeout. Fires once by default and returns a teardown you can call to cancel early.

```js
const cancel = exitIntent(() => showOffer(), { idle: 15000 });
// cancel() if the visitor converts before the offer is relevant
```

⚙️ Options: `sensitivity` (px from the top edge), `mobileScrollDelta` (px of upward flick), `idle` (ms of inactivity, 0 = off), `once`.

🗺️ _Guide coming: exit-intent A/B tests._

---

## 👀 `onElementVisible(target, callback, options)`

Fire the first time an element scrolls into view, via `IntersectionObserver`. Good for impression tracking, lazy-applied variations, and scroll-triggered changes. Fires once per element by default; returns a teardown.

```js
onElementVisible('.pricing-table', () => track('pricing_seen'));
```

⚙️ Options: `threshold`, `once`, `root`, `rootMargin`.

<br>

# 🍪 Persist

Remember what a visitor has already seen, so you do not nag them.

---

## 🍪 `cookies`: `getCookie`, `setCookie`, `removeCookie`

Minimal cookie read/write. Persist a variation assignment, remember that a visitor saw something, or read an existing cookie for targeting. `setCookie` defaults to 30 days, root path, `SameSite=Lax`, and `Secure` on https.

```js
setCookie('exp_hero', 'variant_b', { days: 14 });
if (getCookie('exp_hero') === 'variant_b') applyVariant();
```

---

## 🔁 `frequencyCap`: `allowOncePerDays`, `allowOncePerSession`

Show a popup, banner, or one-time variation at most once per session or once per N days. Each returns `true` the first time and `false` after, so you gate inline. Uses Web Storage, so it is self-contained, and fails open if storage is blocked.

```js
exitIntent(() => {
  if (allowOncePerDays('exit_offer', 14)) showOffer();
});
```

🗺️ _Guide coming: frequency capping for popups and banners._

<br>

# 📦 Usage

Each file in [`src`](src) exports its function as an ES module, so you can import it:

```js
import { waitFor, waitForAll } from './src/waitFor.js';
import { exitIntent } from './src/exitIntent.js';
```

Or, for a variation editor that takes a plain script, copy the function body straight out of the file and drop the `export` line. There are no other dependencies, and the helpers do not import each other, so every function stands alone. ✂️

# 🗺️ Guides to write

The repo runs ahead of the writing. These helpers are the next write-ups planned for [arafatcro.dev/guides](https://arafatcro.dev/guides):

- 👋 `exit-intent-ab-test` &rarr; getting exit intent right on desktop and mobile
- 🔁 `frequency-capping-popups` &rarr; show it once, not on every page

# 👋 About

Maintained by Arafat, a freelance CRO developer. I build and ship client side experiments and write up the hard parts at [arafatcro.dev](https://arafatcro.dev). If a helper here saved you time, the [guides](https://arafatcro.dev/guides) go deeper on the why.

# 📄 License

[MIT](LICENSE)
