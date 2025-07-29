import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { FileType } from '../types';

export function putObjectS3(
  files: Express.Multer.File[],
  bucketName: string,
  fileType: FileType,
  s3: S3Client,
) {
  return files.map((file) => {
    return s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: `${fileType}/${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
  });
}
