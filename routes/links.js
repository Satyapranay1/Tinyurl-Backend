const express = require("express");
const router = express.Router();
const controller = require("../controllers/linksController");
const { validateCreateLink } = require("../middleware/validateUrl");

router.post("/", validateCreateLink, controller.createLink);
router.get("/", controller.listLinks);
router.get("/:code", controller.getLink);
router.delete("/:code", controller.deleteLink);

module.exports = router;
