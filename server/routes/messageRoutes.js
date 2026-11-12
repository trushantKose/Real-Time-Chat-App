
const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
} = require("../controllers/messageController");

const { protectRoute } = require("../middleware/authMiddleware");

// Protected message routes
router.post("/", protectRoute, sendMessage);
router.get("/", protectRoute, getMessages);

module.exports = router;
