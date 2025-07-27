import { S3Client } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { CommonResponse } from 'src/utils/swagger/CommonResponse';
import { findFiles } from 'src/utils/helpers/findFiles';
import { Express } from 'express';

@Injectable()
export class PostService {
  private s3: S3Client;

  constructor(
    configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    this.s3 = new S3Client({
      region: configService.get<string>('AWS_BUCKET_REGION')!,
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY')!,
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
  }

  async createPost(createPostDto: CreatePostDto, userId: number): Promise<CommonResponse> {
    const { message } = createPostDto;
    try {
      const post = await this.prismaService.post.create({
        data: {
          message,
          userId,
        },
        include: {
          likes: true,
        },
      });
      const files = await findFiles(post.id, this.prismaService);

      return {
        status: HttpStatus.CREATED,
        success: true,
        message: 'Created post successfully',
        data: {
          ...post,
          files,
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('Failed to create post');
      }

      throw new InternalServerErrorException(
        'Unexpected error failed to create post',
      );
    }
  }

  async createPostWithImages() {}
}
