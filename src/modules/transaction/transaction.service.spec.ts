import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { Model } from 'mongoose';
import { AuditLogService } from '../audit-log/audit-log.service';
import { MerchantService } from '../merchant/merchant.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  Transaction,
  TransactionDocument,
} from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction.enum';
import { TransactionService } from './transaction.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionModel: jest.Mocked<Model<TransactionDocument>>;
  let merchantService: jest.Mocked<MerchantService>;

  const mockTransaction = {
    _id: '507f1f77bcf86cd799439011',
    merchantId: '507f1f77bcf86cd799439012',
    amount: 100,
    currency: 'USD',
    cardLast4: '1234',
    status: TransactionStatus.PENDING,
    save: jest.fn().mockResolvedValue(true),
    populate: jest.fn().mockReturnThis(),
  } as any;

  const mockMerchant = {
    _id: '507f1f77bcf86cd799439012',
    name: 'Test Merchant',
    email: 'merchant@test.com',
    currency: 'USD',
    balance: 1000,
    userId: '507f1f77bcf86cd799439013',
    save: jest.fn().mockResolvedValue(true),
  } as any;

  const mockAuditLogService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockTransactionModel = {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMerchantService = {
    findById: jest.fn(),
    validateCurrency: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getModelToken(Transaction.name),
          useValue: mockTransactionModel,
        },
        {
          provide: MerchantService,
          useValue: mockMerchantService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionModel = module.get(getModelToken(Transaction.name));
    merchantService = module.get(MerchantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTransactionDto: CreateTransactionDto = {
      merchantId: '507f1f77bcf86cd799439012',
      amount: 100,
      currency: 'USD',
      cardLast4: '1234',
    };

    it('should create a transaction successfully', async () => {
      merchantService.findById.mockResolvedValue(mockMerchant);
      merchantService.validateCurrency.mockReturnValue(true);
      transactionModel.create.mockResolvedValue(mockTransaction);

      const result = await service.create(createTransactionDto);

      expect(merchantService.findById).toHaveBeenCalledWith(
        createTransactionDto.merchantId,
      );
      expect(merchantService.validateCurrency).toHaveBeenCalledWith('USD');
      expect(transactionModel.create).toHaveBeenCalledWith({
        merchantId: createTransactionDto.merchantId,
        amount: createTransactionDto.amount,
        currency: createTransactionDto.currency,
        cardLast4: createTransactionDto.cardLast4,
        status: TransactionStatus.PENDING,
      });
      expect(result).toEqual({
        message: 'Transaction created successfully',
        transaction: mockTransaction,
      });
    });

    it('should throw BadRequestException when merchant is not found', async () => {
      merchantService.findById.mockResolvedValue(null as any);

      await expect(service.create(createTransactionDto)).rejects.toThrow(
        new BadRequestException('Merchant not found'),
      );
      expect(merchantService.findById).toHaveBeenCalledWith(
        createTransactionDto.merchantId,
      );
      expect(transactionModel.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when currency is invalid', async () => {
      merchantService.findById.mockResolvedValue(mockMerchant);
      merchantService.validateCurrency.mockReturnValue(false);

      await expect(service.create(createTransactionDto)).rejects.toThrow(
        new BadRequestException('Unsupported currency'),
      );
      expect(merchantService.validateCurrency).toHaveBeenCalledWith('USD');
      expect(transactionModel.create).not.toHaveBeenCalled();
    });
  });

  describe('triggerApproval', () => {
    it('should approve transaction successfully with different currency', async () => {
      const merchantWithDifferentCurrency = {
        ...mockMerchant,
        currency: 'USD',
        balance: 1000,
        userId: '507f1f77bcf86cd799439013',
      };

      const transactionWithMerchant = {
        ...mockTransaction,
        currency: 'EUR',
        merchantId: merchantWithDifferentCurrency,
        populate: jest.fn().mockReturnThis(),
      };

      transactionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(transactionWithMerchant),
      } as any);

      merchantService.findById.mockResolvedValue(merchantWithDifferentCurrency);

      const mockResponse = {
        data: {
          result: 'success',
          rates: {
            EUR: 0.85,
          },
        },
      };

      (mockedAxios.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.triggerApproval(mockTransaction._id);

      expect(mockedAxios.get).toHaveBeenCalled();
      expect(merchantWithDifferentCurrency.save).toHaveBeenCalled();
      expect(transactionWithMerchant.save).toHaveBeenCalled();
      expect(transactionWithMerchant.status).toBe(TransactionStatus.APPROVED);
      expect(result).toEqual({
        message: 'Transaction approved successfully',
        transaction: transactionWithMerchant,
      });
    });

    it('should throw BadRequestException when transaction is not found', async () => {
      transactionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.triggerApproval(mockTransaction._id),
      ).rejects.toThrow(new BadRequestException('Transaction not found'));
    });

    it('should throw BadRequestException when balance is insufficient', async () => {
      const merchantWithLowBalance = {
        ...mockMerchant,
        currency: 'USD',
        balance: 1000,
        userId: '507f1f77bcf86cd799439013',
      };

      const transactionWithMerchant = {
        ...mockTransaction,
        currency: 'EUR',
        amount: 2000,
        merchantId: merchantWithLowBalance,
        populate: jest.fn().mockReturnThis(),
      };

      transactionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(transactionWithMerchant),
      } as any);

      merchantService.findById.mockResolvedValue(merchantWithLowBalance);

      const mockResponse = {
        data: {
          result: 'success',
          rates: {
            EUR: 0.85,
          },
        },
      };

      (mockedAxios.get as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        service.triggerApproval(mockTransaction._id),
      ).rejects.toThrow(new BadRequestException('Insufficient balance'));
    });
  });

  describe('triggerDecline', () => {
    it('should decline transaction successfully', async () => {
      const merchantWithUserId = {
        ...mockMerchant,
        userId: '507f1f77bcf86cd799439013',
      };
      const transactionWithMerchant = {
        ...mockTransaction,
        merchantId: merchantWithUserId,
        populate: jest.fn().mockReturnThis(),
      };

      transactionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(transactionWithMerchant),
      } as any);

      merchantService.findById.mockResolvedValue(merchantWithUserId);

      const result = await service.triggerDecline(mockTransaction._id);

      expect(transactionModel.findById).toHaveBeenCalledWith(
        mockTransaction._id,
      );
      expect(transactionWithMerchant.save).toHaveBeenCalled();
      expect(transactionWithMerchant.status).toBe(TransactionStatus.DECLINED);
      expect(result).toEqual({
        message: 'Transaction declined successfully',
        transaction: transactionWithMerchant,
      });
    });

    it('should throw BadRequestException when transaction is not found', async () => {
      transactionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.triggerDecline(mockTransaction._id)).rejects.toThrow(
        new BadRequestException('Transaction not found'),
      );
    });

    it('should throw BadRequestException when transaction is already declined', async () => {
      const declinedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.DECLINED,
        populate: jest.fn().mockReturnThis(),
      };

      transactionModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(declinedTransaction),
      } as any);

      await expect(service.triggerDecline(mockTransaction._id)).rejects.toThrow(
        new BadRequestException('Transaction already approved or declined'),
      );
    });
  });

  describe('findByMerchantId', () => {
    it('should return transactions for a merchant', async () => {
      const transactions = [mockTransaction];
      transactionModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(transactions),
      } as any);

      const result = await service.findByMerchantId(mockMerchant._id);

      expect(transactionModel.find).toHaveBeenCalledWith({
        merchantId: mockMerchant._id,
      });
      expect(result).toEqual(transactions);
    });
  });
});
