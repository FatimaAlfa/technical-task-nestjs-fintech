import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsObject } from 'class-validator';
import { AuditLogAction, AuditLogEntityType } from '../enums/audit-log.enum';

export class CreateAuditLogDto {
  @ApiProperty({
    type: String,
    description: 'User ID',
    example: '668e90909090909090909090',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    type: String,
    description: 'Action',
    example: AuditLogAction.USER_CREATED,
  })
  @IsEnum(AuditLogAction)
  @IsNotEmpty()
  action: AuditLogAction;

  @ApiProperty({
    type: String,
    description: 'Entity type',
    example: AuditLogEntityType.USER,
  })
  @IsEnum(AuditLogEntityType)
  @IsNotEmpty()
  entityType: AuditLogEntityType;

  @ApiProperty({
    type: String,
    description: 'Entity ID',
    example: '668e90909090909090909090',
  })
  @IsMongoId()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    type: Object,
    description: 'Metadata',
    example: { oldValue: 'old value', newValue: 'new value' },
  })
  @IsObject()
  @IsNotEmpty()
  metadata: object;
}
