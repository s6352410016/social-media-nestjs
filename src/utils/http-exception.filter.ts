import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import {
  Response as ExpressResponse,
} from 'express';
import { CommonResponse } from './swagger/CommonResponse';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();
    const status = exception.getStatus();
    const message = exception.message;
    response.status(status).json({
      status,
      success: false,
      message,
    } satisfies CommonResponse);
  }
}
