// routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Delete user (Admin only)
router.delete("/:id", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const result = await User.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
