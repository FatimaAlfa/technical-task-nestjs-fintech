import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import * as currencyCodes from 'currency-codes';

export class UpdateMerchantDto {
  @ApiProperty({
    type: String,
    description: 'Merchant name',
    example: 'Merchant 1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Merchant email',
    example: 'merchant@example.com',
  })
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  @IsOptional()
  email?: string;

  @ApiProperty({
    type: String,
    description: 'Merchant currency',
    example: 'USD',
  })
  @IsEnum(currencyCodes.codes())
  @Transform(({ value }) => value.toUpperCase())
  @IsOptional()
  currency?: string;

  @ApiProperty({
    type: Number,
    description: 'Merchant balance',
    example: 1000,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  balance?: number;
}
