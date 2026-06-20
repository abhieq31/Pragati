import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { captureError } from '@/lib/errorMonitor';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function error(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function readBody<T>(req: Request, schema?: ZodSchema<T>): Promise<T> {
  const raw = await req.json().catch(() => ({}));
  if (!schema) return raw as T;
  return schema.parse(raw);
}

// Infrastructure / config errors that must never leak raw details to users
const INFRA_PATTERNS = [
  /MONGODB_URI/i,
  /USE_IN_MEMORY_MONGO/i,
  /mongo/i,
  /jwt_secret/i,
  /ECONNREFUSED/i,
  /getaddrinfo/i,
  /ETIMEDOUT/i,
  /connect ETIMEOUT/i,
];

function isInfraError(msg: string) {
  return INFRA_PATTERNS.some((re) => re.test(msg));
}

// Mongoose/MongoDB throw with internal, implementation-leaking wording (field
// paths, index names, BSON casting detail). These are really input-validation
// failures — map them to a clean 400/409 instead of falling through to the
// generic 500 branch, which used to forward the raw driver message verbatim.
function isCastError(e: unknown): boolean {
  return !!e && typeof e === 'object' && (e as any).name === 'CastError';
}

function isDuplicateKeyError(e: unknown): boolean {
  return !!e && typeof e === 'object' && ((e as any).code === 11000 || (e as any).code === 11001);
}

function mongooseValidationMessage(e: unknown): string | null {
  if (!e || typeof e !== 'object' || (e as any).name !== 'ValidationError' || !(e as any).errors) return null;
  const first = Object.values((e as any).errors as Record<string, { message?: string }>)[0];
  return first?.message || 'Validation failed';
}

// Next.js uses thrown errors as control flow: redirect(), notFound(), and the
// DynamicServerError it raises to bail out of static rendering all surface as
// exceptions carrying a `digest`. These are NOT failures — they must propagate
// to Next untouched, never get logged to the error monitor, and never become a
// 500. Swallowing the DynamicServerError was flooding the admin monitor with
// bogus "Dynamic server usage" entries.
function isNextControlFlow(e: unknown): boolean {
  const digest = (e as any)?.digest;
  return typeof digest === 'string' && (digest === 'DYNAMIC_SERVER_USAGE' || digest.startsWith('NEXT_'));
}

export function handleError(e: unknown) {
  if (isNextControlFlow(e)) throw e;
  if (e instanceof ZodError) {
    return NextResponse.json({ error: 'Validation failed', issues: e.issues }, { status: 400 });
  }
  console.error('[handleError]', e);
  const raw = e instanceof Error ? e.message : 'Internal error';

  // Capture for admin monitoring (best-effort, non-blocking, never throws).
  void captureError({
    source: 'server',
    message: raw,
    stack: e instanceof Error ? e.stack : undefined,
    statusCode: 500,
  });

  if (isCastError(e)) {
    return NextResponse.json({ error: 'Invalid id or field value' }, { status: 400 });
  }
  if (isDuplicateKeyError(e)) {
    return NextResponse.json({ error: 'That value is already in use' }, { status: 409 });
  }
  const validationMsg = mongooseValidationMessage(e);
  if (validationMsg) {
    return NextResponse.json({ error: validationMsg }, { status: 400 });
  }

  // Anything left is a genuinely unexpected failure — never forward the raw
  // driver/runtime message (it can carry stack-adjacent implementation
  // detail), even when it isn't one of the known infra patterns above. It's
  // already been logged + captured for the admin monitor above.
  const userMsg = isInfraError(raw)
    ? 'The service is temporarily unavailable. Please try again in a moment or contact your administrator.'
    : 'Something went wrong. Please try again or contact your administrator.';

  return NextResponse.json({ error: userMsg }, { status: 500 });
}
