import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MerchantModule } from '../merchant/merchant.module';
import { Transaction, TransactionSchema } from './entities/transaction.entity';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    MerchantModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
