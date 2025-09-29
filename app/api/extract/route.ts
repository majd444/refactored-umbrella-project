import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { z } from 'zod';

// Helper function to set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Block private/internal URLs
const PRIVATE_IP_REGEX = /^(127\.0\.0\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})$/;

// URL validation schema
const urlSchema = z.object({
  url: z.string().url('Invalid URL format').refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return !parsedUrl.hostname.match(PRIVATE_IP_REGEX) && 
               ['http:', 'https:'].includes(parsedUrl.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Access to local/private networks or invalid protocol' }
  )
});

// Helper function to extract links from HTML
function extractLinksFromHtml(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  const base = new URL(baseUrl);

  $('a').each((_index: number, element: cheerio.Element) => {
    const href = $(element).attr('href') || '';
    try {
      // Handle relative URLs
      const linkUrl = new URL(href, base);
      
      // Only keep HTTP/HTTPS links from the same domain
      if (['http:', 'https:'].includes(linkUrl.protocol)) {
        // Remove hash and query parameters for cleaner URLs
        linkUrl.hash = '';
        linkUrl.search = '';
        links.add(linkUrl.toString());
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Skipping invalid URL (${href}): ${errorMessage}`);
    }
  });

  return Array.from(links);
}

// Convert HTML to readable plain text
function htmlToReadableText(html: string): string {
  const $ = cheerio.load(html, { decodeEntities: true });

  // Remove noise
  $('script, style, noscript, svg, iframe, header, footer, nav, meta, link').remove();

  // Convert <br> to newlines
  $('br').replaceWith('\n');

  // Build lines from common content tags
  const lines: string[] = [];
  const push = (s?: string) => {
    const t = (s || '').replace(/\u00A0/g, ' ').trim();
    if (t) lines.push(t);
  };

  // Headings, paragraphs, list items, table cells
  $('h1, h2, h3, h4, h5, h6, p, li, td, th').each((_i, el) => {
    const tag = el.tagName?.toLowerCase() || '';
    const text = $(el).text();
    // Emphasize headings with spacing
    if (/^h[1-6]$/.test(tag)) {
      push('');
      push(text);
      push('');
    } else if (tag === 'li') {
      push(`- ${text}`);
    } else {
      push(text);
    }
  });

  // Fallback: if nothing captured, take body text
  if (lines.length === 0) {
    const bodyText = $('body').text();
    lines.push(bodyText);
  }

  // Normalize whitespace
  let out = lines.join('\n');
  out = out
    .replace(/[\t\r]+/g, ' ')
    .replace(/[ \u00A0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim();

  // If still looks like raw HTML (doctype etc.), fallback to a simple body text
  if (/<!DOCTYPE|<html|<head|<body/i.test(out)) {
    out = $('body').text().replace(/[\t\r]+/g, ' ').replace(/[ ]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }
  return out;
}

export async function POST(req: NextRequest) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const body = await req.json();
    const { url } = urlSchema.parse(body);

    // Validate URL
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Only http and https protocols are supported');
    }

    // Fetch the HTML content with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const links = extractLinksFromHtml(html, url);
    const text = htmlToReadableText(html);

    return new NextResponse(JSON.stringify({
      success: true,
      text,
      structured: {
        links: links.map(link => ({
          url: link,
          text: new URL(link).hostname
        }))
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Extraction failed:', errorMessage);
    
    return new NextResponse(JSON.stringify({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && error instanceof Error 
        ? { details: error.stack } 
        : {})
    }), {
      status: error instanceof Error && error.message.includes('Failed to fetch') ? 400 : 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// CORS headers are handled in the handlers
export const config = {
  runtime: 'edge',
  // Disable body parsing, we'll handle it manually
  api: {
    bodyParser: false,
  },
};
