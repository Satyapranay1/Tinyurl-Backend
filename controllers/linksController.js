const db = require("../db");
const { CODE_REGEX } = require("../middleware/validateUrl");

// Generate fallback code (6 characters)
function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new short link
exports.createLink = async (req, res) => {
  const { url, code: customCode } = req.body;
  const code = customCode || generateCode();

  if (!CODE_REGEX.test(code)) {
    return res.status(400).json({ error: "Code must match [A-Za-z0-9]{6,8}" });
  }

  try {
    const exists = await db.query(
      "SELECT code FROM tinyurl WHERE code = $1",
      [code]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Code already exists" });
    }

    const result = await db.query(
      `INSERT INTO tinyurl (code, url)
       VALUES ($1, $2)
       RETURNING code, url, total_clicks, last_clicked, created_at`,
      [code, url]
    );

    const row = result.rows[0];

    res.status(201).json({
      ...row,
      short_url: `${process.env.BASE_URL}/${row.code}`,
    });

  } catch (err) {
    console.error("Create Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// List all links
exports.listLinks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT code, url, total_clicks, last_clicked, created_at
       FROM tinyurl
       ORDER BY created_at DESC`
    );

    const data = result.rows.map(row => ({
      ...row,
      short_url: `${process.env.BASE_URL}/${row.code}`,
    }));

    res.json(data);

  } catch (err) {
    console.error("List Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get single link details by code
exports.getLink = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await db.query(
      `SELECT code, url, total_clicks, last_clicked, created_at
       FROM tinyurl
       WHERE code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    const row = result.rows[0];

    res.json({
      ...row,
      short_url: `${process.env.BASE_URL}/${row.code}`,
    });

  } catch (err) {
    console.error("Get Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a link
exports.deleteLink = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM tinyurl WHERE code = $1 RETURNING code",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ ok: true });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Redirect route (NEW)
exports.redirect = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await db.query(
      `SELECT url FROM tinyurl WHERE code = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Not Found");
    }

    // Update click count + timestamp
    await db.query(
      `UPDATE tinyurl 
       SET total_clicks = total_clicks + 1, last_clicked = NOW()
       WHERE code = $1`,
      [code]
    );

    res.redirect(result.rows[0].url);

  } catch (err) {
    console.error("Redirect Error:", err);
    res.status(500).send("Server error");
  }
};
