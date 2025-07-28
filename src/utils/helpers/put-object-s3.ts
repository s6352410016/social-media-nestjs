import { PutObjectCommand, PutObjectCommandInput, S3Client } from '@aws-sdk/client-s3';

export function putObjectToS3(command: PutObjectCommandInput, s3: S3Client) {
  return s3.send(new PutObjectCommand(command));
}
