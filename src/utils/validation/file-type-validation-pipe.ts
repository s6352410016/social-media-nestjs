import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Express } from 'express';

@Injectable()
export class FileTypeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File[], metadata: ArgumentMetadata) {
    if (!value.length) {
      throw new BadRequestException('File is required');
    }
    const allowedMimeTypes = [
      'image/png',
      'image/jpg',
      'image/jpeg',
      'image/webp',
      'video/mp4',
    ];
    value.forEach((file) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File type ${file.mimetype} is not allow from server`,
        );
      }
    });
    return value;
  }
}
