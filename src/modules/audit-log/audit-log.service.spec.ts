import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { PaginationDto } from '../../utilities/classes';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';
import { AuditLogAction, AuditLogEntityType } from './enums/audit-log.enum';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogModel: Model<AuditLogDocument>;

  const mockQueryChain = {
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  };

  const mockAuditLogModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnValue(mockQueryChain),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: mockAuditLogModel,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    auditLogModel = module.get<Model<AuditLogDocument>>(
      getModelToken(AuditLog.name),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createAuditLogDto: CreateAuditLogDto = {
      userId: '507f1f77bcf86cd799439011',
      action: AuditLogAction.USER_CREATED,
      entityType: AuditLogEntityType.USER,
      entityId: '507f1f77bcf86cd799439012',
      metadata: {
        oldValue: null,
        newValue: { name: 'John Doe', email: 'john@example.com' },
      },
    };

    const createdAuditLog = {
      _id: '507f1f77bcf86cd799439013',
      ...createAuditLogDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: jest.fn().mockReturnThis(),
    };

    it('should create a new audit log successfully', async () => {
      mockAuditLogModel.create.mockResolvedValue(createdAuditLog);

      const result = await service.create(createAuditLogDto);

      expect(mockAuditLogModel.create).toHaveBeenCalledWith(createAuditLogDto);
      expect(result).toEqual(createdAuditLog);
    });
  });

  describe('findAll', () => {
    const mockAuditLogs = [
      {
        _id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439010',
        action: AuditLogAction.USER_CREATED,
        entityType: AuditLogEntityType.USER,
        entityId: '507f1f77bcf86cd799439012',
        metadata: { name: 'John Doe' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439012',
        userId: '507f1f77bcf86cd799439010',
        action: AuditLogAction.MERCHANT_CREATED,
        entityType: AuditLogEntityType.MERCHANT,
        entityId: '507f1f77bcf86cd799439013',
        metadata: { name: 'Test Merchant' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439013',
        userId: '507f1f77bcf86cd799439010',
        action: AuditLogAction.TRANSACTION_CREATED,
        entityType: AuditLogEntityType.TRANSACTION,
        entityId: '507f1f77bcf86cd799439014',
        metadata: { amount: 100, currency: 'USD' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockQueryChain.skip.mockReturnValue(mockQueryChain);
      mockQueryChain.limit.mockReturnValue(mockQueryChain);
      mockQueryChain.sort.mockReturnValue(mockQueryChain);
    });

    it('should return all audit logs with default pagination', async () => {
      mockQueryChain.sort.mockResolvedValue(mockAuditLogs);
      mockAuditLogModel.countDocuments.mockResolvedValue(3);

      const paginationDto: PaginationDto = {};
      const result = await service.findAll(paginationDto);

      expect(mockAuditLogModel.find).toHaveBeenCalledWith({});
      expect(mockQueryChain.skip).toHaveBeenCalledWith(0);
      expect(mockQueryChain.limit).toHaveBeenCalledWith(10);
      expect(mockQueryChain.sort).toHaveBeenCalledWith(undefined);
      expect(mockAuditLogModel.countDocuments).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockAuditLogs,
        total: 3,
      });
    });
  });
});
