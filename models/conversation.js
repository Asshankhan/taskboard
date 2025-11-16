const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user','assistant','system'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // null for anonymous
  userName: { type: String, default: 'Guest' },
  messages: [messageSchema],
  // meta
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

conversationSchema.index({ lastUpdated: 1 }); // useful for retention queries

module.exports = mongoose.model('Conversation', conversationSchema);
