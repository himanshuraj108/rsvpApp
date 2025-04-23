import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: [messageSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create a compound index for efficient queries
chatSchema.index({ user: 1, lastUpdated: -1 });

// Only create the model if it doesn't already exist
let Chat;
if (mongoose.models && mongoose.models.Chat) {
  Chat = mongoose.models.Chat;
  console.log("Using existing Chat model");
} else {
  Chat = mongoose.model('Chat', chatSchema);
  console.log("Chat model created");
}

console.log("Chat model initialized:", !!Chat);

export default Chat; 