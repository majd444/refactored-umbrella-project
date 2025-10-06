declare module 'pdf2json' {
  // Minimal type surface for runtime usage in app/api/extract-file/route.ts
  // The actual library is JS-only; this quiets TS during build.
  export default class PDFParser {
    constructor();
    on(event: string, cb: (data: unknown) => void): void;
    loadPDF(filePath: string): void;
    parseBuffer(buf: Buffer): void;
  }
}
