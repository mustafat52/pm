const { verifyToken, parseCookies } = require("../lib/session");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  // Must be signed in to the Project Manager to publish.
  const SESSION_SECRET = process.env.SESSION_SECRET;
  const cookies = parseCookies(req.headers.cookie);
  const authed = Boolean(SESSION_SECRET) && verifyToken(cookies.ha_session, SESSION_SECRET);
  if (!authed) {
    res.status(401).json({ ok: false, error: "Not signed in." });
    return;
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "yourname/hussaini-automations"
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
  const FILE_PATH = "public/projects.json";

  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    res.status(500).json({
      ok: false,
      error: "Server is missing GITHUB_TOKEN or GITHUB_REPO environment variables."
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
  const projects = body.projects;
  if (!Array.isArray(projects)) {
    res.status(400).json({ ok: false, error: "No projects array provided." });
    return;
  }

  const contentStr = JSON.stringify({ projects }, null, 2);
  const contentB64 = Buffer.from(contentStr, "utf8").toString("base64");
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "hussaini-automations-project-manager"
  };

  try {
    // GitHub requires the current file's sha to overwrite it. Look it up first.
    let sha;
    const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, {
      headers: ghHeaders
    });

    if (getRes.status === 200) {
      const getData = await getRes.json();
      sha = getData.sha;
    } else if (getRes.status !== 404) {
      const errText = await getRes.text();
      res.status(502).json({ ok: false, error: `GitHub error while reading the current file: ${errText}` });
      return;
    }

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Update projects.json via Project Manager",
        content: contentB64,
        branch: GITHUB_BRANCH,
        sha // omitted (undefined) is fine if the file doesn't exist yet
      })
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      res.status(502).json({ ok: false, error: `GitHub error while publishing: ${errText}` });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message || "Unexpected error contacting GitHub." });
  }
};