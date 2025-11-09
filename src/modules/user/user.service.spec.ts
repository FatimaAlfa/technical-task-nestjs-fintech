import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { PaginationDto } from '../../utilities/classes';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from './entities/user.entity';
import { UserRole } from './enums/user.enum';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;

  const mockQueryChain = {
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  };

  const mockFindByIdChain = {
    select: jest.fn().mockReturnThis(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn().mockReturnValue(mockQueryChain),
    findById: jest.fn().mockReturnValue(mockFindByIdChain),
    countDocuments: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockAuditLogService = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      role: UserRole.ADMIN,
      password: 'SecurePass123!',
    };

    const createdUser = {
      _id: '507f1f77bcf86cd799439011',
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      toJSON: jest.fn().mockReturnThis(),
    };

    it('should create a new user successfully', async () => {
      const userWithoutPassword = {
        ...createdUser,
        password: undefined,
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(createdUser);
      mockFindByIdChain.select.mockResolvedValue(userWithoutPassword);

      const result = await service.create(createUserDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserModel.findById).toHaveBeenCalledWith(createdUser._id);
      expect(mockFindByIdChain.select).toHaveBeenCalledWith('-password');
      expect(result).toEqual(userWithoutPassword);
    });

    it('should throw BadRequestException when user with email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue(createdUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user cannot be retrieved after creation', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(createdUser);
      mockFindByIdChain.select.mockResolvedValue(null);

      await expect(service.create(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Failed to retrieve created user',
      );

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserModel.findById).toHaveBeenCalledWith(createdUser._id);
      expect(mockFindByIdChain.select).toHaveBeenCalledWith('-password');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'jane.doe@example.com',
      password: 'SecurePass123!',
    };

    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      role: UserRole.ADMIN,
      password: 'hashedPassword',
      passwordCheck: jest.fn(),
      toJSON: jest.fn().mockReturnThis(),
    };

    const mockResponse = {
      cookie: jest.fn(),
    };

    const mockToken = 'mock-jwt-token';

    it('should login successfully with valid credentials', async () => {
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockUser.passwordCheck.mockResolvedValue(true);

      const result = await service.login(loginDto, mockResponse);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(mockUser.passwordCheck).toHaveBeenCalledWith(loginDto.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        _id: mockUser._id,
        role: mockUser.role,
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith('jwt', mockToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      });
      expect(result).toEqual({
        message: 'Login successful',
      });
    });

    it('should throw BadRequestException when user does not exist', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when password is invalid', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockUser.passwordCheck.mockResolvedValue(false);

      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(mockUser.passwordCheck).toHaveBeenCalledWith(loginDto.password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockUsers = [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: UserRole.MERCHANT,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockQueryChain.select.mockReturnValue(mockQueryChain);
      mockQueryChain.skip.mockReturnValue(mockQueryChain);
      mockQueryChain.limit.mockReturnValue(mockQueryChain);
    });

    it('should return all users with default pagination', async () => {
      mockQueryChain.sort.mockResolvedValue(mockUsers);
      mockUserModel.countDocuments.mockResolvedValue(2);

      const paginationDto: PaginationDto = {};
      const result = await service.findAll(paginationDto);

      expect(mockUserModel.find).toHaveBeenCalledWith({});
      expect(mockQueryChain.select).toHaveBeenCalledWith('-password');
      expect(mockQueryChain.skip).toHaveBeenCalledWith(0);
      expect(mockQueryChain.limit).toHaveBeenCalledWith(10);
      expect(mockQueryChain.sort).toHaveBeenCalledWith(undefined);
      expect(mockUserModel.countDocuments).toHaveBeenCalled();
      expect(result).toEqual({
        users: mockUsers,
        total: 2,
      });
    });
  });
});
