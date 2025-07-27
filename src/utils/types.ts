import { CreateUserDto } from 'src/user/dto/CreateUser.dto';

export interface IJwtPayload {
  id: number;
  iat: number;
  exp: number;
}

export interface ISocialUserPayload {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatar: string;
}

export type CreateSocialUserDto = Omit<
  CreateUserDto,
  'password' | 'username'
> &
  Partial<Pick<CreateUserDto, 'password' | 'username'>>;

export interface IEmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}  