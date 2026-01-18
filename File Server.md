# SimpleS3 - A Simple S3-Like File Storage Server

A lightweight, secure, and high-performance file storage server with S3-like API, built with Node.js and Express.

## Features

- 🔐 **Bearer Token Authentication** - Secure API access via `.env` configuration
- 🌐 **Public Read Mode** - Optional public file access for browsers (images, downloads)
- 📁 **CRUD Operations** - Create, Read, Update, Delete files via REST API
- 🛡️ **Security** - Path traversal protection, timing-safe token comparison
- ⚡ **High Performance** - Clustering, streaming, compression, and caching
- 📦 **Simple Setup** - Just install dependencies and run

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure your environment:**
   Edit `.env` and set your options:
   ```env
   API_TOKEN=your-super-secure-random-token
   PUBLIC_READ=true   # Allow browsers to access files directly
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `API_TOKEN` | Bearer token for authentication | Required |
| `PORT` | Server port | `3000` |
| `STORAGE_DIR` | Directory for file storage | `./storage` |
| `ENABLE_CLUSTER` | Use all CPU cores | `true` |
| `NUM_WORKERS` | Number of worker processes | CPU cores |
| `PUBLIC_READ` | Allow public GET/HEAD on files | `false` |

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/health` | ✅ Yes | Health check |
| `GET` | `/files` | ✅ Yes | List all files |
| `POST` | `/files` | ✅ Yes | Upload file (auto-generated key) |
| `PUT` | `/files/:key` | ✅ Yes | Upload file with specific key |
| `GET` | `/files/:key` | ⚡ Optional* | Download file |
| `HEAD` | `/files/:key` | ⚡ Optional* | Get file metadata |
| `DELETE` | `/files/:key` | ✅ Yes | Delete file |

> *When `PUBLIC_READ=true`, GET/HEAD on `/files/:key` are public (no auth needed).

---

## Public Read Mode

Enable `PUBLIC_READ=true` in `.env` to allow browsers and users to access files directly via URL without authentication.

### Use Cases
- Serving images in web pages (`<img src="...">`)
- Direct download links (`<a href="...">`)
- Embedding resources in applications

### How It Works

| Endpoint | `PUBLIC_READ=false` | `PUBLIC_READ=true` |
|----------|---------------------|-------------------|
| `GET /files/:key` | 🔒 Auth required | 🌐 **PUBLIC** |
| `HEAD /files/:key` | 🔒 Auth required | 🌐 **PUBLIC** |
| All other endpoints | 🔒 Auth required | 🔒 Auth required |

### Example Usage

```html
<!-- When PUBLIC_READ=true, browsers can access directly -->
<img src="http://your-server:3000/files/avatar.jpg" alt="Avatar">
<a href="http://your-server:3000/files/document.pdf">Download PDF</a>
```

---

## Usage Examples

### Using cURL

#### List all files
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/files
```

#### Upload a file with specific key
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/file.txt" \
  http://localhost:3000/files/myfile.txt
```

#### Upload a file with auto-generated key
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/file.txt" \
  http://localhost:3000/files
```

#### Download a file (with auth)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/files/myfile.txt \
  -o downloaded-file.txt
```

#### Download a file (PUBLIC_READ=true, no auth needed)
```bash
curl http://localhost:3000/files/myfile.txt -o downloaded-file.txt
```

#### Get file metadata
```bash
curl -I -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/files/myfile.txt
```

#### Delete a file
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/files/myfile.txt
```

---

### Using Node.js

#### Setup
```bash
npm install node-fetch form-data
```

#### Complete Node.js Client Example

```javascript
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const API_URL = 'http://localhost:3000';
const API_TOKEN = 'your-token-here';

const headers = {
  'Authorization': `Bearer ${API_TOKEN}`
};

// List all files
async function listFiles() {
  const response = await fetch(`${API_URL}/files`, { headers });
  const data = await response.json();
  console.log('Files:', data);
  return data;
}

// Upload a file with specific key
async function uploadFile(filePath, key) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await fetch(`${API_URL}/files/${key}`, {
    method: 'PUT',
    headers: {
      ...headers,
      ...form.getHeaders()
    },
    body: form
  });

  const data = await response.json();
  console.log('Upload result:', data);
  return data;
}

// Upload with auto-generated key
async function uploadFileAuto(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await fetch(`${API_URL}/files`, {
    method: 'POST',
    headers: {
      ...headers,
      ...form.getHeaders()
    },
    body: form
  });

  const data = await response.json();
  console.log('Upload result:', data);
  return data;
}

// Download a file (works without auth if PUBLIC_READ=true)
async function downloadFile(key, outputPath, useAuth = true) {
  const options = useAuth ? { headers } : {};
  const response = await fetch(`${API_URL}/files/${key}`, options);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const buffer = await response.buffer();
  fs.writeFileSync(outputPath, buffer);
  console.log(`Downloaded to ${outputPath}`);
}

