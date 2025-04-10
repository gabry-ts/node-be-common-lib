export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export interface FileMetadata {
  [key: string]: string;
}
