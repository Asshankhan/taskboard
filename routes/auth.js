const express = require('express');
const router = express.Router();
const User = require('../models/User');

// render pages if you have views
router.get('/register', (req,res)=>res.render('register'));

// REGISTER: do NOT hash here — model handles it
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if(!name||!email||!password) return res.send('Missing fields');
    const exists = await User.findOne({ email });
    if (exists) return res.send('User exists');
    const user = new User({ name, email, password: password.toString().trim(), role });
    await user.save();
    req.session.user = { id: user._id, name: user.name, role: user.role };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Registration error');
  }
});

// LOGIN
router.get('/login', (req,res)=>res.render('login'));

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email && req.body.email.toString().trim();
    const password = req.body.password && req.body.password.toString().trim();
    const user = await User.findOne({ email });
    if (!user) return res.send('User not found');

    console.log('Entered:', password);
    console.log('Stored hash:', user.password);

    const isMatch = await user.comparePassword(password);
    console.log('compare result:', isMatch);
    if (!isMatch) return res.send('Invalid credentials');

    req.session.user = { id: user._id, name: user.name, role: user.role };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Login error');
  }
});

module.exports = router;
