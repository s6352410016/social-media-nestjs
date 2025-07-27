import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { ApiBody, ApiConsumes, ApiCreatedResponse } from '@nestjs/swagger';
import { CreatePostDto } from './dto/create-post.dto';
import { CommonResponse } from 'src/utils/swagger/CommonResponse';
import { AtAuthGuard } from 'src/auth/guards/at-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileTypeValidationPipe } from 'src/utils/validation/FileTypeValidationPipe';
import { Express } from 'express';

@UseGuards(AtAuthGuard)
@Controller('post')
export class PostController {
  constructor(private PostService: PostService) {}

  @Post('create/:user-id')
  @ApiBody({ type: CreatePostDto })
  @ApiCreatedResponse({
    description: 'Post created successfully',
    type: CommonResponse,
  })
  createPost(
    @Param('user-id') userId: number,
    @Body() createPostDto: CreatePostDto,
  ): Promise<CommonResponse> {
    return this.PostService.createPost(createPostDto, userId);
  }

  @Post('create-with-images/:user-id')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        images: {
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
    @Param('user-id') userId: number,
    @Body() createPostDto: CreatePostDto,
  ) {
    console.log(files);
  }
}
