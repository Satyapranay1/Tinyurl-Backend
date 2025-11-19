const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateCreateLink(req, res, next) {
  const { url, code } = req.body;

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  if (code && !CODE_REGEX.test(code)) {
    return res.status(400).json({ error: "Code must match [A-Za-z0-9]{6,8}" });
  }

  next();
}

module.exports = { validateCreateLink, CODE_REGEX };
