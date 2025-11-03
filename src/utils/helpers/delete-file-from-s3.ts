import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { File } from 'generated/prisma';
import { getFileNameFromPresignedUrl } from './get-filename-from-presigned-url';
import { getFileDirFromPresignedUrl } from './get-file-dir-from-presigned-url';
import { deleteObjectS3 } from './delete-object-s3';
import { FileDir } from '../types';

export function deleteFileFromS3(
  file: File,
  configService: ConfigService,
  s3: S3Client,
) {
  const fileName = getFileNameFromPresignedUrl(file.fileUrl);
  const fileDir = getFileDirFromPresignedUrl(file.fileUrl) as FileDir;
  return deleteObjectS3(
    fileName,
    configService.get<string>('AWS_BUCKET_NAME')!,
    fileDir,
    s3,
  );
}
