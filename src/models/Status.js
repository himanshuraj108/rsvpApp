import mongoose from 'mongoose';

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isChatbotActive: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create and export the Status model
export default mongoose.models.Status || mongoose.model('Status', statusSchema); 