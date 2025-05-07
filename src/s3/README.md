# S3 Module

This module provides a service to interact with AWS S3 for object storage operations.

## Exports

- `S3Service`: The main service class for S3 operations.
- All types defined in `types.ts` (e.g., `S3Config`, `UploadParams`, `DownloadResult`, etc.).

## Usage

```typescript
import { S3Service, S3Config } from '@tinhub/node-be-common-lib';
import { Logger } from '@nestjs/common';

// create configuration
const s3Config: S3Config = {
  region: 'eu-west-1',
  accessKeyId: 'YOUR_ACCESS_KEY',
  secretAccessKey: 'YOUR_SECRET_KEY',
  bucketName: 'your-bucket-name',
  logger: new Logger('S3Service'), // optional
};

// create service instance
const s3Service = new S3Service(s3Config);

// example: upload a file
async function uploadMyFile() {
  const filePath = './my-local-file.txt';
  const fileContent = readFileSync(filePath);

  try {
    await s3Service.uploadFile('path/in/s3/my-file.txt', fileContent, {
      contentType: 'text/plain',
    });
    console.log('upload successful');
  } catch (error) {
    console.error('upload failed:', error);
  }
}

// example: download a file
async function downloadMyFile() {
  try {
    const fileContent = await s3Service.getFile('path/in/s3/my-file.txt');
    writeFileSync('./my-downloaded-file.txt', fileContent);
    console.log('download successful');
  } catch (error) {
    console.error('download failed:', error);
  }
}

// example: delete a file
async function deleteMyFile() {
  try {
    await s3Service.deleteFile('path/in/s3/my-file.txt');
    console.log('delete successful');
  } catch (error) {
    console.error('delete failed:', error);
  }
}

// example: list files in a bucket
async function listMyFiles() {
  try {
    const files = await s3Service.listFiles('path/in/s3/');
    console.log('files:', files);
  } catch (error) {
    console.error('list failed:', error);
  }
}

// example: copy a file
async function copyMyFile() {
  try {
    await s3Service.copyFile('path/in/s3/my-file.txt', 'path/in/s3/my-file-copy.txt');
    console.log('copy successful');
  } catch (error) {
    console.error('copy failed:', error);
  }
}

// example: generate a presigned url for download
async function getDownloadLink() {
  try {
    const url = await s3Service.getPresignedUrl('path/in/s3/my-file.txt', 3600); // 1 hour
    console.log('presigned download url:', url);
  } catch (error) {
    console.error('failed to generate presigned url:', error);
  }
}

uploadMyFile();
downloadMyFile();
deleteMyFile();
listMyFiles();
copyMyFile();
getDownloadLink();
``;
```
