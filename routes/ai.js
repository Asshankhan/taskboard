// routes/ai.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Task = require('../models/Task'); // optional: to fetch fresh data if needed
const Conversation = require('../models/Conversation');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// small local fallback summarizer (used if no API key or quota)
function localFallbackAnswer(prompt, efficiencyData) {
  // basic rule-based reply: picks high/low performers and returns short summary
  if (!efficiencyData || efficiencyData.length === 0) return 'No performance data available yet.';
  const best = efficiencyData[0];
  const worst = efficiencyData.slice(-1)[0];
  const avg = (efficiencyData.reduce((s, e) => s + (e.efficiency || 0), 0) / efficiencyData.length).toFixed(1);
  return `Team average efficiency is ${avg}%. Top performer: ${best.name} (${best.efficiency}%). Lowest: ${worst.name} (${worst.efficiency}%). Try asking "who needs attention" or "suggest improvements".`;
}

// helper: compute efficiencyData server-side (you can reuse your admin code)
async function computeEfficiencyData() {
  // This is a lightweight version — adapt to your admin logic if needed.
  const tasks = await Task.find().populate('assignedTo', 'name').lean();
  const stats = {};
  const today = new Date();

  for (const t of tasks) {
    const name = t.assignedTo?.name || 'Unassigned';
    if (!stats[name]) stats[name] = { completed: 0, inProgress: 0, pending: 0, totalEfficiency: 0, totalTime: 0, count: 0 };
    if (t.status === 'Completed') stats[name].completed++;
    else if (t.status === 'In Progress') stats[name].inProgress++;
    else stats[name].pending++;

    let efficiency = 0;
    let timeDiffDays = 0;
    if (t.status === 'Completed' && t.dueDate && t.completedAt) {
      const delayDays = (new Date(t.completedAt) - new Date(t.dueDate)) / (1000*60*60*24);
      efficiency = delayDays <= 0 ? 100 : Math.max(0, 100 - delayDays * 5);
      timeDiffDays = Math.abs(delayDays);
    } else if (t.status === 'In Progress' && t.dueDate) {
      const totalDays = (new Date(t.dueDate) - new Date(t.createdAt)) / (1000*60*60*24) || 1;
      const daysElapsed = (today - new Date(t.createdAt)) / (1000*60*60*24);
      const timeRatio = Math.min(1, daysElapsed / totalDays);
      efficiency = Math.max(0, (t.progress || 0) * (1 - timeRatio));
    } else if (t.status === 'Pending' && t.dueDate) {
      efficiency = today > new Date(t.dueDate) ? 0 : 10;
    }

    stats[name].totalEfficiency += efficiency;
    stats[name].totalTime += timeDiffDays;
    stats[name].count++;
  }

  let efficiencyData = Object.entries(stats).map(([name, s]) => {
    const avgTime = s.count ? (s.totalTime / s.count) : 0;
    const avgEfficiency = s.count ? (s.totalEfficiency / s.count) : 0;
    return { name, completed: s.completed, inProgress: s.inProgress, pending: s.pending, avgTime: parseFloat(avgTime.toFixed(1)), efficiency: parseFloat(avgEfficiency.toFixed(1)) };
  });

  efficiencyData = efficiencyData.sort((a,b) => (b.efficiency || 0) - (a.efficiency || 0));
  return efficiencyData;
}

// GET: render chat page
// router.get('/', async (req, res) => {
//   try {
//     // optional: require login
//     const user = req.session.user || null;
//     // compute initial data to show
//     const efficiencyData = await computeEfficiencyData();
//     res.render('aiAssistant', { user, efficiencyData, initialMessage: null });
//   } catch (err) {
//     console.error('AI assistant page error:', err);
//     res.render('aiAssistant', { user: req.session.user || null, efficiencyData: [], initialMessage: 'Unable to load AI assistant data.' });
//   }
// });

router.get('/', async (req, res) => {
  const userId = req.session.user ? req.session.user.id : null;
  const convId = req.session.convId || null;
  let conv = null;

  if (convId) conv = await Conversation.findById(convId).lean().exec().catch(()=>null);
  if (!conv && userId) {
    // optionally load most recent conv for logged in user
    conv = await Conversation.findOne({ userId }).sort({ lastUpdated: -1 }).lean().exec().catch(()=>null);
    if (conv) req.session.convId = conv._id.toString();
  }

  const efficiencyData = await computeEfficiencyData();
  res.render('aiAssistant', { user: req.session.user || null, efficiencyData, conversation: conv });
});

// POST: handle chat messages (AJAX)
router.post('/message', async (req, res) => {
  try {
    const message = req.body.message?.trim();
    if (!message) return res.json({ reply: "Please type a message." });

    const userId = req.session.user ? req.session.user.id : null;
    const userName = req.session.user ? req.session.user.name : "Guest";

    // Load existing conversation if any
    let convId = req.session.convId;
    let conv = null;

    if (convId) {
      conv = await Conversation.findById(convId).catch(() => null);
    }

    // Create new conversation if none found
    if (!conv) {
      conv = new Conversation({
        userId,
        userName,
        messages: []
      });
    }

    // Save user message
    conv.messages.push({
      role: "user",
      content: message
    });
    conv.lastUpdated = new Date();
    await conv.save();

    // Build context for OpenAI (optional)
    const history = conv.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    // Add latest user input
    history.push({ role: "user", content: message });

    let replyText = "";

    // Try OpenAI first
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: history
        });

        replyText = completion.choices[0].message.content.trim();
      } catch (err) {
        console.error("OpenAI error:", err.message);
        replyText = "⚠️ AI is temporarily unavailable. Please try again later.";
      }
    } else {
      replyText = "⚠️ AI is not configured. Add your OpenAI API key.";
    }

    // Save assistant reply
    conv.messages.push({
      role: "assistant",
      content: replyText
    });
    conv.lastUpdated = new Date();
    await conv.save();

    // Store conversation ID back to session
    req.session.convId = conv._id.toString();

    // Return reply to frontend
    res.json({ reply: replyText, convId: conv._id });

  } catch (err) {
    console.error("Chat message error:", err);
    res.status(500).json({ reply: "Server error. Please try again." });
  }
});


// GET export conversation as JSON
router.get('/export', async (req, res) => {
  if (!req.session.convId) return res.status(404).send('No conversation found');
  const conv = await Conversation.findById(req.session.convId).lean().exec();
  if (!conv) return res.status(404).send('Not found');
  res.setHeader('Content-disposition', `attachment; filename=conversation-${conv._id}.json`);
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(conv, null, 2));
});

// DELETE conversation (user deletes their chat)
router.delete('/conversation', async (req, res) => {
  if (!req.session.convId) return res.json({ ok: false });
  await Conversation.deleteOne({ _id: req.session.convId });
  delete req.session.convId;
  res.json({ ok: true });
});


module.exports = router;
