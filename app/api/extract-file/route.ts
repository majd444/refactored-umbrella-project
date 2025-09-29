import { NextRequest, NextResponse } from 'next/server';
import { promisify } from 'util';
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

// Helper function to extract text from PDF buffer
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // First try with pdf-parse
    const pdfData = await import('pdf-parse');
    const data = await pdfData.default(buffer, {
      max: 10 * 1024 * 1024 // 10MB max
    });
    return data.text;
  } catch (error) {
    console.error('PDF parse error, trying fallback method:', error);
    // Fallback to pdftotext if available
    try {
      const tempInput = join(tmpdir(), `temp-${Date.now()}.pdf`);
      const tempOutput = join(tmpdir(), `temp-${Date.now()}.txt`);
      
      await writeFile(tempInput, buffer);
      
      try {
        await execAsync(`pdftotext "${tempInput}" "${tempOutput}"`);
        const fs = await import('fs');
        const { promisify } = await import('util');
        const readFile = promisify(fs.readFile);
        const textContent = await readFile(tempOutput, 'utf-8');
        return textContent;
      } finally {
        // Clean up temp files
        await Promise.allSettled([
          unlink(tempInput).catch(console.error),
          unlink(tempOutput).catch(console.error)
        ]);
      }
    } catch (fallbackError) {
      console.error('Fallback PDF extraction failed:', fallbackError);
      throw new Error('Failed to extract text from PDF');
    }
  }
}

// Helper function to set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Adjust in production
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

    // Check file type
    const fileType = file.type;
    if (!fileType) {
      return errorResponse('Could not determine file type');
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
        try {
          textContent = await extractTextFromPdf(buffer);
          // Try to get page count using a simple regex (not 100% reliable but better than nothing)
          // Use form feed character (\f) to count pages
          const pageCount = (textContent.match(/\f/g) || []).length + 1;
          metadata = { pages: pageCount };
        } catch (error) {
          console.error('PDF extraction failed:', error);
          return errorResponse('Text extraction failed', 500, 'No text content could be extracted from the file');
        }
        break;
      case 'text/plain':
        try {
          textContent = buffer.toString('utf-8');
        } catch (error) {
          console.error('Text file reading failed:', error);
          return errorResponse('Failed to read text file', 400);
        }
        break;
      default:
        return errorResponse('Unsupported file type', 400, { receivedType: fileType });
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
