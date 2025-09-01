import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { AtAuthGuard } from 'src/auth/guards/at-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileTypeValidationPipe } from 'src/utils/validations/file-type-validation-pipe';
import { UpdatePostDto } from './dto/update-post.dto';
import { Express } from 'express';

@UseGuards(AtAuthGuard)
@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Post('create/:userId')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['message'],
    },
  })
  @ApiCreatedResponse({
    description: 'Post with images created successfully',
    type: CommonResponse,
  })
  async createPost(
    @UploadedFiles(new FileTypeValidationPipe()) files: Express.Multer.File[],
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createPostDto: CreatePostDto,
  ) {
    return await this.postService.createPost(
      {
        ...createPostDto,
        userId,
      },
      files,
    );
  }

  @Post('share/create/:userId/:parentId')
  @ApiCreatedResponse({
    description: 'Share post created successfully',
    type: CommonResponse,
  })
  async createSharePost(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('parentId', ParseIntPipe) parentId: number,
    @Body() createPostDto: CreatePostDto,
  ) {
    return await this.postService.createSharePost({
      ...createPostDto,
      userId,
      parentId,
    });
  }

  @Get('find')
  @ApiNotFoundResponse({
    description: 'Not found',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Post retrived succussfully',
    type: CommonResponse,
  })
  async findPosts() {
    return await this.postService.findPosts();
  }

  @Get('find/:postId')
  @ApiNotFoundResponse({
    description: 'Not found',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Post retrived succussfully',
    type: CommonResponse,
  })
  async findPostById(
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    return await this.postService.findPostById(postId);
  }

  @Get('find/user/:userId')
  @ApiNotFoundResponse({
    description: 'Not found',
    type: CommonResponse,
  })
  @ApiOkResponse({
    description: 'Post retrived succussfully',
    type: CommonResponse,
  })
  async findPostByUser(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return await this.postService.findPostByUser(userId);
  }

  @Patch('update/:postId')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Not found',
    type: CommonResponse,
  })
  @ApiCreatedResponse({
    description: 'Post updated successfully',
    type: CommonResponse,
  })
  async updatePost(
    @UploadedFiles(new FileTypeValidationPipe()) files: Express.Multer.File[],
    @Param('postId', ParseIntPipe) postId: number,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return await this.postService.updatePost(
      {
        ...updatePostDto,
        postId,
      },
      files,
    );
  }

  @Delete('delete/:postId')
  @ApiOkResponse({
    description: 'Post deleted successfully',
    type: CommonResponse,
  })
  @ApiNotFoundResponse({
    description: 'Not found',
    type: CommonResponse,
  })
  async deletePost(
    @Param('postId', ParseIntPipe) postId: number,
  ) {
    await this.postService.deletePost(postId);
  }

  @Delete('delete/file/:fileId')
  @ApiOkResponse({
    description: 'File deleted successfully',
    type: CommonResponse,
  })
  @ApiNotFoundResponse({
    description: 'Not found',
    type: CommonResponse,
  })
  async deleteFile(
    @Param('fileId', ParseIntPipe) fileId: number,
  ) {
    await this.postService.deleteFile(fileId);
  }
}
