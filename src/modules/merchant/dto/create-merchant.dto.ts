import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMerchantDto {
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
    description: 'Merchant currency',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    type: Number,
    description: 'Merchant balance',
    example: 1000,
  })
  @IsNumber()
  @IsNotEmpty()
  balance: number;
}
