# 🧩 TaskBoard — Employee Task Management System

**TaskBoard** is a modern web-based employee task management system built using **Node.js**, **Express**, **EJS**, and **MongoDB Atlas**.  
It enables efficient management of employee tasks, role-based dashboards, and a smooth workflow for both admins and employees.

---

## 🚀 Features

- 👤 **User Authentication** — Secure registration and login with encrypted passwords.  
- 🧭 **Role-Based Dashboard** — Separate dashboards for **Admin** and **Employee** users.  
- 🧾 **Task Management** — Admins can create, assign, update, or delete tasks.  
- ✅ **Employee Panel** — Employees can view assigned tasks and update their status.  
- 🧑‍💻 **My Profile Page** — Displays employee details, contact info, and role information.  
- 🌗 **Modern UI** — Built using **Bootstrap 5**, with gradient backgrounds and smooth UI effects.  
- 💾 **MongoDB Atlas Integration** — Cloud database for scalability and easy deployment.  
- 🔐 **Session Handling** — Persistent and secure login sessions using `express-session`.  

---

## 🛠️ Tech Stack

| Category | Technology |
|-----------|-------------|
| Frontend | EJS, HTML, CSS, Bootstrap 5 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Authentication | Express-session, bcrypt |
| Template Engine | EJS |

---

## 📂 Project Structure
TaskBoard/
│
├── views/ # EJS templates (login, register, dashboard, profile, etc.)
├── public/ # Static assets (CSS, images)
├── routes/ # Express routes
├── controllers/ # Core business logic
├── models/ # Mongoose models (User, Task)
├── config/ # MongoDB connection setup
├── app.js # Main Express server
└── package.json # Dependencies and scripts