// Download as stream (memory efficient for large files)
async function downloadFileStream(key, outputPath, useAuth = true) {
  const options = useAuth ? { headers } : {};
  const response = await fetch(`${API_URL}/files/${key}`, options);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const fileStream = fs.createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`Downloaded to ${outputPath}`);
}

// Get file metadata
async function getFileMetadata(key) {
  const response = await fetch(`${API_URL}/files/${key}`, {
    method: 'HEAD',
    headers
  });

  const metadata = {
    size: response.headers.get('content-length'),
    lastModified: response.headers.get('last-modified'),
    etag: response.headers.get('etag')
  };

  console.log('Metadata:', metadata);
  return metadata;
}

// Delete a file
async function deleteFile(key) {
  const response = await fetch(`${API_URL}/files/${key}`, {
    method: 'DELETE',
    headers
  });

  const data = await response.json();
  console.log('Delete result:', data);
  return data;
}

// Example usage
async function main() {
  try {
    // List files
    await listFiles();

    // Upload a file
    await uploadFile('./myfile.txt', 'myfile.txt');

    // Get metadata
    await getFileMetadata('myfile.txt');

    // Download the file (no auth needed if PUBLIC_READ=true)
    await downloadFile('myfile.txt', './downloaded.txt', false);

    // Delete the file
    await deleteFile('myfile.txt');

    // List files again
    await listFiles();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

---

### Using Python

```python
import requests

API_URL = 'http://localhost:3000'
API_TOKEN = 'your-token-here'

headers = {
    'Authorization': f'Bearer {API_TOKEN}'
}

# List all files
def list_files():
    response = requests.get(f'{API_URL}/files', headers=headers)
    return response.json()

# Upload a file
def upload_file(file_path, key):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.put(
            f'{API_URL}/files/{key}',
            headers=headers,
            files=files
        )
    return response.json()

# Download a file (no auth needed if PUBLIC_READ=true)
def download_file(key, output_path, use_auth=True):
    h = headers if use_auth else {}
    response = requests.get(f'{API_URL}/files/{key}', headers=h)
    with open(output_path, 'wb') as f:
        f.write(response.content)

# Delete a file
def delete_file(key):
    response = requests.delete(f'{API_URL}/files/{key}', headers=headers)
    return response.json()

# Example usage
if __name__ == '__main__':
    print(list_files())
    print(upload_file('myfile.txt', 'myfile.txt'))
    download_file('myfile.txt', 'downloaded.txt', use_auth=False)  # No auth if PUBLIC_READ=true
    print(delete_file('myfile.txt'))
```

---

### Using Browser (Fetch API)

```javascript
const API_URL = 'http://localhost:3000';
const API_TOKEN = 'your-token-here';

const headers = {
  'Authorization': `Bearer ${API_TOKEN}`
};

// List all files
async function listFiles() {
  const response = await fetch(`${API_URL}/files`, { headers });
  return response.json();
}

// Upload a file from input element
async function uploadFile(fileInput, key) {
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  const response = await fetch(`${API_URL}/files/${key}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    body: formData
  });

  return response.json();
}

// Download a file (no auth needed if PUBLIC_READ=true)
async function downloadFile(key) {
  // If PUBLIC_READ=true, just open the URL directly
  window.open(`${API_URL}/files/${key}`, '_blank');
}

// Delete a file
async function deleteFile(key) {
  const response = await fetch(`${API_URL}/files/${key}`, {
    method: 'DELETE',
    headers
  });
  return response.json();
}

// Direct usage in HTML (when PUBLIC_READ=true)
// <img src="http://localhost:3000/files/image.jpg">
// <a href="http://localhost:3000/files/document.pdf">Download</a>
```

---

## Deployment with PM2

### Option 1: Simple command (recommended)

Add this to your startup script:
```bash
npx pm2 start ./path/to/server.js --name simples3 -i max --env ENABLE_CLUSTER=false
```

The `-i max` uses PM2's cluster mode, and `--env ENABLE_CLUSTER=false` disables the built-in cluster to avoid double-clustering.

### Option 2: Using ecosystem.config.cjs

```bash
npm run pm2:start    # Start with PM2 cluster mode
npm run pm2:stop     # Stop the app
npm run pm2:restart  # Restart all workers
npm run pm2:logs     # View logs
npm run pm2:status   # Check status
```

---

## Performance Optimizations

| Optimization | Description |
|--------------|-------------|
| **Cluster Mode** | Uses all CPU cores for parallel request handling |
| **Gzip Compression** | Compresses responses > 1KB to reduce bandwidth |
| **Streaming** | Streams large files instead of buffering in memory |
| **ETag Caching** | Client-side caching with `304 Not Modified` support |
| **Metadata Cache** | In-memory cache for file stats (5s TTL) |
| **Keep-Alive** | Reuses TCP connections (30s timeout) |

## Security Features

- **Bearer Token Auth** - All write operations protected with constant-time comparison
- **Timing-Safe Comparison** - Prevents timing attacks on token validation
- **Path Traversal Protection** - Sanitizes file keys to prevent directory escape
- **File Size Limit** - 100MB maximum upload size
- **Optional Public Read** - Configurable public access for read operations only

## License

MIT
