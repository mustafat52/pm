const fs = require("fs");
const path = require("path");
const { verifyToken, parseCookies } = require("../lib/session");

const ADMIN_HTML_PATH = path.join(__dirname, "..", "lib", "admin-template.html");
const LOGIN_HTML_PATH = path.join(__dirname, "..", "lib", "login-template.html");

module.exports = (req, res) => {
  const SESSION_SECRET = process.env.SESSION_SECRET;
  const cookies = parseCookies(req.headers.cookie);
  const authed = Boolean(SESSION_SECRET) && verifyToken(cookies.ha_session, SESSION_SECRET);

  const filePath = authed ? ADMIN_HTML_PATH : LOGIN_HTML_PATH;
  const html = fs.readFileSync(filePath, "utf8");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(html);
};
