import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as currencyCodes from 'currency-codes';
import { Connection, Model } from 'mongoose';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  AuditLogAction,
  AuditLogEntityType,
} from '../audit-log/enums/audit-log.enum';
import type { UserDocument } from '../user/entities/user.entity';
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
    private readonly auditLogService: AuditLogService,
  ) {}

  validateCurrency(currency: string) {
    const currencyData = currencyCodes.code(currency);
    if (!currencyData) {
      return false;
    }
    return true;
  }

  async create(createMerchantDto: CreateMerchantDto, admin: UserDocument) {
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

      if (!user) {
        throw new BadRequestException('Failed to create user');
      }

      const merchant = await this.merchantModel.create({
        name,
        email,
        currency,
        balance,
        userId: user._id,
      });

      await this.auditLogService.create({
        userId: admin._id,
        action: AuditLogAction.MERCHANT_CREATED,
        entityType: AuditLogEntityType.MERCHANT,
        entityId: merchant._id,
        metadata: merchant,
      });

      await session.commitTransaction();
      return { message: 'Merchant created successfully', merchant };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findById(id: string) {
    const merchant = await this.merchantModel
      .findById(id)
      .populate('userId', '-password');
    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }
    return merchant;
  }

  async update(id: string, updateMerchantDto: UpdateMerchantDto) {
    const merchant = await this.merchantModel.findById(id);
    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }

    const user = await this.userService.findById(merchant.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (updateMerchantDto.currency) {
        const isValidCurrency = this.validateCurrency(
          updateMerchantDto.currency,
        );
        if (!isValidCurrency) {
          throw new BadRequestException('Unsupported currency');
        }
        merchant.currency = updateMerchantDto.currency;
      }

      if (updateMerchantDto.name) {
        merchant.name = updateMerchantDto.name;
        user.name = updateMerchantDto.name;
        await user.save({ session });
      }

      if (updateMerchantDto.balance !== undefined) {
        merchant.balance = updateMerchantDto.balance;
      }

      if (updateMerchantDto.email) {
        const existingEmail = await this.userService.findByEmail(
          updateMerchantDto.email,
        );
        if (
          existingEmail &&
          existingEmail._id.toString() !== user._id.toString()
        ) {
          throw new BadRequestException('Email already exists');
        }

        user.email = updateMerchantDto.email;
        await user.save({ session });
      }

      await merchant.save({ session });

      await this.auditLogService.create({
        userId: user._id,
        action: AuditLogAction.MERCHANT_UPDATED,
        entityType: AuditLogEntityType.MERCHANT,
        entityId: merchant._id,
        metadata: merchant,
      });
      await session.commitTransaction();
      return { message: 'Merchant updated successfully', merchant };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async findOneWithoutPopulate(id: string) {
    const merchant = await this.merchantModel.findById(id);
    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }
    return merchant;
  }
}
