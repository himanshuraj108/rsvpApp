import mongoose from 'mongoose';

const storeStatusSchema = new mongoose.Schema({
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

// Handle case when model is already defined (hot reloading)
const StoreStatus = mongoose.models.StoreStatus || mongoose.model('StoreStatus', storeStatusSchema);

export default StoreStatus; 