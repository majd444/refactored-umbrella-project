# Content Extraction Service for Fine-Tuning

A specialized service for extracting content from URLs and files (PDF, DOCX, TXT) to create AI fine-tuning datasets.

## Features

- Extract and process content from web URLs
- Extract text from PDF, DOCX, and TXT files
- Automatic content structuring with paragraph extraction
- Generate fine-tuning datasets in JSONL format (compatible with most AI platforms)
- Manage and download your created datasets
- API-based architecture for easy integration

## Installation

1. Install Node.js (v14+ recommended)
2. Clone this repository or copy the extraction service files
3. Install dependencies:

```bash
npm install
```

4. Install PDF processing tools (required for PDF extraction):
   - macOS: `brew install poppler`
   - Ubuntu/Debian: `sudo apt-get install poppler-utils`
   - CentOS/RHEL: `sudo yum install poppler-utils`

## Running the Service

Start the service:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The service will run on port 5050 by default (can be changed using the PORT environment variable).

## API Endpoints

### Health Check

- **URL**: `GET /api/health`
- **Response**: `{ "status": "ok", "message": "Content extraction service for fine-tuning is running" }`

### Extract Content from URL

- **URL**: `POST /api/extract-url`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "url": "https://example.com"
  }
  ```
- **Response**:
  ```json
  {
    "url": "https://example.com",
    "title": "Example Website Title",
    "content": "Extracted text content from the website...",
    "timestamp": "2023-05-10T12:34:56.789Z",
    "metadata": {
      "source": "web",
      "domain": "example.com"
    },
    "saved": true,
    "datasetPath": "/path/to/datasets/web_1620000000000.json"
  }
  ```

### Process File

- **URL**: `POST /api/process-file`
- **Content-Type**: `multipart/form-data`
- **Request Body**: Form data with a file field named "file"
- **Supported file types**: PDF, DOCX, TXT
- **Response**:
  ```json
  {
    "filename": "example.pdf",
    "fileType": "pdf",
    "content": "Extracted text content from the file...",
    "paragraphs": ["Paragraph 1...", "Paragraph 2..."],
    "size": 12345,
    "timestamp": "2023-05-10T12:34:56.789Z",
    "metadata": {
      "source": "file",
      "processingMethod": "pdftotext",
      "paragraphCount": 42
    },
    "saved": true,
    "datasetPath": "/path/to/datasets/file_1620000000000.json"
  }
  ```

### Generate Fine-Tuning Dataset

- **URL**: `POST /api/generate-dataset`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "format": "jsonl",
    "filter": {
      "source": "web",
      "fileType": "pdf"
    }
  }
  ```
- **Supported formats**: `jsonl` (default), `json`
- **Filter options**: `source` (web, file), `fileType` (pdf, docx, txt)
- **Response**:
  ```json
  {
    "success": true,
    "format": "jsonl",
    "count": 42,
    "datasetPath": "/path/to/datasets/finetuning_dataset_1620000000000.jsonl",
    "timestamp": "2023-05-10T12:34:56.789Z"
  }
  ```

### List Available Datasets

- **URL**: `GET /api/datasets`
- **Response**:
  ```json
  {
    "datasets": [
      {
        "filename": "finetuning_dataset_1620000000000.jsonl",
        "size": 1234567,
        "created": "2023-05-10T12:34:56.789Z",
        "modified": "2023-05-10T12:34:56.789Z"
      }
    ],
    "count": 1
  }
  ```

### Download Dataset

- **URL**: `GET /api/datasets/:filename`
- **Response**: File download

## Using the Generated Datasets

The service creates datasets in formats compatible with most AI fine-tuning APIs:

### JSONL Format

The JSONL format follows the chat completion format used by OpenAI, Anthropic, and other AI providers:

```json
{"messages":[{"role":"system","content":"You are a helpful assistant that provides accurate information."},{"role":"user","content":"Please summarize the following content: ..."},{"role":"assistant","content":"Here's a summary of the content: ..."}]}
```

### Integration with Fine-Tuning APIs

Once you've generated your dataset, you can use it with various AI providers:

#### OpenAI

```javascript
const { OpenAI } = require('openai');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function createFineTuningJob() {
  const file = await openai.files.create({
    file: fs.createReadStream('path/to/your/dataset.jsonl'),
    purpose: 'fine-tune',
  });

  const fineTuningJob = await openai.fineTuning.jobs.create({
    training_file: file.id,
    model: 'gpt-3.5-turbo',
  });

  console.log('Fine-tuning job created:', fineTuningJob);
}

createFineTuningJob();
```

## Error Handling

All endpoints return appropriate HTTP status codes with error messages in case of failure:

```json
{
  "error": "Description of the error"
}
```

## Directory Structure

- `/uploads` - Temporary storage for uploaded files
- `/datasets` - Storage for extracted data and generated datasets

## License

MIT 