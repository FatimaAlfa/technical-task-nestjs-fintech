import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import * as currencyCodes from 'currency-codes';

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
    description: 'Merchant email',
    example: 'merchant@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    type: String,
    description: 'Merchant currency',
    example: 'USD',
  })
  @IsEnum(currencyCodes.codes(), { message: 'Unsupported currency' })
  @Transform(({ value }) => value.toUpperCase())
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    type: Number,
    description: 'Merchant balance',
    example: 1000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  balance: number;

  @ApiProperty({ type: String, example: 'Password123' })
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[{\]};:'",<.>/?\\|`~]).{8,}$/,
    {
      message:
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
    },
  )
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ type: String, example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
