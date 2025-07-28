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
import { CommonResponse } from 'src/utils/swagger/common-response';
import { ContentType } from 'generated/prisma';
import { createFileRecords } from 'src/utils/helpers/create-file-records';
import { putObjectToS3 } from 'src/utils/helpers/put-object-s3';
import { genFilesName } from 'src/utils/helpers/gen-files-name';
import { getUrlFromS3 } from 'src/utils/helpers/get-url-from-s3';
import { Express } from 'express';

@Injectable()
export class PostService {
  private s3: S3Client;

  constructor(
    configServiceParam: ConfigService,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    this.s3 = new S3Client({
      region: configServiceParam.get<string>('AWS_BUCKET_REGION')!,
      credentials: {
        accessKeyId: configServiceParam.get<string>('AWS_ACCESS_KEY')!,
        secretAccessKey: configServiceParam.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        )!,
      },
    });
  }

  async createPost(
    createPostDto: CreatePostDto,
    userId: number,
  ): Promise<CommonResponse> {
    if (!userId) {
      throw new BadRequestException('User id must not be equal to 0');
    }

    const { message } = createPostDto;
    try {
      const post = await this.prismaService.post.create({
        data: {
          message,
          userId,
        },
        include: {
          likes: true,
          user: {
            select: {
              id: true,
              fullname: true,
              username: true,
              email: true,
              dateOfBirth: true,
              profileUrl: true,
              profileBackgroundUrl: true,
              info: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              provider: true,
            },
          },
        },
      });

      return {
        status: HttpStatus.CREATED,
        success: true,
        message: 'Created post successfully',
        data: post,
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

  async createPostWithFiles(
    createPostDto: CreatePostDto,
    userId: number,
    files: Express.Multer.File[],
    fileType: 'image' | 'video',
  ): Promise<CommonResponse> {
    const { message } = createPostDto;
    if (!userId) {
      throw new BadRequestException('User id must not be equal to 0');
    }

    try {
      const post = await this.prismaService.post.create({
        data: {
          message,
          userId,
        },
        include: {
          likes: true,
          user: {
            select: {
              id: true,
              fullname: true,
              username: true,
              email: true,
              dateOfBirth: true,
              profileUrl: true,
              profileBackgroundUrl: true,
              info: true,
              role: true,
              createdAt: true,
              updatedAt: true,
              provider: true,
            },
          },
        },
      });

      const newFilesName = genFilesName(files);
      const postFileRecords = createFileRecords(
        newFilesName.map((newFileName) => newFileName.originalname),
        post.id,
        ContentType.POST,
      );
      await this.prismaService.file.createMany({
        data: postFileRecords,
      });

      await Promise.all(
        newFilesName.map((file) => {
          return putObjectToS3(
            {
              Bucket: this.configService.get<string>('AWS_BUCKET_NAME')!,
              Key: `${fileType === 'image' ? 'post-image' : 'post-video'}/${file.originalname}`,
              Body: file.buffer,
              ContentType: file.mimetype,
            },
            this.s3,
          );
        }),
      );

      return {
        status: HttpStatus.CREATED,
        success: true,
        message: `Post with ${fileType === 'image' ? 'images' : 'video'} created successfully`,
        data: {
          ...post,
          filesUrl: getUrlFromS3(
            newFilesName.map((newFileName) => newFileName.originalname),
            this.configService.get<string>('AWS_BUCKET_NAME')!,
            this.configService.get<string>('AWS_BUCKET_REGION')!,
            `${fileType === 'image' ? 'post-image' : 'post-video'}`,
          ),
        },
      };
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        'Cannot create post with iamges something went wrong',
      );
    }
  }
}
