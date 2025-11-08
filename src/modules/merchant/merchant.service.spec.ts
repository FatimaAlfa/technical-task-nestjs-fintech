import { BadRequestException } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { UserRole } from '../user/enums/user.enum';
import { UserService } from '../user/user.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { Merchant, MerchantDocument } from './entities/merchant.entity';
import { MerchantService } from './merchant.service';

describe('MerchantService', () => {
  let service: MerchantService;
  let merchantModel: Model<MerchantDocument>;
  let userService: UserService;
  let connection: Connection;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  const mockMerchantModel = {
    create: jest.fn(),
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
    }),
  };

  const mockUserService = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantService,
        {
          provide: getModelToken(Merchant.name),
          useValue: mockMerchantModel,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<MerchantService>(MerchantService);
    merchantModel = module.get<Model<MerchantDocument>>(
      getModelToken(Merchant.name),
    );
    userService = module.get<UserService>(UserService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCurrency', () => {
    it('should return true for valid currency code', () => {
      const result = service.validateCurrency('USD');
      expect(result).toBe(true);
    });

    it('should return true for valid currency code (EUR)', () => {
      const result = service.validateCurrency('EUR');
      expect(result).toBe(true);
    });

    it('should return false for invalid currency code', () => {
      const result = service.validateCurrency('INVALID');
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = service.validateCurrency('');
      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    const createMerchantDto: CreateMerchantDto = {
      name: 'Test Merchant',
      email: 'merchant@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      currency: 'USD',
      balance: 1000,
    };

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Merchant',
      email: 'merchant@example.com',
      role: UserRole.MERCHANT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockMerchant = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Test Merchant',
      email: 'merchant@example.com',
      currency: 'USD',
      balance: 1000,
      userId: mockUser._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a merchant successfully', async () => {
      mockUserService.create.mockResolvedValue(mockUser);
      mockUserService.findById.mockResolvedValue(mockUser);
      mockMerchantModel.create.mockResolvedValue(mockMerchant);

      const result = await service.create(createMerchantDto);

      expect(mockConnection.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockUserService.create).toHaveBeenCalledWith({
        name: createMerchantDto.name,
        email: createMerchantDto.email,
        password: createMerchantDto.password,
        role: UserRole.MERCHANT,
      });
      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockMerchantModel.create).toHaveBeenCalledWith({
        name: createMerchantDto.name,
        email: createMerchantDto.email,
        currency: createMerchantDto.currency,
        balance: createMerchantDto.balance,
        userId: mockUser._id,
      });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Merchant created successfully' });
    });

    it('should throw BadRequestException for unsupported currency', async () => {
      const invalidDto = { ...createMerchantDto, currency: 'INVALID' };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(invalidDto)).rejects.toThrow(
        'Unsupported currency',
      );

      expect(mockConnection.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockUserService.create).not.toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user creation fails', async () => {
      mockUserService.create.mockResolvedValue(mockUser);
      mockUserService.findById.mockResolvedValue(null);

      await expect(service.create(createMerchantDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createMerchantDto)).rejects.toThrow(
        'Failed to create user',
      );

      expect(mockConnection.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockUserService.create).toHaveBeenCalled();
      expect(mockUserService.findById).toHaveBeenCalled();
      expect(mockMerchantModel.create).not.toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    const merchantId = '507f1f77bcf86cd799439012';
    const mockMerchant = {
      _id: merchantId,
      name: 'Test Merchant',
      email: 'merchant@example.com',
      currency: 'USD',
      balance: 1000,
      userId: {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test Merchant',
        email: 'merchant@example.com',
        role: UserRole.MERCHANT,
      },
      populate: jest.fn().mockReturnThis(),
    };

    it('should find a merchant by id successfully', async () => {
      const mockPopulate = jest.fn().mockResolvedValue(mockMerchant);
      mockMerchantModel.findById.mockReturnValue({
        populate: mockPopulate,
      });

      const result = await service.findById(merchantId);

      expect(mockMerchantModel.findById).toHaveBeenCalledWith(merchantId);
      expect(mockPopulate).toHaveBeenCalledWith('userId', '-password');
      expect(result).toEqual(mockMerchant);
    });

    it('should throw BadRequestException when merchant not found', async () => {
      const mockPopulate = jest.fn().mockResolvedValue(null);
      mockMerchantModel.findById.mockReturnValue({
        populate: mockPopulate,
      });

      await expect(service.findById(merchantId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.findById(merchantId)).rejects.toThrow(
        'Merchant not found',
      );

      expect(mockMerchantModel.findById).toHaveBeenCalledWith(merchantId);
      expect(mockPopulate).toHaveBeenCalledWith('userId', '-password');
    });
  });

  describe('update', () => {
    const merchantId = '507f1f77bcf86cd799439012';
    const mockMerchant = {
      _id: merchantId,
      name: 'Test Merchant',
      email: 'merchant@example.com',
      currency: 'USD',
      balance: 1000,
      userId: '507f1f77bcf86cd799439011',
      save: jest.fn().mockResolvedValue(true),
    };

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Merchant',
      email: 'merchant@example.com',
      role: UserRole.MERCHANT,
      save: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      mockMerchantModel.findById.mockResolvedValue(mockMerchant);
    });

    it('should update merchant email successfully', async () => {
      const updateDto: UpdateMerchantDto = { email: 'newemail@example.com' };
      mockUserService.findById.mockResolvedValue(mockUser);
      mockUserService.findByEmail.mockResolvedValue(null);

      const result = await service.update(merchantId, updateDto);

      expect(mockMerchantModel.findById).toHaveBeenCalledWith(merchantId);
      expect(mockConnection.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockUserService.findById).toHaveBeenCalledWith(
        mockMerchant.userId,
      );
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(updateDto.email);
      expect(mockUser.email).toBe(updateDto.email);
      expect(mockUser.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockMerchant.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result.message).toBe('Merchant updated successfully');
    });

    it('should update multiple fields successfully', async () => {
      const updateDto: UpdateMerchantDto = {
        name: 'Updated Merchant',
        currency: 'EUR',
        balance: 2000,
      };

      const result = await service.update(merchantId, updateDto);

      expect(mockMerchant.name).toBe(updateDto.name);
      expect(mockMerchant.currency).toBe(updateDto.currency);
      expect(mockMerchant.balance).toBe(updateDto.balance);
      expect(mockMerchant.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(result.message).toBe('Merchant updated successfully');
    });

    it('should throw BadRequestException when merchant not found', async () => {
      mockMerchantModel.findById.mockResolvedValue(null);
      const updateDto: UpdateMerchantDto = { name: 'Updated Merchant' };

      await expect(service.update(merchantId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(merchantId, updateDto)).rejects.toThrow(
        'Merchant not found',
      );

      expect(mockMerchantModel.findById).toHaveBeenCalledWith(merchantId);
      expect(mockConnection.startSession).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for unsupported currency', async () => {
      const updateDto: UpdateMerchantDto = { currency: 'INVALID' };

      await expect(service.update(merchantId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(merchantId, updateDto)).rejects.toThrow(
        'Unsupported currency',
      );

      expect(mockConnection.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should throw BadRequestException when email already exists', async () => {
      const updateDto: UpdateMerchantDto = { email: 'existing@example.com' };
      const existingUser = {
        _id: '507f1f77bcf86cd799439013',
        email: 'existing@example.com',
      };
      mockUserService.findById.mockResolvedValue(mockUser);
      mockUserService.findByEmail.mockResolvedValue(existingUser);

      await expect(service.update(merchantId, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(merchantId, updateDto)).rejects.toThrow(
        'Email already exists',
      );

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(updateDto.email);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should allow email update when email belongs to same user', async () => {
      const updateDto: UpdateMerchantDto = { email: 'sameuser@example.com' };
      mockUserService.findById.mockResolvedValue(mockUser);
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.update(merchantId, updateDto);

      expect(mockUser.email).toBe(updateDto.email);
      expect(mockUser.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(result.message).toBe('Merchant updated successfully');
    });
  });
});
