import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email',
    ],
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  receiveEmailNotifications: {
    type: Boolean,
    default: true,
  },
  receiveSmsNotifications: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    default: '',
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate a random 8-digit username if not provided
UserSchema.pre('save', async function (next) {
  if (!this.username) {
    let isUnique = false;
    let randomUsername;
    
    // Try to generate a unique username
    while (!isUnique) {
      // Generate a random 8-digit number
      randomUsername = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      // Check if the username already exists
      const existingUser = await mongoose.models.User.findOne({ username: randomUsername });
      
      if (!existingUser) {
        isUnique = true;
      }
    }
    
    this.username = randomUsername;
  }
  
  next();
});

// Match entered password with hashed password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the model
const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User; 