// ─── Pharma QA Copilot — LLM core ────────────────────────────────────────────
// Wraps Gemini (free, no credit card) with a curated regulatory knowledge base
// used as grounding context (RAG). Streams tokens; falls back to KB-only if no
// key. If a key IS set but the LLM fails, the failure is surfaced to the user
// (we do NOT silently degrade — that hides bugs and breaks the "Live AI" badge).

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import { findRelevantEntries, findBestAnswer, generalGuidance, type KBEntry } from './qaKnowledge';

export type ChatMsg = { role: 'user' | 'assistant'; content: string };

// Try a few model names in priority order. List validated against
// generativelanguage.googleapis.com as of v0.24.1 (Jan 2026):
//   - gemini-2.0-flash and the -001/-exp variants accept system instructions
//   - lite is cheaper and sometimes available when flash is rate-limited
//   - 1.5-flash kept as last-ditch because it's been GA the longest
const MODEL_ORDER = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

function systemInstruction(kb: KBEntry[], hasTaskContext: boolean): string {
  const grounding = kb.length === 0
    ? 'No tightly matching KB entry — rely on your general regulatory training, but stay conservative.'
    : kb.map((e, i) => [
        `── KB ENTRY ${i + 1}: ${e.title} ──`,
        e.summary,
        '',
        e.detail,
        '',
        `Regulatory: ${e.regulatory}`,
        '',
        `Recommended steps:`,
        ...e.steps.map((s, j) => `${j + 1}. ${s}`),
      ].join('\n')).join('\n\n');

  return `
You are Pragati's QA Copilot — an expert pharmaceutical Quality Assurance assistant
trained on GxP (GMP/GLP/GDP/GCP), 21 CFR Part 11 and 211, EU GMP Annex 11, ICH Q9/Q10,
GAMP 5, ALCOA+, and FDA/EMA inspection practice.

# YOUR JOB
Help QA leads, validation engineers, deviation/CAPA owners, and PMs reach the right
regulatory answer fast. Be conversational, specific, and actionable — never robotic.

# STYLE
- Plain English. No jargon without a one-line definition the first time it appears.
- Short paragraphs. Use lists when natural; never force bullet-points if prose reads better.
- Cite the actual regulation (e.g. "21 CFR 211.192", "EU Annex 11 §9", "GAMP 5 Cat 4").
- Acknowledge uncertainty: "this depends on your local SOP" beats false confidence.
- ${hasTaskContext
    ? 'The user is working on a SPECIFIC TASK. Tailor the answer to that task — reference its title, lifecycle, status, and GxP flag where relevant.'
    : 'The user asked a general QA question — answer at the right level of detail for a working professional.'}

# KNOWLEDGE BASE GROUNDING
The block below is the curated, regulation-checked QA knowledge base. PREFER its
language and references for anything it covers. It is the source of truth for
this product. If the user's question lies outside the KB, fall back to your
general training but explicitly say so ("I'm extrapolating beyond Pragati's
curated KB here…").

${grounding}

# OUTPUT FORMAT (CRITICAL — UI parses this)
1. Start with a 2-4 sentence direct answer to the user's question.
2. Then 1-3 short paragraphs of detail: WHY this matters, what to watch for, common pitfalls.
3. End with a regulatory citation line, prefixed with *Regulatory reference:* in italics.
4. Then, on a new line, append an actionable next-steps block in this exact format:

---STEPS---
1. First concrete action the user can take in Pragati or their workflow
2. Second action
3. Third action
4. (4-6 steps total, each one a clear imperative starting with a verb)
---END STEPS---

The ---STEPS--- block is parsed by the UI to create one-click tasks, so:
- Each step must be a full imperative sentence (start with a verb)
- Steps must be ordered (do step 1 before step 2)
- 4-6 steps is the sweet spot — fewer if the question is narrow

# IF THE USER ASKS A FOLLOW-UP
You'll see the prior conversation. Build on it — don't repeat the steps unless asked.
For follow-ups, you may skip the ---STEPS--- block if no new actions are needed.

Now answer the user's question.
`.trim();
}

