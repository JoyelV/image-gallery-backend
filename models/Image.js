const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageURL: { type: String, required: true },
  publicId: { type: String, required: true }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);
