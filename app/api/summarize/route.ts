import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function error(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const text: string = (body?.text || '').toString();
    const targetChars: number = Math.max(200, Math.min(500_000, Number(body?.targetChars) || 2000));
    const model: string = (body?.model || 'openai/gpt-4o-mini').toString();

    if (!text || text.length < 20) return error('Text is required (>= 20 chars)');

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return error('OPENROUTER_API_KEY not configured on Next.js server', 500);

    const system = `You are a professional summarizer.
Return a concise, faithful summary under ${targetChars} characters.
Prefer bullet points when appropriate. Preserve key facts, dates, amounts, and entities.
Output plain UTF-8 text without markdown fences.`;

    const resp = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Knowledge Summarizer',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: text.slice(0, 1_000_000) },
        ],
      }),
    });

    const textResp = await resp.text();
    if (!resp.ok) {
      return error(`OpenRouter error ${resp.status}`, resp.status, textResp?.slice(0, 500));
    }
    let data: any = {};
    try { data = JSON.parse(textResp); } catch {}
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return error('No content from LLM', 502, data);

    const summary = content.trim().slice(0, targetChars);
    return NextResponse.json({ success: true, summary, model });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return error('Failed to summarize', 500, msg);
  }
}
