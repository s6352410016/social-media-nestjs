import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ForgotPasswordAuthGuard extends AuthGuard('forgot-password-jwt') {}