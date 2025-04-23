import mongoose from 'mongoose';

const chatStatusSchema = new mongoose.Schema({
  isOnline: {
    type: Boolean,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Use a singleton pattern to avoid multiple model compilations
export default mongoose.models.ChatStatus || mongoose.model('ChatStatus', chatStatusSchema); 