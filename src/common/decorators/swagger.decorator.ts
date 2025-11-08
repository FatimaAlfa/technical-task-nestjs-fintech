import { Controller, applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

export function BearerAuthPackDecorator(name: string) {
  return applyDecorators(
    Controller(name.toLowerCase()),
    ApiBearerAuth(),
    ApiTags(name),
  );
}

interface ClassConstructor {
  new (...arg: any[]): any;
}

class ParamsDto {
  operation: {
    summary: string;
    description?: string;
  };
  response: {
    statusCode: number;
    isArray: boolean;
    dto: ClassConstructor;
    description: string;
  };
}

export function APIDecorators(params: ParamsDto) {
  return applyDecorators(
    ApiOperation(params.operation),
    ApiResponse({
      type: params.response.dto,
      isArray: params.response.isArray,
      status: params.response.statusCode,
      description: `${params.response.statusCode} - ${params.response.description}`,
    }),
  );
}
