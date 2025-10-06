import { NextRequest, NextResponse } from 'next/server';

// Helper function to set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders,
    },
  });
}

export async function POST(req: NextRequest) {
  // Helper function to create a consistent error response
  const errorResponse = (message: string, status = 400, details?: Record<string, unknown> | string) => {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: message,
        ...(details && { details }),
        timestamp: new Date().toISOString()
      }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  };

  try {
    // Get the file from the form data
    let formData;
    try {
      formData = await req.formData();
    } catch (error) {
      console.error('Form data parsing error:', error);
      return errorResponse('Invalid form data', 400);
    }
    
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file provided');
    }

    // Determine file type (fallback to extension if missing)
    const rawType = file.type;
    const nameLower = (file.name || '').toLowerCase();
    const ext = nameLower.split('.').pop() || '';
    const isPdfByName = ext === 'pdf';
    const fileType = rawType || (isPdfByName ? 'application/pdf' : '');
    if (!fileType) {
      return errorResponse('Could not determine file type', 400, { name: file.name });
    }

    // Convert file to Buffer
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (error) {
      console.error('Error reading file:', error);
      return errorResponse('Failed to read file', 400);
    }
    
    const buffer = Buffer.from(arrayBuffer);
    let textContent = '';
    let metadata = {};

    switch (fileType) {
      case 'application/pdf':
        {
          // 1) Try pdf2json (pure Node, no workers/binaries)
          const tryPdf2Json = async (): Promise<{ text: string }> => {
            try {
              type PDF2JSONCtor = new () => PDF2JSONInstance;
              interface PDF2JSONInstance {
                on: (event: string, cb: (data: unknown) => void) => void;
                parseBuffer: (buf: Buffer) => void;
              }
              type PDF2JSONModule = { default?: PDF2JSONCtor } | { PDFParser?: PDF2JSONCtor };

              const mod = (await import('pdf2json')) as unknown as PDF2JSONModule;
              const PDFParserCtor: PDF2JSONCtor | undefined =
                ('default' in mod && mod.default ? mod.default : undefined) ??
                ('PDFParser' in mod && mod.PDFParser ? mod.PDFParser : undefined);
              if (!PDFParserCtor) throw new Error('pdf2json not available');

              const parser: PDF2JSONInstance = new PDFParserCtor();
              const text = await new Promise<string>((resolve, reject) => {
                const collected: string[] = [];
                parser.on('pdfParser_dataError', (err: unknown) => {
                  reject(err instanceof Error ? err : new Error('PDF parse error'));
                });
                parser.on('pdfParser_dataReady', (pdfData: unknown) => {
                  const data = pdfData as { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> };
                  const pages = Array.isArray(data.Pages) ? data.Pages : [];
                  for (const page of pages) {
                    const texts = Array.isArray(page.Texts) ? page.Texts : [];
                    const parts: string[] = [];
                    for (const t of texts) {
                      const runs = Array.isArray(t.R) ? t.R : [];
                      for (const r of runs) {
                        const enc = typeof r.T === 'string' ? r.T : '';
                        try { parts.push(decodeURIComponent(enc)); } catch { parts.push(enc); }
                      }
                    }
                    if (parts.length) collected.push(parts.join(' '));
                  }
                  resolve(collected.join('\n'));
                });
                parser.parseBuffer(buffer);
              });
              return { text };
            } catch (e) {
              throw e;
            }
          };

          // 2) Try pdf-parse as a fallback (dynamic import to avoid build-time side-effects)
          const tryPdfParse = async (): Promise<{ text: string; pages?: number }> => {
            const mod = await import('pdf-parse');
            const pdf = (mod as unknown as { default: (b: Buffer) => Promise<{ text?: string; numpages?: number }> }).default;
            const data = await pdf(buffer);
            return { text: (data.text || '').trim(), pages: (data as unknown as { numpages?: number }).numpages };
          };

          // Attempt extraction
          try {
            const r1 = await tryPdf2Json();
            if (r1.text && r1.text.length > 0) {
              textContent = r1.text.trim();
              metadata = {};
              break;
            }
          } catch (e) {
            // swallow and try fallback
          }
          try {
            const r2 = await tryPdfParse();
            if (r2.text && r2.text.length > 0) {
              textContent = r2.text;
              metadata = { pages: r2.pages };
              break;
            }
          } catch (err) {
            console.error('PDF parse failed (fallback):', err);
          }

          // Final graceful fallback
          textContent = '[PDF uploaded: text extraction failed]';
          metadata = { note: 'No extractable text' };
          break;
        }
      case 'text/plain':
        try {
          textContent = buffer.toString('utf-8');
        } catch (error) {
          console.error('Text file reading failed:', error);
          return errorResponse('Failed to read text file', 400);
        }
        break;
      default:
        // Allow common opaque uploads but infer by name
        if (fileType === 'application/octet-stream' && isPdfByName) {
          // Reuse same strategy for octet-stream + .pdf
          try {
            const r1 = await (async () => {
              try {
                type PDF2JSONCtor = new () => PDF2JSONInstance;
                interface PDF2JSONInstance {
                  on: (event: string, cb: (data: unknown) => void) => void;
                  parseBuffer: (buf: Buffer) => void;
                }
                type PDF2JSONModule = { default?: PDF2JSONCtor } | { PDFParser?: PDF2JSONCtor };
                const mod = (await import('pdf2json')) as unknown as PDF2JSONModule;
                const PDFParserCtor: PDF2JSONCtor | undefined =
                  ('default' in mod && mod.default ? mod.default : undefined) ??
                  ('PDFParser' in mod && mod.PDFParser ? mod.PDFParser : undefined);
                if (!PDFParserCtor) throw new Error('pdf2json not available');
                const parser: PDF2JSONInstance = new PDFParserCtor();
                const text = await new Promise<string>((resolve, reject) => {
                  const collected: string[] = [];
                  parser.on('pdfParser_dataError', (err: unknown) => reject(err instanceof Error ? err : new Error('PDF parse error')));
                  parser.on('pdfParser_dataReady', (pdfData: unknown) => {
                    const data = pdfData as { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> };
                    const pages = Array.isArray(data.Pages) ? data.Pages : [];
                    for (const page of pages) {
                      const texts = Array.isArray(page.Texts) ? page.Texts : [];
                      const parts: string[] = [];
                      for (const t of texts) {
                        const runs = Array.isArray(t.R) ? t.R : [];
                        for (const r of runs) {
                          const enc = typeof r.T === 'string' ? r.T : '';
                          try { parts.push(decodeURIComponent(enc)); } catch { parts.push(enc); }
                        }
                      }
                      if (parts.length) collected.push(parts.join(' '));
                    }
                    resolve(collected.join('\n'));
                  });
                  parser.parseBuffer(buffer);
                });
                return { text };
              } catch (e) { throw e; }
            })();
            if (r1.text && r1.text.length > 0) {
              textContent = r1.text.trim();
              metadata = {};
              break;
            }
          } catch {}
          try {
            const mod = await import('pdf-parse');
            const pdf = (mod as unknown as { default: (b: Buffer) => Promise<{ text?: string; numpages?: number }> }).default;
            const data = await pdf(buffer);
            textContent = (data.text || '').trim();
            metadata = { pages: (data as unknown as { numpages?: number }).numpages };
            break;
          } catch (err) {
            console.error('PDF extraction failed (octet-stream fallback):', err);
            textContent = '[PDF uploaded: text extraction failed]';
            metadata = { note: 'PDF extraction failed', error: (err as Error)?.message };
            break;
          }
        }
        return errorResponse('Unsupported file type', 400, { receivedType: fileType, name: file.name });
    }

    // Clean up text content if we have any
    if (textContent) {
      textContent = textContent
        .replace(/[\r\n\t]+/g, '\n')  // Normalize line endings
        .replace(/[^\x20-\x7E\n]/g, '') // Remove non-ASCII and control chars
        .replace(/\s+/g, ' ')          // Replace multiple spaces
        .replace(/\n{3,}/g, '\n\n')    // Limit consecutive newlines
        .trim();
    }

    // Return the extracted text
    return new NextResponse(
      JSON.stringify({
        success: true,
        text: textContent,
        fileName: file.name,
        ...metadata,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Failed to extract text from file', 500, error instanceof Error ? error.message : 'Unknown error');
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle it manually
  },
};

// Ensure Node.js runtime for compatibility with libraries and fs/child_process usage
export const runtime = 'nodejs';
// Prevent Next.js from attempting to prerender or collect static data for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
