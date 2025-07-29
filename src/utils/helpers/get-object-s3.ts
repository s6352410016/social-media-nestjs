import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileType } from '../types';

export function getObjectS3(
  filesName: string[],
  bucketName: string,
  fileType: FileType,
  s3: S3Client,
) {
  return filesName.map((fileName) => {
    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: `${fileType}/${fileName}`,
      }),
      {
        expiresIn: 60 * 5
      }
    );
  });
}
