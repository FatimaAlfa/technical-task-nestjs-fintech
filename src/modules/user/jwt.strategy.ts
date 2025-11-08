// jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PayloadDto } from './dto/payload.dto';
import { UserService } from './user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.cookies?.jwt,
      ]),
      ignoreExpiration: false,
      secretOrKey:
        'bea9f8e475b3fa4363eee67c3b2742628bc34bc7b6a0a45848814d269579c491b2044c35dd758773b4e21bb964cdcbe01721a568276e0bc0bcc9aea74fe37b53',
    });
  }

  async validate(payload: PayloadDto) {
    const user = await this.userService.findById(payload._id);

    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    return {
      _id: user._id,
      role: user.role,
    };
  }
}
