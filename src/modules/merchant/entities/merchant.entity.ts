import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import * as currencyCodes from 'currency-codes';
import { User } from 'src/modules/user/entities/user.entity';

export type MerchantDocument = HydratedDocument<Merchant>;

@Schema({ timestamps: true })
export class Merchant {
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: currencyCodes.codes(), required: true })
  currency: string;

  @Prop({ type: Number, required: true })
  balance: number;
}

export const MerchantSchema = SchemaFactory.createForClass(Merchant);
