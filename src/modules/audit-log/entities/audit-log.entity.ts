import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from '../../user/entities/user.entity';
import { AuditLogAction, AuditLogEntityType } from '../enums/audit-log.enum';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  _id: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId: string;

  @Prop({ type: String, enum: AuditLogAction, required: true })
  action: AuditLogAction;

  @Prop({ type: String, enum: AuditLogEntityType, required: true })
  entityType: AuditLogEntityType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  entityId: string;

  @Prop({ type: Object, required: true })
  metadata: object;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
