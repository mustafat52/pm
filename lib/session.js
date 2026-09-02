const crypto = require("crypto");

function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payloadB64, secret) {
  return base64url(crypto.createHmac("sha256", secret).update(payloadB64).digest());
}

/**
 * Creates a signed, expiring session token: base64url(payload) + "." + signature
 */
function createToken(secret, ttlMs) {
  const payload = JSON.stringify({ exp: Date.now() + ttlMs });
  const payloadB64 = base64url(Buffer.from(payload));
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies a token's signature and expiry. Returns true/false.
 */
function verifyToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;

  const expected = sign(payloadB64, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    return typeof payload.exp === "number" && Date.now() < payload.exp;
  } catch (e) {
    return false;
  }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch (e) {
      out[k] = v;
    }
  });
  return out;
}

module.exports = { createToken, verifyToken, parseCookies };
