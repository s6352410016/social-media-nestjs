import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ResetPasswordAuthGuard extends AuthGuard('reset-password-jwt') {}