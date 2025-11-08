import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from 'src/modules/user/entities/user.entity';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDocument => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
