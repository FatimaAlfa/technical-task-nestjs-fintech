import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import * as currencyCodes from 'currency-codes';

export class CreateTransactionDto {
  @ApiProperty({
    type: String,
    description: 'Merchant ID',
    example: '668e90909090909090909090',
  })
  @IsString()
  @IsNotEmpty()
  merchantId: string;

  @ApiProperty({
    type: Number,
    description: 'Transaction amount',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    type: String,
    description: 'Transaction currency',
    example: 'USD',
  })
  @IsEnum(currencyCodes.codes(), { message: 'Unsupported currency' })
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    type: String,
    description: 'Transaction card last 4 digits',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  cardLast4: string;
}
