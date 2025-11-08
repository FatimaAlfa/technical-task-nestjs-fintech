import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MerchantDocument = HydratedDocument<Merchant>;

@Schema({ timestamps: true })
export class Merchant {
  _id: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  currency: string;

  @Prop({ type: Number, required: true })
  balance: number;
}

export const MerchantSchema = SchemaFactory.createForClass(Merchant);
