module.exports = (req, res) => {
  res.setHeader("Set-Cookie", "ha_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
  res.status(200).json({ ok: true });
};
