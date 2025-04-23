import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an event title'],
    trim: true,
    maxlength: [100, 'Event title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide an event description'],
  },
  date: {
    type: Date,
    required: [true, 'Please provide an event date'],
  },
  time: {
    type: String,
    required: [true, 'Please provide an event time'],
  },
  location: {
    type: String,
    required: [true, 'Please provide an event location'],
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide event capacity'],
  },
  image: {
    type: String,
    default: '',
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['attending', 'maybe', 'declined'],
      default: 'attending',
    },
    responseDate: {
      type: Date,
      default: Date.now,
    },
    additionalGuests: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  }],
  invitedEmails: [{
    email: {
      type: String,
      required: true,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  }],
  isPrivate: {
    type: Boolean,
    default: false,
  },
  registrationDeadline: {
    type: Date,
  },
  categories: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled', 'pending_approval', 'rejected'],
    default: 'upcoming',
  },
}, { timestamps: true });

export default mongoose.models.Event || mongoose.model('Event', EventSchema); 