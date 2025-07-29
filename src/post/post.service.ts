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
import { putObjectS3 } from 'src/utils/helpers/put-object-s3';
import { getObjectS3 } from 'src/utils/helpers/get-object-s3';
import { genFilesName } from 'src/utils/helpers/gen-files-name';
import { findFiles } from 'src/utils/helpers/find-files';
import { FileType } from 'src/utils/types';
import { Express } from 'express';
import { getFileNameFromPresignedUrl } from 'src/utils/helpers/get-filename-from-presigned-url';
import { getDirFromPresignedUrl } from 'src/utils/helpers/get-dir-from-presigned-url';

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
    fileType: FileType,
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
            },
          },
        },
      });

      const newFilesName = genFilesName(files);
      await Promise.all(
        putObjectS3(
          newFilesName,
          this.configService.get<string>('AWS_BUCKET_NAME')!,
          fileType,
          this.s3,
        ),
      );

      const filesUrl = await Promise.all(
        getObjectS3(
          newFilesName.map((file) => file.originalname),
          this.configService.get<string>('AWS_BUCKET_NAME')!,
          fileType,
          this.s3,
        ),
      );

      const postFileRecords = createFileRecords(
        filesUrl,
        post.id,
        ContentType.POST,
      );
      await this.prismaService.file.createMany({
        data: postFileRecords,
      });

      return {
        status: HttpStatus.CREATED,
        success: true,
        message: `Post with ${fileType === FileType.IMAGE ? 'images' : 'video'} created successfully`,
        data: {
          ...post,
          filesUrl,
        },
      };
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException(
          'Cannot create post with iamges something went wrong',
        );
      }

      throw new InternalServerErrorException('Unexpected error');
    }
  }

  async createSharePost(
    userId: number,
    parentId: number,
    createPostDto: CreatePostDto,
  ): Promise<CommonResponse> {
    const { message } = createPostDto;
    if (!userId) {
      throw new BadRequestException('User id must not be equal to 0');
    }

    try {
      const sharePost = await this.prismaService.post.create({
        data: {
          message,
          userId,
          parentId,
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
            },
          },
        },
      });

      return {
        status: HttpStatus.CREATED,
        success: true,
        message: `Share post created successfully`,
        data: sharePost,
      };
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new BadRequestException(
          'Cannot create post with iamges something went wrong',
        );
      }

      throw new InternalServerErrorException('Unexpected error');
    }
  }

  async findPosts(): Promise<CommonResponse> {
    try {
      const posts = await this.prismaService.post.findMany({
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
            },
          },
        },
      });

      const postsWithFiles = await Promise.all(
        posts.map(async (post) => {
          const files = await findFiles(post.id, this.prismaService);
          const filesUrl = files.map((file) => file.fileName);
          const filesData = filesUrl.map((fileUrl) => {
            const fileName = getFileNameFromPresignedUrl(fileUrl);
            const dirName = getDirFromPresignedUrl(fileUrl);
            return {
              fileName,
              dirName,
            };
          });
          const [filesFromS3Array] = filesData.map((fileData) => {
            return getObjectS3(
              filesData.map((file) => file.fileName),
              this.configService.get<string>('AWS_BUCKET_NAME')!,
              fileData.dirName === FileType.IMAGE
                ? FileType.IMAGE
                : FileType.VIDEO,
              this.s3,
            );
          });
          const filesFromS3 = await Promise.all(filesFromS3Array);
          
          return {
            ...post,
            filesUrl: filesFromS3,
          };
        }),
      );

      return {
        status: HttpStatus.OK,
        success: true,
        message: 'Post retrived succussfully',
        data: postsWithFiles,
      };
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Cannot get post with iamges something went wrong',
        );
      }

      throw new InternalServerErrorException('Unexpected error');
    }
  }
}
