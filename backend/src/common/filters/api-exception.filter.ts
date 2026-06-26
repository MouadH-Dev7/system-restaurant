import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

type ErrorBody = {
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (!(exception instanceof HttpException)) {
      console.error('Unhandled API exception:', exception);
    }
    const response = host.switchToHttp().getResponse();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as ErrorBody)
        : {};

    response.status(status).json({
      error:
        body.error ??
        (status === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal Server Error' : 'Error'),
      message:
        body.message ??
        (typeof exceptionResponse === 'string'
          ? exceptionResponse
          : 'An unexpected error occurred.'),
      statusCode: body.statusCode ?? status,
    });
  }
}
