import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { MerchantService } from '../merchant/merchant.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  Transaction,
  TransactionDocument,
} from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction.enum';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly merchantService: MerchantService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { merchantId, amount, currency, cardLast4 } = createTransactionDto;

    const merchant = await this.merchantService.findById(merchantId);
    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }

    const isValidCurrency = this.merchantService.validateCurrency(currency);
    if (!isValidCurrency) {
      throw new BadRequestException('Unsupported currency');
    }

    const transaction = await this.transactionModel.create({
      merchantId,
      amount,
      currency,
      cardLast4,
      status: TransactionStatus.PENDING,
    });

    return { message: 'Transaction created successfully', transaction };
  }

  async getConversionRate(fromCurrency: string, toCurrency: string) {
    try {
      const url = `https://open.er-api.com/v6/latest/${fromCurrency}`;
      const response = await axios.get(url);

      if (response.data && response.data.result === 'success') {
        const rate = response.data.rates[toCurrency];

        if (rate) {
          return rate;
        } else {
          throw new BadRequestException('Failed to convert currency');
        }
      } else {
        throw new BadRequestException('Failed to convert currency');
      }
    } catch (error) {
      console.error('An error occurred while fetching exchange rates:', error);
      throw new BadRequestException('Failed to get conversion rate');
    }
  }

  async triggerApproval(id: string) {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('merchantId');
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction already approved or declined');
    }

    const merchant = await this.merchantService.findById(
      transaction.merchantId,
    );

    if (merchant.currency === transaction.currency) {
      if (merchant.balance < transaction.amount) {
        throw new BadRequestException('Insufficient balance');
      }
      merchant.balance =
        Math.round((merchant.balance - transaction.amount) * 100) / 100;
    } else {
      const rate = await this.getConversionRate(
        merchant.currency,
        transaction.currency,
      );

      if (!rate) {
        throw new BadRequestException('Failed to convert currency');
      }

      const convertedBalance = merchant.balance * rate;
      if (convertedBalance < transaction.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const reverseRate = 1 / rate;
      const amountToDeduct = transaction.amount * reverseRate;

      merchant.balance =
        Math.round((merchant.balance - amountToDeduct) * 100) / 100;
    }
    await merchant.save();

    transaction.status = TransactionStatus.APPROVED;
    await transaction.save();
    return { message: 'Transaction approved successfully', transaction };
  }

  async triggerDecline(id: string) {
    const transaction = await this.transactionModel
      .findById(id)
      .populate('merchantId');
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction already approved or declined');
    }

    transaction.status = TransactionStatus.DECLINED;
    await transaction.save();
    return { message: 'Transaction declined successfully', transaction };
  }

  async findByMerchantId(merchantId: string) {
    const transactions = await this.transactionModel
      .find({ merchantId })
      .populate('merchantId');
    return transactions;
  }

  async findOneWithoutPopulate(id: string) {
    const transaction = await this.transactionModel.findById(id);
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }
    return transaction;
  }
}
