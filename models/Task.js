const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Review', 'Completed'],
    default: 'Pending',
  },

  progress: {
    type: Number, // percentage (0–100)
    default: 0,
    min: 0,
    max: 100,
  },

  dueDate: {
    type: Date,
    required: true, // set to true if you want it mandatory
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  completedAt: {
    type: Date,
  },
});

// Automatically set completedAt when status becomes "Completed"
taskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'Completed') {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
