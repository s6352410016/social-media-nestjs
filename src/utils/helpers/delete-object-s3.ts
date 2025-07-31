import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FileDir } from '../types';

export function deleteObjectS3(
  fileName: string,
  bucketName: string,
  fileDir: FileDir,
  s3: S3Client,
) {
  return s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: `${fileDir}/${fileName}`,
    }),
  );
}
