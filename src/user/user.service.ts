import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/CreateUserDto';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        username,
      },
    });
  }

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<User | never> {
    const { fullname, username, email, password } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          fullname,
          username,
          email,
          passwordHash,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Username or email already exists');
      }
    }

    throw new InternalServerErrorException('Failed to create user');
  }

  async findById(id: number): Promise<Omit<User, 'passwordHash'> | null> {
    return await this.prisma.user.findUnique({
      where: {
        id,
      },
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
    });
  }
}
