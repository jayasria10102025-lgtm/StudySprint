const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studysprint';
  
  // Set mongoose options
  mongoose.set('strictQuery', false);

  try {
    // Attempt connecting to the configured URI with a 4-second timeout
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB URI (${uri}): ${err.message}`);
    
    // In local dev/testing, automatically fall back to MongoMemoryServer if available
    try {
      console.log('[Database] Initializing fallback in-memory MongoDB server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      
      const conn = await mongoose.connect(memoryUri);
      console.log(`[Database] In-memory MongoDB connected successfully at ${memoryUri}`);
      return conn;
    } catch (memErr) {
      console.error('[Database] Failed to initialize in-memory MongoDB fallback:', memErr.message);
      throw err;
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
