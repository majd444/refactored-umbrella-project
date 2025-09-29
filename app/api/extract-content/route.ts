import { NextRequest, NextResponse } from 'next/server';
// Import pdf-parse with default import since we want to use it as a function
import pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

// Helper function to set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Supported file types
const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'application/msword': 'doc',
} as const;

export async function POST(req: NextRequest) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: 'No file provided' }), 
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if file type is supported
    const fileType = SUPPORTED_TYPES[file.type as keyof typeof SUPPORTED_TYPES];
    if (!fileType) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unsupported file type',
          supportedTypes: Object.keys(SUPPORTED_TYPES)
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Process file based on type
    const arrayBuffer = await file.arrayBuffer();
    let textContent = '';
    let metadata = {};

    switch (fileType) {
      case 'pdf':
        const pdfData = await pdf(Buffer.from(arrayBuffer));
        textContent = pdfData.text;
        metadata = {
          pages: pdfData.numpages,
          info: pdfData.info,
        };
        break;

      case 'docx':
      case 'doc':
        const docxResult = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        textContent = docxResult.value;
        break;

      case 'txt':
        textContent = Buffer.from(arrayBuffer).toString('utf-8');
        break;
    }

    // Clean up text content
    textContent = textContent
      .replace(/\s+/g, ' ')      // Replace multiple spaces
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .trim();

    return new NextResponse(
      JSON.stringify({
        success: true,
        fileName: file.name,
        fileType,
        content: textContent,
        size: file.size,
        timestamp: new Date().toISOString(),
        metadata,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: unknown) {
    console.error('Error processing file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Failed to process file',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle it manually
  },
};
