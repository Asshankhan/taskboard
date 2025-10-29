const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");

// Middleware
function ensureAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Dashboard-like task page
router.get("/", ensureAuth, async (req, res) => {
  const user = req.session.user;
  const filter = user.role === "admin" ? {} : { assignedTo: user.id };
  const tasks = await Task.find(filter).populate("assignedTo", "name");
  const employees = await User.find({ role: "employee" });
  res.render("tasks", { user, tasks, employees });
});

// Create new task
router.post("/", ensureAuth, async (req, res) => {
  const user = req.session.user;
  const { title, description, dueDate, assignedTo } = req.body;
  const task = new Task({
    title,
    description,
    dueDate,
    createdBy: user.id,
    assignedTo: user.role === "admin" ? assignedTo : user.id,
  });
  await task.save();
  res.redirect("/tasks");
});

// Update task status (AJAX)
router.post("/:id/status", ensureAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, msg: "Task not found" });

    const user = req.session.user;
    if (user.role !== "admin" && task.assignedTo.toString() !== user.id)
      return res.status(403).json({ success: false, msg: "No permission" });

    task.status = status;
    await task.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error updating task" });
  }
});

// Delete task (AJAX)
router.delete("/:id", ensureAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, msg: "Task not found" });
    await task.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Error deleting task" });
  }
});

module.exports = router;
