import {
  Body,
  Controller,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { AtAuthGuard } from 'src/auth/guards/at-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileTypeValidationPipe } from 'src/utils/validation/file-type-validation-pipe';
import { FileType } from 'src/utils/types';
import { Express } from 'express';

@UseGuards(AtAuthGuard)
@Controller('post')
export class PostController {
  constructor(private PostService: PostService) {}

  @Post('create/:userId')
  @ApiCreatedResponse({
    description: 'Post created successfully',
    type: CommonResponse,
  })
  createPost(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() createPostDto: CreatePostDto,
  ): Promise<CommonResponse> {
    return this.PostService.createPost(createPostDto, userId);
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
        parentId: {
          type: 'number',
          nullable: true,
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
    return this.PostService.createPostWithFiles(
      createPostDto,
      userId,
      files,
      fileType === 'image' ? 'image' : 'video',
    );
  }
}
