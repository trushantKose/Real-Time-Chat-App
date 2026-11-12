
const express = require("express");
const router = express.Router();

const {
  sendAIMessage,
} = require("../controllers/aiController");

const {
  protectRoute,
} = require("../middleware/authMiddleware");

// Protected AI routes
router.post("/message", protectRoute, sendAIMessage);

module.exports = router;
