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
import { S3Service } from '../S3Service';

// mock the aws sdk
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3Service', () => {
  let s3Service: S3Service;
  const mockS3Client = {
    send: jest.fn(),
  };
  const mockConfig = {
    region: 'eu-west-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    bucketName: 'test-bucket',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (S3Client as jest.Mock).mockImplementation(() => mockS3Client);
    s3Service = new S3Service(mockConfig);
  });

  describe('uploadFile', () => {
    it('should upload a file to s3', async () => {
      // setup
      mockS3Client.send.mockResolvedValueOnce({});
      const key = 'test-file.txt';
      const body = 'test content';
      const metadata = { contentType: 'text/plain' };

      // execute
      await s3Service.uploadFile(key, body, metadata);

      // verify
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.bucketName,
        Key: key,
        Body: body,
        Metadata: metadata,
      });
    });

    it('should handle upload errors', async () => {
      // setup
      const error = new Error('Upload failed');
      mockS3Client.send.mockRejectedValueOnce(error);
      const key = 'test-file.txt';
      const body = 'test content';

      // execute & verify
      await expect(s3Service.uploadFile(key, body)).rejects.toThrow('Upload failed');
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFile', () => {
    it('should get a file from s3', async () => {
      // setup
      const mockBody = {
        transformToString: jest.fn().mockResolvedValueOnce('file content'),
      };
      mockS3Client.send.mockResolvedValueOnce({ Body: mockBody });
      const key = 'test-file.txt';

      // execute
      const result = await s3Service.getFile(key);

      // verify
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.bucketName,
        Key: key,
      });
      expect(result.toString()).toBe('file content');
    });

    it('should handle getFile errors', async () => {
      // setup
      const error = new Error('File not found');
      mockS3Client.send.mockRejectedValueOnce(error);
      const key = 'non-existent-file.txt';

      // execute & verify
      await expect(s3Service.getFile(key)).rejects.toThrow('File not found');
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from s3', async () => {
      // setup
      mockS3Client.send.mockResolvedValueOnce({});
      const key = 'test-file.txt';

      // execute
      await s3Service.deleteFile(key);

      // verify
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.bucketName,
        Key: key,
      });
    });

    it('should handle delete errors', async () => {
      // setup
      const error = new Error('Delete failed');
      mockS3Client.send.mockRejectedValueOnce(error);
      const key = 'test-file.txt';

      // execute & verify
      await expect(s3Service.deleteFile(key)).rejects.toThrow('Delete failed');
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('listFiles', () => {
    it('should list files in a bucket', async () => {
      // setup
      const mockContents = [{ Key: 'file1.txt' }, { Key: 'file2.txt' }];
      mockS3Client.send.mockResolvedValueOnce({ Contents: mockContents });

      // execute
      const result = await s3Service.listFiles();

      // verify
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(ListObjectsV2Command).toHaveBeenCalledWith({
        Bucket: mockConfig.bucketName,
        Prefix: undefined,
      });
      expect(result).toEqual(['file1.txt', 'file2.txt']);
    });

    it('should list files with prefix', async () => {
      // setup
      const mockContents = [{ Key: 'folder/file1.txt' }, { Key: 'folder/file2.txt' }];
      mockS3Client.send.mockResolvedValueOnce({ Contents: mockContents });
      const prefix = 'folder/';

      // execute
      const result = await s3Service.listFiles(prefix);

      // verify
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(ListObjectsV2Command).toHaveBeenCalledWith({
        Bucket: mockConfig.bucketName,
        Prefix: prefix,
      });
      expect(result).toEqual(['folder/file1.txt', 'folder/file2.txt']);
    });

    it('should return empty array when no files found', async () => {
      // setup
      mockS3Client.send.mockResolvedValueOnce({ Contents: null });

      // execute
      const result = await s3Service.listFiles();

      // verify
      expect(result).toEqual([]);
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('copyFile', () => {
    it('should copy a file within the same bucket', async () => {
      // setup
      mockS3Client.send.mockResolvedValueOnce({});
      const sourceKey = 'source/file.txt';
      const destinationKey = 'destination/file.txt';

      // execute
      await s3Service.copyFile(sourceKey, destinationKey);

      // verify
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(CopyObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.bucketName,
        CopySource: `/${mockConfig.bucketName}/${sourceKey}`,
        Key: destinationKey,
      });
    });

    it('should handle copy errors', async () => {
      // setup
      const error = new Error('Copy failed');
      mockS3Client.send.mockRejectedValueOnce(error);
      const sourceKey = 'source/file.txt';
      const destinationKey = 'destination/file.txt';

      // execute & verify
      await expect(s3Service.copyFile(sourceKey, destinationKey)).rejects.toThrow('Copy failed');
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate a presigned url', async () => {
      // setup
      const mockUrl = 'https://test-bucket.s3.amazonaws.com/test-file.txt?signed=true';
      (getSignedUrl as jest.Mock).mockResolvedValueOnce(mockUrl);
      const key = 'test-file.txt';
      const expiresIn = 3600;

      // execute
      const result = await s3Service.getPresignedUrl(key, expiresIn);

      // verify
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.bucketName,
        Key: key,
      });
      expect(getSignedUrl).toHaveBeenCalledWith(mockS3Client, expect.any(Object), { expiresIn });
      expect(result).toBe(mockUrl);
    });

    it('should handle presigned url generation errors', async () => {
      // setup
      const error = new Error('URL generation failed');
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(error);
      const key = 'test-file.txt';
      const expiresIn = 3600;

      // execute & verify
      await expect(s3Service.getPresignedUrl(key, expiresIn)).rejects.toThrow(
        'URL generation failed',
      );
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata', async () => {
      // setup
      const mockMetadata = { contentType: 'text/plain' };
      mockS3Client.send.mockResolvedValueOnce({ Metadata: mockMetadata });
      const key = 'test-file.txt';

      // execute
      const result = await s3Service.getFileMetadata(key);

      // verify
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      expect(HeadObjectCommand).toHaveBeenCalledWith({
        Bucket: mockConfig.bucketName,
        Key: key,
      });
      expect(result).toEqual(mockMetadata);
    });

    it('should return undefined when file does not exist', async () => {
      // setup
      mockS3Client.send.mockRejectedValueOnce(new Error('Not found'));
      const key = 'non-existent-file.txt';

      // execute
      const result = await s3Service.getFileMetadata(key);

      // verify
      expect(result).toBeUndefined();
      expect(mockS3Client.send).toHaveBeenCalledTimes(1);
    });
  });
});
