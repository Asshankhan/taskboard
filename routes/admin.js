const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Admin Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).send('Access denied');
    }

    const tasks = await Task.find().populate('assignedTo', 'name email');

    const employeeStats = {};

    for (const task of tasks) {
      const name = task.assignedTo?.name || 'Unassigned';
      if (!employeeStats[name]) {
        employeeStats[name] = {
          completed: 0,
          inProgress: 0,
          pending: 0,
          totalEfficiency: 0,
          totalTime: 0,
          count: 0,
        };
      }

      // Status tracking
      if (task.status === 'Completed') employeeStats[name].completed++;
      else if (task.status === 'In Progress') employeeStats[name].inProgress++;
      else employeeStats[name].pending++;

      const today = new Date();
      let efficiency = 0;
      let timeDiffDays = 0;

      // Efficiency calculation
      if (task.status === 'Completed' && task.dueDate) {
        const delayDays = (task.completedAt - task.dueDate) / (1000 * 60 * 60 * 24);
        efficiency = delayDays <= 0 ? 100 : Math.max(0, 100 - delayDays * 5);
        timeDiffDays = Math.abs(delayDays);
      } else if (task.status === 'In Progress' && task.dueDate) {
        const totalDays = (task.dueDate - task.createdAt) / (1000 * 60 * 60 * 24);
        const daysElapsed = (today - task.createdAt) / (1000 * 60 * 60 * 24);
        const timeRatio = totalDays > 0 ? daysElapsed / totalDays : 1;
        efficiency = Math.max(0, (task.progress || 0) * (1 - timeRatio));
      } else if (task.status === 'Pending' && task.dueDate) {
        efficiency = today > task.dueDate ? 0 : 10;
      }

      employeeStats[name].totalEfficiency += efficiency;
      employeeStats[name].totalTime += timeDiffDays;
      employeeStats[name].count++;
    }

    // Prepare summarized data
    let efficiencyData = Object.entries(employeeStats).map(([name, stats]) => {
      const avgTime = stats.count ? (stats.totalTime / stats.count).toFixed(1) : 0;
      const avgEfficiency = stats.count ? (stats.totalEfficiency / stats.count).toFixed(1) : 0;

      return {
        name,
        completed: stats.completed,
        inProgress: stats.inProgress,
        pending: stats.pending,
        avgTime,
        efficiency: parseFloat(avgEfficiency),
      };
    });

    // Sort by efficiency
    efficiencyData = efficiencyData.sort((a, b) => b.efficiency - a.efficiency);

    // Generate AI summary
    let aiSummary = 'No data available';
    console.log('efficiencyData: ', efficiencyData);
    if (efficiencyData.length > 0 && process.env.OPENAI_API_KEY) {
      const prompt = `
      Analyze the following employee performance data and summarize insights in 3-5 sentences.
      Focus on productivity, efficiency, and improvement suggestions.
      Data: ${JSON.stringify(efficiencyData)}
      `;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
        });
        aiSummary = response.choices[0].message.content;
      } catch (err) {
        console.error("AI summary error:", err.message);
        aiSummary = "Unable to generate AI insights at the moment.";
      }
    }

    res.render('adminDashboard', { efficiencyData, aiSummary });
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
