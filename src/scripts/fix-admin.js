// This script fixes the admin credentials in the MongoDB database
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function fixAdminCredentials() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin credentials from env
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not found in .env.local file!');
      process.exit(1);
    }

    console.log(`Admin email: ${adminEmail}`);
    console.log('Checking if admin user exists...');

    // Check if admin exists
    const usersCollection = mongoose.connection.db.collection('users');
    const existingAdmin = await usersCollection.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin user found, updating credentials...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Update admin in the database directly
      const result = await usersCollection.updateOne(
        { email: adminEmail },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin' 
          } 
        }
      );
      
      console.log('Admin credentials updated successfully!');
    } else {
      console.log('Admin user not found, creating new admin user...');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Insert admin directly into the database
      const result = await usersCollection.insertOne({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Admin user created successfully!');
    }
    
    console.log('✅ Admin setup complete. You can now log in with:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the database connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
fixAdminCredentials(); 