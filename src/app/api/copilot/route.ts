import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireUser } from '@/lib/auth';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are QA Copilot — the friendly AI assistant embedded in Pragati, a Quality Informatics project management tool used by pharma and life sciences teams.

Your job is to guide anyone — from QA specialists to IT engineers who've never written a deviation in their life — through any quality process question they have. You make compliance feel less like a maze and more like a clear path.

## Who you're talking to
- QA professionals who need a quick refresher on the right process
- Software/IT engineers confused by GxP requirements (what is a deviation? do I need one?)
- Project managers unsure which lifecycle applies to their work
- Anyone who hit a compliance speed bump and needs to know what to do next

## Your personality
- Clear, direct, human. No jargon without explanation.
- You're the colleague who actually knows the process AND can explain it simply
- Never preachy. Never lecture. Just: "here's the path, here's why, go"

## What you know deeply
- Deviations, CAPAs, Change Control, Software Changes (GAMP 5)
- Computer System Validation (CSV / IQ / OQ / PQ)
- Data Integrity and ALCOA+ principles
- Document Control and SOP lifecycle
- GMP basics and batch record requirements
- Regulatory context: 21 CFR Part 11, 21 CFR 211, EU Annex 11, ICH Q10
- Audit preparation and responding to 483 observations

## Response format
Always end your response with this exact section so the app can extract actionable tasks:

---STEPS---
1. [First concrete action to take]
2. [Second concrete action]
3. [Third action]
---END STEPS---

Keep steps specific. Bad: "Fill out deviation form". Good: "Log a Minor deviation in Pragati — describe what happened, which procedure was affected, and the immediate containment action taken."

Tone: "I've got you. Here's exactly what to do."`;

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
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? [];
  if (!messages.length) return Response.json({ error: 'No messages' }, { status: 400 });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));
    const lastMessage = messages[messages.length - 1].content;

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
          console.error('[copilot stream error]', e);
          controller.enqueue(encoder.encode('\n\n[Stream interrupted. Please try again.]'));
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
      },
    });
  } catch (e: any) {
    console.error('[copilot error]', e?.message ?? e);
    return Response.json(
      { error: e?.message ?? 'Gemini API error. Check your API key and try again.' },
      { status: 500 }
    );
  }
}
