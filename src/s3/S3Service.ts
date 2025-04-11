import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Config, FileMetadata } from './types';

export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(config: S3Config) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    this.bucketName = config.bucketName;
  }

  /**
   * uploads a file to s3.
   * @param key the key (path) of the file in the bucket.
   * @param body the content of the file.
   * @param metadata optional metadata to associate with the file.
   * @returns promise that resolves when the file is uploaded.
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    metadata?: FileMetadata,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      Metadata: metadata,
    });

    await this.s3Client.send(command);
  }

  /**
   * gets a file from s3.
   * @param key the key (path) of the file in the bucket.
   * @returns promise that resolves with the file content.
   */
  async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    return Buffer.from(await response.Body!.transformToString());
  }

  /**
   * deletes a file from s3.
   * @param key the key (path) of the file in the bucket.
   * @returns promise that resolves when the file is deleted.
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * lists files in a s3 bucket.
   * @param prefix optional prefix to filter files.
   * @returns promise that resolves with a list of file keys.
   */
  async listFiles(prefix?: string): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);
    return response.Contents ? response.Contents.map((item) => item.Key!).filter(Boolean) : [];
  }

  /**
   * copies a file from one location to another within the same s3 bucket.
   * @param sourceKey the key (path) of the source file.
   * @param destinationKey the key (path) of the destination file.
   * @returns promise that resolves when the file is copied.
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    const command = new CopyObjectCommand({
      Bucket: this.bucketName,
      CopySource: `/${this.bucketName}/${sourceKey}`,
      Key: destinationKey,
    });

    await this.s3Client.send(command);
  }

  /**
   * generates a presigned url for accessing a file.
   * @param key the key (path) of the file in the bucket.
   * @param expiresInSeconds the url expiration time in seconds.
   * @returns promise that resolves with the presigned url.
   */
  async getPresignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * gets metadata of a file.
   * @param key the key (path) of the file in the bucket.
   * @returns promise that resolves with the file metadata, or undefined if file does not exist.
   */
  async getFileMetadata(key: string): Promise<FileMetadata | undefined> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return response.Metadata;
    } catch (_error) {
      // assume file doesn't exist if error occurs

      return undefined;
    }
  }
}
