import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseIntPipe,
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
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { AtAuthGuard } from 'src/auth/guards/at-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileTypeValidationPipe } from 'src/utils/validation/file-type-validation-pipe';
import { FileType } from 'src/utils/types';
import { Express } from 'express';

// @UseGuards(AtAuthGuard)
@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Post('create/:userId')
  @ApiCreatedResponse({
    description: 'Post created successfully',
    type: CommonResponse,
  })
  createPost(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createPostDto: CreatePostDto,
  ): Promise<CommonResponse> {
    return this.postService.createPost(createPostDto, userId);
  }

  @Post('create-with-files/:fileType/:userId')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'fileType',
    enum: FileType,
    description: 'file type for create post with file',
  })
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
    },
  })
  @ApiCreatedResponse({
    description: 'Post with images created successfully',
    type: CommonResponse,
  })
  createPostWithImages(
    @UploadedFiles(new FileTypeValidationPipe()) files: Express.Multer.File[],
    @Param('fileType', new ParseEnumPipe(FileType)) fileType: FileType,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createPostDto: CreatePostDto,
  ): Promise<CommonResponse> {
    return this.postService.createPostWithFiles(
      createPostDto,
      userId,
      files,
      fileType,
    );
  }

  @Post('share/create/:userId/:parentId')
  @ApiCreatedResponse({
    description: 'Share post created successfully',
    type: CommonResponse,
  })
  createSharePost(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('parentId', ParseIntPipe) parentId: number,
    @Body() createPostDto: CreatePostDto,
  ): Promise<CommonResponse> {
    return this.postService.createSharePost(userId, parentId, createPostDto);
  }

  @Get('find')
  @ApiOkResponse({
    description: 'Post retrived succussfully',
    type: CommonResponse,
  })
  findPosts(): Promise<CommonResponse> {
    return this.postService.findPosts();
  }
}
