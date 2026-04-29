import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/auth';
import { findBestAnswer, generalGuidance } from '@/lib/ai/qaKnowledge';

export const runtime = 'nodejs';

// Build a formatted response from a knowledge base entry
function buildResponse(entry: ReturnType<typeof findBestAnswer>): string {
  if (!entry) return '';
  const lines: string[] = [];
  lines.push(entry.summary);
  lines.push('');
  lines.push(entry.detail);
  lines.push('');
  lines.push(`*Regulatory reference: ${entry.regulatory}*`);
  lines.push('');
  // Steps block — parsed by UI for one-click task creation
  lines.push('---STEPS---');
  entry.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push('---END STEPS---');
  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  const { error } = await requireUser(req);
  if (error) return error;

  let body: any;
  try { body = await req.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? [];
  if (!messages.length) return Response.json({ error: 'No messages' }, { status: 400 });

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';

  const match  = findBestAnswer(lastUserMessage);
  const entry  = match ?? generalGuidance(lastUserMessage);
  const full   = buildResponse(entry);

  // Stream character-by-character for a natural typing feel
  const encoder = new TextEncoder();
  const CHUNK   = 4; // characters per tick

  const stream = new ReadableStream({
    async start(controller) {
      let i = 0;
      while (i < full.length) {
        controller.enqueue(encoder.encode(full.slice(i, i + CHUNK)));
        i += CHUNK;
        // Small delay only for first 200 chars (feels like thinking)
        if (i < 200) await new Promise(r => setTimeout(r, 8));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
