import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { UserModule } from 'src/user/user.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [UserModule, NotificationModule],
  controllers: [PostController],
  providers: [PostService]
})
export class PostModule {}
