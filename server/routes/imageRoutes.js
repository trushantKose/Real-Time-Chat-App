
const express = require("express");
const upload = require("../middleware/upload");
const { protectRoute } = require("../middleware/authMiddleware");

const router = express.Router();

// Handle image upload errors
const handleUpload = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  });
};

// Upload image
router.post("/upload", protectRoute, handleUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      image: imageUrl,
    });
  } catch (error) {
    console.error("Image Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
});

module.exports = router;
