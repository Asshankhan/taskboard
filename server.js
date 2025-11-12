// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');


const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const apiRoutes = require('./routes/api');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require("./routes/users");
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
useNewUrlParser: true,
useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error', err));


// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));


// sessions
app.use(session({
secret: process.env.SESSION_SECRET || 'keyboard cat',
resave: false,
saveUninitialized: false,
store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));


// set user to locals
app.use((req, res, next) => {
res.locals.currentUser = req.session.user || null;
next();
});


// routes
console.log('authRoutes =', typeof authRoutes);
console.log('taskRoutes =', typeof taskRoutes);
console.log('apiRoutes =', typeof apiRoutes);
// console.log('authRoutes =', authRoutes);
app.use('/', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/api', apiRoutes);
app.use("/users", userRoutes);
app.use('/admin', adminRoutes);

// static pages
app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));

app.get('/profile', (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/login');
  res.render('profile', { user });
});

// GET: Show Edit Profile Page
app.get("/edit-profile", (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect("/login");
  res.render("edit-profile", { user });
});

// POST: Handle Profile Update
app.post("/edit-profile", (req, res) => {
  const { name, email, password } = req.body;
  const user = req.session.user;

  if (!user) return res.redirect("/login");

  // In real app — update DB here
  user.name = name;
  user.email = email;
  if (password && password.trim() !== "") {
    user.password = password; // Hash before saving in production!
  }

  req.session.user = user;
  res.redirect("/profile");
});


app.use('/', dashboardRoutes);

// catch-all
app.use((req, res) => res.status(404).send('Page not found'));


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));