
const express = require("express");

const router = express.Router();

const { getUsers } = require("../controllers/userController");

const {protectRoute} = require("../middleware/authMiddleware");

// Protected route
router.get("/",protectRoute, getUsers);

module.exports = router;
