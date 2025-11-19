const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

const db = require("./db");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());

// API Routes
const linksRouter = require("./routes/links");
app.use("/api/links", linksRouter);

// Health Check
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// Redirect handler
app.get("/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const result = await db.query(
      "SELECT url FROM tinyurl WHERE code=$1",
      [code]
    );

    if (!result.rows.length) {
      return res.status(404).send("Not found");
    }

    const url = result.rows[0].url;

    await db.query(
      `UPDATE tinyurl SET 
         total_clicks = total_clicks + 1, 
         last_clicked = NOW() 
       WHERE code=$1`,
      [code]
    );

    return res.redirect(302, url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
