const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','employee'], default: 'employee' }
});

// pre-save hook: hash only when password is new/modified
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password.toString().trim(), 10);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate.toString().trim(), this.password);
};

module.exports = mongoose.model('User', userSchema);
