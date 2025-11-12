const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');

router.get('/dashboard', async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/login');

    const user = req.session.user;

    if (user.role === 'admin') {
      const employees = await User.find({ role: 'employee' }).lean();
      const tasks = await Task.find({ assignedTo: user._id });
      console.log('tasks: ', tasks);
      console.log('Loaded employees:', employees.length);
      return res.render('dashboard-admin', { user, employees, tasks });
    }

    return res.render('dashboard', { user });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
});

module.exports = router;
