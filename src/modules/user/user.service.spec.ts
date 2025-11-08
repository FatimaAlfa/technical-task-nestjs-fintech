import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
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
});
