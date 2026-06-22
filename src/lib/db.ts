import mongoose from 'mongoose';

let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = (global as any).__mongooseCache || {
  conn: null,
  promise: null,
};

(global as any).__mongooseCache = cached;

/**
 * Pull the database name out of a connection string, e.g.
 *   mongodb+srv://user:pass@cluster.mongodb.net/myDb?retryWrites=true → "myDb"
 *   mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true     → undefined
 *
 * Returns undefined when the URI has no database path component.
 */
function databaseFromUri(uri: string): string | undefined {
  const afterScheme = uri.replace(/^mongodb(\+srv)?:\/\//i, '');
  const slash = afterScheme.indexOf('/');
  if (slash === -1) return undefined;
  const db = afterScheme.slice(slash + 1).split('?')[0].trim();
  return db || undefined;
}

/**
 * Decide which database to open. Priority:
 *   1. MONGODB_DATABASE  — explicit operator override, always wins.
 *   2. the database embedded in MONGODB_URI — the connection string is the
 *      operator's source of truth; we must NOT silently redirect away from it.
 *   3. 'pragati' — last-resort default so a path-less URI never lands in
 *      MongoDB's throwaway "test" database.
 *
 * Forcing 'pragati' regardless of the URI (as a previous revision did) routed
 * every read/write to a database the real users were never created in, which
 * made existing accounts appear to vanish. Respecting the URI prevents that.
 */
function resolveDatabaseName(uri?: string): string {
  const explicit = process.env.MONGODB_DATABASE?.trim();
  if (explicit) return explicit;

  const fromUri = uri ? databaseFromUri(uri) : undefined;
  if (fromUri) return fromUri;

  return 'pragati';
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
      const databaseName = resolveDatabaseName(uri);

      const connection = await mongoose.connect(uri, {
        // Select the database from MONGODB_DATABASE → URI path → 'pragati'
        // (see resolveDatabaseName). This both honours the connection string
        // and avoids MongoDB's silent fallback to the "test" database.
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
