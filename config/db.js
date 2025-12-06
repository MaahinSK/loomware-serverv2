const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ Mongoose connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from DB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 Mongoose connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Exit process with failure
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // In development, don't exit but log error
    console.log('⚠️ Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// MongoDB connection state check
const checkDBConnection = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = { connectDB, checkDBConnection };