import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';

@Injectable()
export class NotificationService {
  constructor(private prismaService: PrismaService){}

  create(createNotificationDto: CreateNotificationDto | CreateNotificationDto[]){
    try{
      return this.prismaService.notification.createMany({
        data: createNotificationDto,
      });
    }catch(error: unknown){
      if(error instanceof PrismaClientKnownRequestError){
        throw new InternalServerErrorException(error.message);
      }

      throw new InternalServerErrorException(error, 'Unexpected error');
    }
  }
}
