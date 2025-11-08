import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as currencyCodes from 'currency-codes';
import { Connection, Model } from 'mongoose';
import { UserRole } from '../user/enums/user.enum';
import { UserService } from '../user/user.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { Merchant, MerchantDocument } from './entities/merchant.entity';

@Injectable()
export class MerchantService {
  constructor(
    @InjectModel(Merchant.name)
    private readonly merchantModel: Model<MerchantDocument>,
    private readonly userService: UserService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  validateCurrency(currency: string) {
    const currencyData = currencyCodes.code(currency);
    if (!currencyData) {
      return false;
    }
    return true;
  }

  async create(createMerchantDto: CreateMerchantDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const { name, email, password, currency, balance } = createMerchantDto;
      const isValidCurrency = this.validateCurrency(currency);
      if (!isValidCurrency) {
        throw new BadRequestException('Unsupported currency');
      }

      const user = await this.userService.create({
        name,
        email,
        password,
        role: UserRole.MERCHANT,
      });
      const checkUser = await this.userService.findById(user._id);
      if (!checkUser) {
        throw new BadRequestException('Failed to create user');
      }

      const merchant = await this.merchantModel.create({
        name,
        email,
        currency,
        balance,
        userId: user._id,
      });

      await session.commitTransaction();
      return { message: 'Merchant created successfully' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findById(id: string) {
    return this.merchantModel.findById(id);
  }

  async update(id: string, updateMerchantDto: UpdateMerchantDto) {
    const merchant = await this.merchantModel.findById(id);
    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }

    if (updateMerchantDto.currency) {
      const isValidCurrency = this.validateCurrency(updateMerchantDto.currency);
      if (!isValidCurrency) {
        throw new BadRequestException('Unsupported currency');
      }
    }

    if (updateMerchantDto.email) {
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        const user = await this.userService.findByEmail(
          updateMerchantDto.email,
        );
        if (!user) {
          throw new BadRequestException('User not found');
        }

        const existingEmail = await this.userService.findByEmail(
          updateMerchantDto.email,
        );
        if (existingEmail) {
          throw new BadRequestException('Email already exists');
        }

        user.email = updateMerchantDto.email;
        await user.save();
        await merchant.save();
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    }
  }
}
