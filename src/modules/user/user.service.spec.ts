import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from './entities/user.entity';
import { UserRole } from './enums/user.enum';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
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
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(createdUser);
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
        sameSite: 'none',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      expect(result).toEqual({
        message: 'Login successful',
        user: mockUser,
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
});
