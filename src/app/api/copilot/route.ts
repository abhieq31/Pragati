import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

// Shorter system prompt = fewer tokens per request = more free-tier headroom
const SYSTEM_PROMPT = `You are QA Copilot inside Pragati, a pharma Quality Informatics PM tool. Help anyone — QA experts or IT engineers new to GxP — navigate quality procedures clearly.

Cover: Deviations (classification, 30-day close, CAPA linkage), CAPAs (5-Why/fishbone RCA, effectiveness check), Change Control (when required, impact assessment, emergency vs standard), Software Changes (GAMP 5 cat 1–5, CSV/IQ/OQ/PQ), Data Integrity (ALCOA+), Document Control, GMP basics, 21 CFR Part 11, EU Annex 11, ICH Q10.

Rules:
- Plain English. No jargon without explanation.
- Short direct answer first, then full detail if needed.
- Always end with steps the user can act on RIGHT NOW.
- Tone: "I've got you. Here's exactly what to do."

ALWAYS end every response with this exact block:

---STEPS---
1. [specific action]
2. [specific action]
3. [specific action]
---END STEPS---

Steps must be concrete. Bad: "Log a deviation." Good: "Open Pragati → New Project → Deviation lifecycle → log what happened, which SOP was affected, and what containment you took immediately."`;

// Try models in order — if one quota is exhausted, fall through to next
const MODEL_PRIORITY = [
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash',
];

export async function POST(req: NextRequest) {
  const { error } = await requireUser(req);
  if (error) return error;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({
      error: 'GEMINI_API_KEY not set. Get a free key at aistudio.google.com and add it to Vercel env vars.'
    }, { status: 503 });
  }

  let body: any;
  try { body = await req.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? [];
  if (!messages.length) return Response.json({ error: 'No messages' }, { status: 400 });

  const genAI = new GoogleGenerativeAI(apiKey);
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
  const lastMessage = messages[messages.length - 1].content;

  let lastError: any = null;

  for (const modelName of MODEL_PRIORITY) {
    try {
      const model  = genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_PROMPT });
      const chat   = model.startChat({ history });
      const result = await chat.sendMessageStream(lastMessage);

      const encoder = new TextEncoder();
      const stream  = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) controller.enqueue(encoder.encode(text));
            }
          } catch (e) {
            console.error(`[copilot stream error on ${modelName}]`, e);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
          'X-Model-Used': modelName,
        },
      });
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests');
      const is404 = msg.includes('404') || msg.includes('not found');
      lastError = e;

      if (is429 || is404) {
        // Quota or model not available — try next model
        console.warn(`[copilot] ${modelName} unavailable (${is429 ? '429' : '404'}), trying next`);
        continue;
      }

      // Any other error — return immediately
      console.error(`[copilot] ${modelName} error:`, msg);
      return Response.json({ error: msg || 'AI error. Please try again.' }, { status: 500 });
    }
  }

  // All models exhausted
  const retryMatch = (lastError?.message ?? '').match(/retry.*?(\d+)s/i);
  const retryIn    = retryMatch ? `Try again in ${retryMatch[1]} seconds.` : 'Try again in a minute.';
  return Response.json({
    error: `All AI quota exhausted for today. ${retryIn} This is a free-tier limit — quota resets daily.`
  }, { status: 429 });
}
