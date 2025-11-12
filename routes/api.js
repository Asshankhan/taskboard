const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// simple auth middleware for API using session
function ensureLoggedIn(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

// get tasks (admin gets all)
router.get('/tasks', ensureLoggedIn, async (req, res) => {
  const user = req.session.user;
  const filter = user.role === 'admin' ? {} : { assignedTo: user.id };
  const tasks = await Task.find(filter).populate('assignedTo', 'name email');
  res.json(tasks);
});

// create task
router.post('/tasks', ensureLoggedIn, async (req, res) => {
  const user = req.session.user;
  console.log('user: ', user);
  const { title, description, dueDate, assignedTo } = req.body;
  console.log('title, description, dueDate, assignedTo: ', title, description, dueDate, assignedTo);
  console.log('req.body: ', req.body);
  // const task = new Task({
  //   title,
  //   description,
  //   dueDate,
  //   createdBy: user.id,
  //   assignedTo: assignedTo || user.id,
  // });
  // await task.save();
  res.status(201).json(task);
});

// update task
router.put('/tasks/:id', ensureLoggedIn, async (req, res) => {
  const user = req.session.user;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  if (user.role !== 'admin' && task.assignedTo.toString() !== user.id)
    return res.status(403).json({ error: 'Forbidden' });

  const { title, description, status, assignedTo, dueDate } = req.body;
  if (title) task.title = title;
  if (description) task.description = description;
  if (status) task.status = status;
  if (dueDate) task.dueDate = dueDate;
  if (user.role === 'admin' && assignedTo) task.assignedTo = assignedTo;

  await task.save();
  res.json(task);
});

module.exports = router; // ✅ FIXED
