import { beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';

// Set test environment
process.env.NODE_ENV = 'test';

// Load env vars
import 'dotenv/config';

const TEST_DB_NAME = process.env.MONGO_DB_NAME || 'test';

// Safety check - never run tests against production
if (TEST_DB_NAME === 'technique') {
  throw new Error('Cannot run tests against technique database');
}

beforeAll(async () => {
  // Connect to test database
  const uri = process.env.ATLAS_URI;
  if (!uri) {
    throw new Error('ATLAS_URI environment variable is required for tests');
  }

  await mongoose.connect(uri, { dbName: TEST_DB_NAME });
});

afterAll(async () => {
  await mongoose.disconnect();
});
