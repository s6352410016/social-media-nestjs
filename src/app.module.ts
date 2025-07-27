import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [
    AuthModule, 
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    PrismaModule,
    EmailModule,
    PostModule,
  ],
})

export class AppModule {}
