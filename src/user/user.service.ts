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
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateSocialUserDto } from 'src/utils/types';
import { formatString } from 'src/utils/helpers/format-string';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(
    username: string,
  ): Promise<(User & { provider: Provider | null }) | null> {
    return await this.prisma.user.findUnique({
      where: {
        username,
      },
      include: {
        provider: true,
      },
    });
  }

  async createUser(
    createUserDto: CreateUserDto | CreateSocialUserDto,
  ): Promise<Omit<User, 'passwordHash'> & { provider: Provider | null }> {
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
          omit: {
            passwordHash: true,
          },
          include: {
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
          omit: {
            passwordHash: true,
          },
          include: {
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
        throw new BadRequestException(
          `${formatString(error.meta?.target?.[0])} already exists`,
        );
      }

      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findById(
    id: number,
  ): Promise<
    (Omit<User, 'passwordHash'> & { provider: Provider | null }) | null
  > {
    return await this.prisma.user.findUnique({
      where: {
        id,
      },
      omit: {
        passwordHash: true,
      },
      include: {
        provider: true,
      },
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto & { email: string }) {
    const { password, confirmPassword, email } = resetPasswordDto;
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const passwordHash = await hashSecret(confirmPassword);
    try {
      await this.prisma.user.update({
        where: {
          email,
        },
        data: {
          passwordHash,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      } else if (error instanceof BadRequestException) {
        throw error;
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
      omit: {
        passwordHash: true,
      },
      include: {
        provider: true,
      },
    });
  }

  async findByFullname(
    currentId: number,
    query: string,
  ): Promise<(Omit<User, 'passwordHash'> & { provider: Provider | null })[]> {
    return this.prisma.user.findMany({
      where: {
        fullname: {
          contains: query,
          mode: 'insensitive',
        },
        id: {
          not: currentId,
        },
      },
      omit: {
        passwordHash: true,
      },
      include: {
        provider: true,
      },
    });
  }
}
