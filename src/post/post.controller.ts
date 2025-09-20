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
import { ResponseFromService } from 'src/utils/types';
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
  ): Promise<ResponseFromService> {
    const post = await this.postService.createPost(
      {
        ...createPostDto,
        userId,
      },
      files,
    );
    return {
      message: 'Post with images created successfully',
      data: post,
    }
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
  ): Promise<ResponseFromService> {
    const sharePost = await this.postService.createSharePost({
      ...createPostDto,
      userId,
      parentId,
    });
    return {
      message: 'Share post created successfully',
      data: sharePost,
    }
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
  async findPosts(): Promise<ResponseFromService> {
    const posts = await this.postService.findPosts();
    return {
      message: 'Post retrived succussfully',
      data: posts,
    }
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
  ): Promise<ResponseFromService> {
    const post = await this.postService.findPostById(postId);
    return {
      message: 'Post retrived succussfully',
      data: post,
    }
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
  ): Promise<ResponseFromService> {
    const posts = await this.postService.findPostByUser(userId);
    return {
      message: 'Post retrived succussfully',
      data: posts,
    }
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
  ): Promise<ResponseFromService> {
    const post = await this.postService.updatePost(
      {
        ...updatePostDto,
        postId,
      },
      files,
    );
    return {
      message: 'Post updated successfully',
      data: post,
    }
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
  ): Promise<ResponseFromService> {
    await this.postService.deletePost(postId);
    return {
      message: 'Post deleted successfully',
    }
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
  ): Promise<ResponseFromService> {
    await this.postService.deleteFile(fileId);
    return {
      message: 'File deleted successfully',
    }
  }
}
