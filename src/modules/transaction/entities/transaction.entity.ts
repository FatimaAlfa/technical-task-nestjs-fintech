import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as currencyCodes from 'currency-codes';
import mongoose, { HydratedDocument } from 'mongoose';
import { Merchant } from 'src/modules/merchant/entities/merchant.entity';
import { TransactionStatus } from '../enums/transaction.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Merchant.name,
    required: true,
  })
  merchantId: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, enum: currencyCodes.codes(), required: true })
  currency: string;

  @Prop({ type: String, required: true })
  cardLast4: string;

  @Prop({ type: String, enum: TransactionStatus, required: true })
  status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
