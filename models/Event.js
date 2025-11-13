const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  featured: {
    type: Boolean,
    default: false
  },
  outside: {
    type: Boolean,
    default: false
  },
  publicEvent: {
    type: Boolean,
    default: false
  },
  petFriendly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);

