import mongoose from 'mongoose';

const DeleteRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    default: 'No reason provided'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminComment: {
    type: String,
    default: ''
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// Create indexes for efficient queries
DeleteRequestSchema.index({ userId: 1, status: 1 });
DeleteRequestSchema.index({ status: 1 });
DeleteRequestSchema.index({ requestedAt: -1 });

// Set up DeleteRequest model, creating it if it doesn't exist
const DeleteRequest = mongoose.models.DeleteRequest || mongoose.model('DeleteRequest', DeleteRequestSchema);

export default DeleteRequest; 