// frequencyCap
// "Show this at most once per session" or "once per N days." Gate a popup, banner,
// or any one-time variation so you do not nag the same visitor on every page or
// every visit. Pairs naturally with exitIntent.
//
// Each function returns true the first time (and records it), then false until the
// window passes, so you can gate inline:  if (allowOncePerDays('offer')) show();
//
// Self-contained: uses Web Storage, no cookie helper needed. If storage is blocked
// (private mode, cookies-off), it fails open and returns true, so a visitor is
// never trapped unable to see anything. Swap in the cookies helper if you need the
// cap to be server-readable.

function allowOncePerDays(key, days = 7) {
  const name = `fc_${key}`;
  try {
    const until = Number(localStorage.getItem(name) || 0);
    if (Date.now() < until) return false;
    localStorage.setItem(name, String(Date.now() + days * 864e5)); // 864e5 = ms/day
    return true;
  } catch (e) {
    return true; // storage blocked: do not suppress
  }
}

function allowOncePerSession(key) {
  const name = `fc_${key}`;
  try {
    if (sessionStorage.getItem(name)) return false;
    sessionStorage.setItem(name, "1");
    return true;
  } catch (e) {
    return true; // storage blocked: do not suppress
  }
}

// usage
// exitIntent(() => { if (allowOncePerDays('exit_offer', 14)) showOffer(); });

export { allowOncePerDays, allowOncePerSession };
