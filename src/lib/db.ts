```ts
import mongoose from 'mongoose';

let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = (global as any).__mongooseCache || {
  conn: null,
  promise: null,
};

(global as any).__mongooseCache = cached;

function resolveDatabaseName(): string {
  return process.env.MONGODB_DATABASE?.trim() || 'pragati';
}

async function resolveUri(): Promise<string> {
  const uri = process.env.MONGODB_URI;

  if (uri) return uri;

  if (process.env.USE_IN_MEMORY_MONGO === 'true') {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const g = global as any;

    if (!g.__mongoMemoryServer) {
      g.__mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: resolveDatabaseName(),
        },
        binary: {
          version: process.env.MONGOMS_VERSION || '7.0.7',
        },
      });

      console.log(
        `[db] in-memory Mongo @ ${g.__mongoMemoryServer.getUri()}`,
      );
    }

    return g.__mongoMemoryServer.getUri();
  }

  const where =
    process.env.NODE_ENV === 'production' ? '[CONFIG]' : '[db]';

  throw new Error(
    `${where} MONGODB_URI is not set. Configure it in the hosting dashboard, ` +
      'or set USE_IN_MEMORY_MONGO=true for local dev.',
  );
}

function assertProductionConfig() {
  if (process.env.NODE_ENV !== 'production') return;

  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      '[CONFIG] JWT_SECRET is missing or shorter than 16 chars in production. ' +
        'Set a long random value in the hosting dashboard before serving traffic — ' +
        'auth tokens cannot be signed or verified safely without it.',
    );
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  assertProductionConfig();

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = resolveUri().then(async (uri) => {
      const databaseName = resolveDatabaseName();

      const connection = await mongoose.connect(uri, {
        // Explicitly select the database instead of allowing MongoDB
        // to silently fall back to the "test" database.
        dbName: databaseName,

        maxPoolSize: 25,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
      });

      console.log(
        `[db] connected to database: ${
          connection.connection.db?.databaseName || 'unknown'
        }`,
      );

      return connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }

  if (process.env.USE_IN_MEMORY_MONGO === 'true') {
    const { devSeed } = await import('@/lib/devSeed');
    await devSeed();
  }

  return cached.conn;
}
```
