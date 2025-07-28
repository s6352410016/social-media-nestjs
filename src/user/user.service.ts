import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Provider, ProviderType, User } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaClientKnownRequestError } from 'generated/prisma/runtime/library';
import { hashSecret } from 'src/utils/helpers/hash-secret';
import { CommonResponse } from 'src/utils/swagger/common-response';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateSocialUserDto } from 'src/utils/types';

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
    createUserDto:
      | CreateUserDto
      | CreateSocialUserDto,
  ): Promise<
    (Omit<User, 'passwordHash'> & { provider: Provider | null }) | never
  > {
    const {
      fullname,
      username,
      email,
      password,
      profileUrl,
      providerType,
      providerId,
    } = createUserDto;
    try {
      if (
        providerType === ProviderType.GOOGLE ||
        providerType === ProviderType.GITHUB
      ) {
        return await this.prisma.user.create({
          data: {
            fullname,
            email,
            profileUrl,
            provider: {
              create: {
                providerType,
                providerId,
              },
            },
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
            provider: true,
          },
        });
      }

      if (password) {
        const passwordHash = await hashSecret(password);
        return await this.prisma.user.create({
          data: {
            fullname,
            username,
            email,
            passwordHash,
            provider: {
              create: {
                providerType,
              },
            },
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
            provider: true,
          },
        });
      }

      throw new Error('Invalid input data');
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Username or email already exists');
      }

      throw new InternalServerErrorException('Failed to create user');
    }
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
        provider: true
      },
    });
  }

  async resetPassword(
    userId: number,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<CommonResponse> {
    if (!userId) {
      throw new BadRequestException('User id must not be equal to 0');
    }

    const { newPassword, confirmPassword } = resetPasswordDto;
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const passwordHash = await hashSecret(confirmPassword);
    try {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          passwordHash,
        },
      });
      return {
        status: 200,
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }

      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  async findByEmail(
    email: string,
  ): Promise<
    (Omit<User, 'passwordHash'> & { provider: Provider | null }) | null
  > {
    return await this.prisma.user.findUnique({
      where: {
        email,
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
        provider: true,
      },
    });
  }
}
