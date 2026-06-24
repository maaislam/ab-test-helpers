// setReactValue
// Set a React controlled input so React's own value tracker updates and its
// onChange fires. A plain `input.value = x` moves the text on screen but React
// never sees it, so anything that keys off the value (totals, validation, stock
// checks) ignores the change. Going through the native setter and then firing
// both input and change events fixes that.
//
// This is for <input>. A <textarea> or <select> needs its own prototype:
// HTMLTextAreaElement.prototype or HTMLSelectElement.prototype. Checkboxes and
// radios track "checked", not "value", so they need their own path.
//
// Full write-up: https://arafatcro.dev/guides/react-controlled-input-ab-test

function setReactValue(input, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;
  nativeSetter.call(input, value);
  // Fire both: some host handlers listen for input, others only for change.
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

// usage
// const qty = document.querySelector('input[name="quantity"]');
// setReactValue(qty, '3'); // basket total and stock check now recalculate

export { setReactValue };
