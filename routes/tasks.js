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

// Update progress (employee only)
router.post('/update-progress/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo');

    if (!task) {
      console.log("⚠️ Task not found:", req.params.id);
      return res.status(404).send("Task not found");
    }

    const userId = req.session.user?.id?.toString();
    console.log('req.session.user: ', req.session.user);
    console.log('userId: ', userId);
    if (!userId) {
      console.log("⚠️ No user session found");
      return res.status(401).send("User not logged in");
    }

    // Get the assigned user ID properly
    const assignedToId = task.assignedTo?._id
      ? task.assignedTo._id.toString()
      : task.assignedTo?.toString?.();

    if (!assignedToId) {
      console.log("⚠️ Task has no assigned user:", task._id);
      return res.status(400).send("Task is not assigned to anyone");
    }

    // Authorization check
    if (assignedToId !== userId) {
      console.log(`🚫 Unauthorized update: user=${userId}, assignedTo=${assignedToId}`);
      return res.status(403).send("Unauthorized");
    }

    // Safely update progress
    const progressValue = Number(req.body.progress) || 0;
    task.progress = progressValue;

    if (progressValue >= 100) {
      task.status = "Completed";
      task.completedAt = new Date();
    } else if (progressValue > 0 && progressValue < 100) {
      task.status = "In Progress";
      task.completedAt = null;
    } else {
      task.status = "Pending";
      task.completedAt = null;
    }

    await task.save();
    console.log(`✅ Progress updated for task: ${task.title}, progress: ${progressValue}%`);
    res.redirect("/tasks");

  } catch (err) {
    console.error("🔥 Error updating progress:", err);
    res.status(500).send("Internal Server Error");
  }
});




module.exports = router;
