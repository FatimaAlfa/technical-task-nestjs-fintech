import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { Merchant, MerchantSchema } from './entities/merchant.entity';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Merchant.name, schema: MerchantSchema },
    ]),
    UserModule,
  ],
  controllers: [MerchantController],
  providers: [MerchantService],
})
export class MerchantModule {}
