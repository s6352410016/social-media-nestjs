import { DeleteObjectCommandOutput, S3Client } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
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
import { getFileNameFromPresignedUrl } from 'src/utils/helpers/get-filename-from-presigned-url';
import { UpdatePostDto } from './dto/update-post.dto';
import { deleteObjectS3 } from 'src/utils/helpers/delete-object-s3';
import { getFileDirFromFile } from 'src/utils/helpers/get-file-dir-from-file';
import { getFileDirFromPresignedUrl } from 'src/utils/helpers/get-file-dir-from-presigned-url';
import { FileDir } from 'src/utils/types';
import { NotificationService } from 'src/notification/notification.service';
import { createNotifications } from 'src/utils/helpers/create-notifications';
import { createNotification } from 'src/utils/helpers/create-notification';
import { Express } from 'express';

@Injectable()
export class PostService {
  private s3: S3Client;

  constructor(
    configServiceParam: ConfigService,
    private configService: ConfigService,
    private prismaService: PrismaService,
    private notificationService: NotificationService,
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
    createPostDto: CreatePostDto & { userId: number; },
    files: Express.Multer.File[],
  ): Promise<CommonResponse> {
    const { message, userId } = createPostDto;
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

      if (!files || !files.length) {
        await createNotifications(
          this.prismaService,
          this.notificationService,
          userId,
          post.id,
        );

        return {
          status: HttpStatus.CREATED,
          success: true,
          message: 'Post created successfully',
          data: post,
        };
      }

      if (files && files.length) {
        const newFilesName = genFilesName(files);
        await Promise.all(
          newFilesName.map((newFileName) => {
            const fileDir = getFileDirFromFile(newFileName);
            return putObjectS3(
              newFileName,
              this.configService.get<string>('AWS_BUCKET_NAME')!,
              fileDir,
              this.s3,
            );
          }),
        );

        const filesUrl = await Promise.all(
          newFilesName.map((newFileName) => {
            const fileDir = getFileDirFromFile(newFileName);
            return getObjectS3(
              newFileName.originalname,
              this.configService.get<string>('AWS_BUCKET_NAME')!,
              fileDir,
              this.s3,
            );
          }),
        );

        const postFileRecords = createFileRecords(
          filesUrl,
          post.id,
          ContentType.POST,
        );
        await this.prismaService.file.createMany({
          data: postFileRecords,
        });
        await createNotifications(
          this.prismaService,
          this.notificationService,
          userId,
          post.id,
        );

        return {
          status: HttpStatus.CREATED,
          success: true,
          message: `Post created successfully`,
          data: {
            ...post,
            filesUrl,
          },
        };
      }

      throw new BadRequestException('Cannot create post');
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(error.message);
      } else if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
    }
  }

  async createSharePost(
    createPostDto: CreatePostDto & { userId: number; parentId: number; },
  ): Promise<CommonResponse> {
    const { message, userId, parentId } = createPostDto;
    if (!userId) {
      throw new BadRequestException('User id must not be equal to 0');
    }

    try {
      const post = await this.prismaService.post.findUnique({
        where: {
          id: parentId,
        },
      });
      if (!post) {
        throw new NotFoundException(`Parent id ${parentId} not found`);
      }

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
      await createNotification(
        this.notificationService,
        userId,
        post,
      );

      return {
        status: HttpStatus.CREATED,
        success: true,
        message: `Share post created successfully`,
        data: sharePost,
      };
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(error.message);
      } else if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
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
          const filesUrl = files.map((file) => file.fileUrl);
          const filesFromS3 = await Promise.all(
            filesUrl.map((fileUrl) => {
              const fileName = getFileNameFromPresignedUrl(fileUrl);
              const fileDir = getFileDirFromPresignedUrl(fileUrl) as FileDir;
              return getObjectS3(
                fileName,
                this.configService.get<string>('AWS_BUCKET_NAME')!,
                fileDir,
                this.s3,
              );
            }),
          );

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
        throw new InternalServerErrorException(error.message);
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
    }
  }

  async findPostById(postId: number): Promise<CommonResponse> {
    if (!postId) {
      throw new BadRequestException('Post id must not be equal to 0');
    }

    try {
      const post = await this.prismaService.post.findUnique({
        where: {
          id: postId,
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
      if (!post) {
        throw new NotFoundException(`Post id ${postId} not found`);
      }

      const files = await findFiles(post.id, this.prismaService);
      const filesUrl = files.map((file) => file.fileUrl);
      const filesFromS3 = await Promise.all(
        filesUrl.map((fileUrl) => {
          const fileName = getFileNameFromPresignedUrl(fileUrl);
          const fileDir = getFileDirFromPresignedUrl(fileUrl) as FileDir;
          return getObjectS3(
            fileName,
            this.configService.get<string>('AWS_BUCKET_NAME')!,
            fileDir,
            this.s3,
          );
        }),
      );

      return {
        status: HttpStatus.OK,
        success: true,
        message: 'Post retrived succussfully',
        data: {
          ...post,
          filesUrl: filesFromS3,
        },
      };
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(error.message);
      } else if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
    }
  }

  async findPostByUser(userId: number): Promise<CommonResponse> {
    if (!userId) {
      throw new BadRequestException('User id must not be equal to 0');
    }

    try {
      const posts = await this.prismaService.post.findMany({
        where: {
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
      if (!posts || !posts.length) {
        throw new NotFoundException(`Post by user id ${userId} not found`);
      }

      const postsWithFiles = await Promise.all(
        posts.map(async (post) => {
          const files = await findFiles(post.id, this.prismaService);
          const filesUrl = files.map((file) => file.fileUrl);
          const filesFromS3 = await Promise.all(
            filesUrl.map((fileUrl) => {
              const fileName = getFileNameFromPresignedUrl(fileUrl);
              const fileDir = getFileDirFromPresignedUrl(fileUrl) as FileDir;
              return getObjectS3(
                fileName,
                this.configService.get<string>('AWS_BUCKET_NAME')!,
                fileDir,
                this.s3,
              );
            }),
          );
          return {
            ...post,
            filesUrl: filesFromS3,
          };
        }),
      );

      return {
        status: HttpStatus.OK,
        success: true,
        message: 'Post retrieved successfully',
        data: postsWithFiles,
      };
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(error.message);
      } else if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
    }
  }

  async updatePost(
    updatePostDto: UpdatePostDto & { postId: number },
    files?: Express.Multer.File[],
  ): Promise<CommonResponse> {
    const { message, postId } = updatePostDto;
    if (!postId) {
      throw new BadRequestException('Post id must not be equal to 0');
    }

    try {
      const postRecord = await this.prismaService.post.findUnique({
        where: {
          id: postId,
        },
      });
      if (!postRecord) {
        throw new NotFoundException(`Post id ${postId} not found`);
      }

      const post = await this.prismaService.post.update({
        where: {
          id: postId,
        },
        data: {
          message,
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

      if (!files || !files.length) {
        const fileRecords = await this.prismaService.file.findMany({
          where: {
            contentId: post.id,
            contentType: ContentType.POST,
          },
        });

        let filesData: { fileName: string; fileDir: FileDir }[] = [];
        fileRecords.forEach((fileRecord) => {
          const fileDir = getFileDirFromPresignedUrl(
            fileRecord.fileUrl,
          ) as FileDir;
          const fileName = getFileNameFromPresignedUrl(fileRecord.fileUrl);
          filesData.push({
            fileName,
            fileDir,
          });
        });
        const filesUrl = await Promise.all(
          filesData.map((fileData) => {
            return getObjectS3(
              fileData.fileName,
              this.configService.get<string>('AWS_BUCKET_NAME')!,
              fileData.fileDir,
              this.s3,
            );
          }),
        );

        return {
          status: HttpStatus.OK,
          success: true,
          message: `Update post id ${post.id} successfully`,
          data: {
            ...post,
            filesUrl,
          },
        };
      }

      if (files && files.length) {
        const postFiles = await findFiles(post.id, this.prismaService);

        if (postFiles && postFiles.length) {
          await Promise.all(
            postFiles.map((postFile) => {
              const fileDir = getFileDirFromPresignedUrl(
                postFile.fileUrl,
              ) as FileDir;
              const fileName = getFileNameFromPresignedUrl(postFile.fileUrl);
              return deleteObjectS3(
                fileName,
                this.configService.get<string>('AWS_BUCKET_NAME')!,
                fileDir,
                this.s3,
              );
            }),
          );
        }

        const newFilesName = genFilesName(files);
        await Promise.all(
          newFilesName.map((newFileName) => {
            const fileDir = getFileDirFromFile(newFileName);
            return putObjectS3(
              newFileName,
              this.configService.get<string>('AWS_BUCKET_NAME')!,
              fileDir,
              this.s3,
            );
          }),
        );

        const filesUrl = await Promise.all(
          newFilesName.map((newFileName) => {
            const fileDir = getFileDirFromFile(newFileName);
            return getObjectS3(
              newFileName.originalname,
              this.configService.get<string>('AWS_BUCKET_NAME')!,
              fileDir,
              this.s3,
            );
          }),
        );

        await Promise.all(
          postFiles.map(async (postFile) => {
            return this.prismaService.file.deleteMany({
              where: {
                fileUrl: postFile.fileUrl,
                contentId: post.id,
                contentType: ContentType.POST,
              },
            });
          }),
        );

        const createFileRecordsData = createFileRecords(
          filesUrl,
          post.id,
          ContentType.POST,
        );
        await this.prismaService.file.createMany({
          data: createFileRecordsData,
        });

        return {
          status: HttpStatus.OK,
          success: true,
          message: `Post updated successfully`,
          data: {
            ...post,
            filesUrl,
          },
        };
      }

      throw new UnprocessableEntityException('Error cannot update post');
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(error.message);
      } else if (error instanceof BadRequestException) {
        throw error;
      } else if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof UnprocessableEntityException) {
        throw error;
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
    }
  }

  async deletePost(postId: number): Promise<CommonResponse> {
    if (!postId) {
      throw new BadRequestException('Post id must not be equal to 0');
    }

    try {
      const post = await this.prismaService.post.findUnique({
        where: {
          id: postId,
        },
      });
      if (!post) {
        throw new NotFoundException(`Post id ${postId} not found`);
      }

      const postFiles = await findFiles(post.id, this.prismaService);
      await Promise.all([
        ...postFiles.map((postFile) => {
          const fileName = getFileNameFromPresignedUrl(postFile.fileUrl);
          const fileDir = getFileDirFromPresignedUrl(
            postFile.fileUrl,
          ) as FileDir;
          return deleteObjectS3(
            fileName,
            this.configService.get<string>('AWS_BUCKET_NAME')!,
            fileDir,
            this.s3,
          );
        }),
        ...postFiles.map((postFile) => {
          return this.prismaService.file.delete({
            where: {
              id: postFile.id,
              contentId: post.id,
              contentType: ContentType.POST,
            },
          });
        }),
        this.prismaService.post.delete({
          where: {
            id: postId,
          },
        }),
      ]);

      return {
        status: HttpStatus.OK,
        success: true,
        message: 'Post deleted successfully',
      };
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(error.message);
      } else if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
    }
  }

  async deleteFile(fileId: number): Promise<CommonResponse> {
    if (!fileId) {
      throw new BadRequestException('File id must not be equal to 0');
    }

    try {
      const file = await this.prismaService.file.findUnique({
        where: {
          id: fileId,
        },
      });
      if (!file) {
        throw new NotFoundException(`File id ${fileId} not found`);
      }

      function deleteFileFromS3(
        configService: ConfigService,
        s3: S3Client,
      ): Promise<DeleteObjectCommandOutput> {
        if (file) {
          const fileName = getFileNameFromPresignedUrl(file.fileUrl);
          const fileDir = getFileDirFromPresignedUrl(file.fileUrl) as FileDir;
          return deleteObjectS3(
            fileName,
            configService.get<string>('AWS_BUCKET_NAME')!,
            fileDir,
            s3,
          );
        }

        throw new BadRequestException('File is not empty');
      }

      await Promise.all([
        this.prismaService.file.delete({
          where: {
            id: fileId,
            contentType: ContentType.POST,
          },
        }),
        deleteFileFromS3(this.configService, this.s3),
      ]);

      return {
        status: HttpStatus.OK,
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error: unknown) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(error.message);
      } else if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
    }
  }
}
