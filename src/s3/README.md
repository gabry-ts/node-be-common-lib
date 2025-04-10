# S3 Module

This module provides a service to interact with AWS S3 for object storage operations.

## Exports

- `S3Service`: The main service class for S3 operations.
- All types defined in `types.ts` (e.g., `S3Config`, `UploadParams`, `DownloadResult`, etc.).

## Usage

```typescript
import { S3Service, S3Config, UploadParams } from '@tih/common';
import { Logger } from '@nestjs/common';
import { readFileSync } from 'fs';

// create configuration
const s3Config: S3Config = {
  region: 'eu-west-1',
  // credentials can be omitted if handled by environment variables or iam roles
  // credentials: {
  //   accessKeyId: 'YOUR_ACCESS_KEY',
  //   secretAccessKey: 'YOUR_SECRET_KEY',
  // },
  logger: new Logger('S3Service'), // optional
};

// create service instance
const s3Service = new S3Service(s3Config);

// example: upload a file
async function uploadMyFile() {
  const filePath = './my-local-file.txt';
  const fileContent = readFileSync(filePath);

  const uploadParams: UploadParams = {
    bucket: 'your-bucket-name',
    key: 'path/in/s3/my-file.txt',
    body: fileContent,
    contentType: 'text/plain',
    // acl: 'public-read', // optional
    metadata: {
      // optional
      'custom-data': 'some value',
    },
  };

  try {
    const result = await s3Service.uploadObject(uploadParams);
    console.log(`upload successful: etag=${result.ETag}, versionid=${result.VersionId}`);
    // get public url (if applicable)
    const url = s3Service.getObjectUrl({ bucket: uploadParams.bucket, key: uploadParams.key });
    console.log(`object url: ${url}`);
  } catch (error) {
    console.error('upload failed:', error);
  }
}

// example: generate presigned url for download
async function getDownloadLink() {
  try {
    const url = await s3Service.generatePresignedUrl({
      bucket: 'your-bucket-name',
      key: 'path/in/s3/my-file.txt',
      expiresInSeconds: 3600, // 1 hour
      operation: 'getObject',
    });
    console.log(`presigned download url: ${url}`);
    return url;
  } catch (error) {
    console.error('failed to generate presigned url:', error);
  }
}

uploadMyFile();
getDownloadLink();
```