// Build Gemini history from chat messages
function buildHistory(messages: ChatMsg[]): Content[] {
  // Gemini requires alternating user/model and the LAST message must be sent
  // as the prompt — so we drop the trailing user message and feed it separately.
  const trimmed = [...messages];
  if (trimmed.length === 0) return [];
  if (trimmed[trimmed.length - 1].role === 'user') trimmed.pop();
  return trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  })) as Content[];
}

// KB-only response — used when no API key is set, or as last-ditch fallback
function buildKBResponse(query: string): string {
  const entry = findBestAnswer(query) ?? generalGuidance(query);
  const lines: string[] = [];
  lines.push(entry.summary);
  lines.push('');
  lines.push(entry.detail);
  lines.push('');
  lines.push(`*Regulatory reference: ${entry.regulatory}*`);
  lines.push('');
  lines.push('---STEPS---');
  entry.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push('---END STEPS---');
  return lines.join('\n');
}

export interface CopilotStreamOptions {
  messages: ChatMsg[];
  hasTaskContext?: boolean;
}

export interface StreamMeta {
  // Gets populated as the stream progresses so the route can read it later.
  finalMode: 'llm' | 'kb';
  modelUsed?: string;
  errors: string[];
}

// Stream a response. The `meta` object is mutated as we go so the route can
// know which path actually executed (LLM vs KB fallback) and which model
// answered. This is what powers the honest "Live AI" / "KB mode" badge.
export async function* streamCopilotReply(
  opts: CopilotStreamOptions,
  meta: StreamMeta = { finalMode: 'kb', errors: [] }
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  const lastUser = [...opts.messages].reverse().find(m => m.role === 'user')?.content ?? '';

  // No key — degrade transparently to KB mode (the route header reflects this)
  if (!apiKey) {
    meta.finalMode = 'kb';
    yield* streamString(buildKBResponse(lastUser));
    return;
  }

  const kb = findRelevantEntries(lastUser, 3, 2);
  const sys = systemInstruction(kb, !!opts.hasTaskContext);
  const history = buildHistory(opts.messages);

  const genAI = new GoogleGenerativeAI(apiKey);

  // Try models in priority order — avoids hard failure if one is rate-limited
  for (const modelName of MODEL_ORDER) {
    try {
      // IMPORTANT: systemInstruction must be a plain string, NOT a Content
      // object with role:'system'. Gemini only accepts user/model roles in
      // Content; passing role:'system' makes the SDK throw silently inside
      // the async iterator and we'd never see chunks come back. This was the
      // bug that made "Live AI" badge show but answers degrade to KB.
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: sys,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(lastUser);

      let any = false;
      for await (const chunk of result.stream) {
        const t = chunk.text();
        if (t) { any = true; yield t; }
      }
      if (!any) {
        meta.errors.push(`${modelName}: empty stream`);
        continue;
      }
      meta.finalMode  = 'llm';
      meta.modelUsed  = modelName;
      return;
    } catch (e: any) {
      // Common reasons: 404 model name, 429 rate limit, 400 bad input,
      // network issue. Capture the message so the route can surface it.
      const reason = e?.message || e?.toString?.() || 'unknown error';
      meta.errors.push(`${modelName}: ${reason}`);
      // try next model
    }
  }

  // All models failed but a key WAS present — surface this honestly. Users
  // need to know the LLM didn't run; otherwise they'd think "Live AI" is
  // working while reading canned KB output.
  meta.finalMode = 'kb';
  yield '⚠️ The Live AI failed to respond — falling back to the curated knowledge base.\n\n';
  yield `_Reason: ${meta.errors.slice(-1)[0] || 'unknown'}_\n\n`;
  yield '──\n\n';
  yield* streamString(buildKBResponse(lastUser));
}

// Helper — chunk a static string the same way streaming would
async function* streamString(full: string): AsyncGenerator<string, void, unknown> {
  const CHUNK = 6;
  for (let i = 0; i < full.length; i += CHUNK) {
    yield full.slice(i, i + CHUNK);
    if (i < 200) await new Promise(r => setTimeout(r, 6));
  }
}
