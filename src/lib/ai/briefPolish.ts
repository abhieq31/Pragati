import { cached, CACHE_ENABLED } from '@/lib/cache';
import type { DailyBrief } from '@/lib/brief';

/**
 * Optional AI flavour for the Morning Brief headline — the ONLY place an LLM
 * touches the daily rundown, and exactly within the architectural invariant:
 * selection and ranking stay rule-based; the model may only rephrase the
 * already-decided sentence into something a touch more human.
 *
 * Hard guarantees:
 *   • No GEMINI_API_KEY → instant no-op (the rule-based headline stands).
 *   • One model call per user per day, memoised in-process and (when Upstash
 *     is configured) in the shared cache — the free tier never strains.
 *   • 1.5s budget; every number from the original must survive the rewrite,
 *     or the original is used. AI here is flavour, never a dependency.
 */

const MODEL_ORDER = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
const TIMEOUT_MS = 1500;

// In-process memo for the (common) case where Upstash isn't configured —
// a warm serverless instance polishes each user's headline once per day.
const memo = new Map<string, string>();

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('ai_timeout')), ms))]);
}

async function rephrase(headline: string, role: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return headline;
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt =
    `Rewrite this work-status headline for a ${role} in at most 18 words. ` +
    `Keep every number exactly. Be warm but factual; no emojis, no exclamation marks, ` +
    `no greetings. Reply with the sentence only.\n\nHeadline: ${headline}`;

  for (const modelName of MODEL_ORDER) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.4, maxOutputTokens: 60 },
      });
      const res = await withTimeout(model.generateContent(prompt), TIMEOUT_MS);
      const text = res.response
        .text()
        .trim()
        .replace(/^["'“”]+|["'“”]+$/g, '');
      const numbersSurvive = (headline.match(/\d+/g) || []).every((n) => text.includes(n));
      if (text.length >= 8 && text.length <= 160 && numbersSurvive) return text;
      return headline;
    } catch {
      /* try the next model, then give up gracefully */
    }
  }
  return headline;
}

/** Polish a brief's headline. Always safe to call; never throws. */
export async function polishHeadline(userId: string, brief: DailyBrief): Promise<string> {
  if (!process.env.GEMINI_API_KEY || !brief.hasContent) return brief.headline;
  const key = `brief:headline:v1:${userId}:${brief.dateLabel}:${brief.headline.length}`;
  const local = memo.get(key);
  if (local) return local;
  try {
    const result = CACHE_ENABLED
      ? await cached(key, 20 * 60 * 60, () => rephrase(brief.headline, brief.role))
      : await rephrase(brief.headline, brief.role);
    memo.set(key, result);
    if (memo.size > 2000) memo.clear(); // bound the per-instance memo
    return result;
  } catch {
    return brief.headline;
  }
}
