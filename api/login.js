const crypto = require("crypto");
const { createToken } = require("../lib/session");

const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;

module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const SESSION_SECRET = process.env.SESSION_SECRET;

  if (!ADMIN_PASSWORD || !SESSION_SECRET) {
    res.status(500).json({
      ok: false,
      error: "Server is missing ADMIN_PASSWORD or SESSION_SECRET environment variables."
    });
    return;
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch (e) {
      body = {};
    }
  }
  const password = String((body && body.password) || "");

  const a = Buffer.from(password);
  const b = Buffer.from(String(ADMIN_PASSWORD));
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) {
    res.status(401).json({ ok: false, error: "Incorrect password." });
    return;
  }

  const token = createToken(SESSION_SECRET, SEVEN_DAYS_MS);
  const isHttps = String(req.headers["x-forwarded-proto"] || "").includes("https");

  const cookie = [
    `ha_session=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${Math.floor(SEVEN_DAYS_MS / 1000)}`,
    isHttps ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ ok: true });
};
