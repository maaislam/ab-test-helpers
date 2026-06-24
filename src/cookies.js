// cookies
// Minimal cookie get / set / remove. Use it to persist a variation assignment,
// remember that a visitor saw something, or read an existing cookie for targeting.
//
// setCookie defaults to a 30 day expiry, root path, SameSite=Lax, and Secure on
// https. Pass days: 0 for a session cookie (cleared when the browser closes).

function getCookie(name) {
  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1");
  const match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, {
  days = 30,
  path = "/",
  sameSite = "Lax",
  secure = location.protocol === "https:",
} = {}) {
  let cookie = `${name}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 864e5); // 864e5 = ms per day
    cookie += `; expires=${date.toUTCString()}`;
  }
  if (secure) cookie += "; Secure";
  document.cookie = cookie;
}

function removeCookie(name, { path = "/" } = {}) {
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// usage
// setCookie('exp_hero', 'variant_b', { days: 14 });
// if (getCookie('exp_hero') === 'variant_b') applyVariant();

export { getCookie, setCookie, removeCookie };
