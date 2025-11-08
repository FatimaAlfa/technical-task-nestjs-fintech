import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    Logger.error(
      '💥 ~ file: all-exceptions.filter.ts:12 ~ AllExceptionsFilter ~ exception:',
      exception,
    );
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception.code && exception.code === 11000) {
      const [[key, value]] = Object.entries(exception.keyValue);
      return response.status(400).json({
        statusCode: 400,
        message: `This ${key}: ${value} is already exist!`,
        error: 'Bad Request',
      });
    }

    if (exception.name === 'ValidationError') {
      return response.status(400).json({
        statusCode: 400,
        message: exception.message,
      });
    }

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(httpStatus).json(exception.response);
  }
}
