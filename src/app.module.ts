import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from './common/guards/auth.guard';
import { UserModule } from './modules/user/user.module';
import { MerchantModule } from './modules/merchant/merchant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(`${process.env.MONGO_URI}`, {
      dbName: 'technical-task-nestjs-fintech',
    }),
    UserModule,
    MerchantModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
