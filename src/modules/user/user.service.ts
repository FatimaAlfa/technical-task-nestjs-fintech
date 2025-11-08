import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from 'src/utilities/classes';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  private setJwtCookie(res: any, token: string) {
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    const user = await this.userModel.create(createUserDto);
    return user;
  }

  async login(loginDto: LoginDto, res: any) {
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }
    const isPasswordValid = await user.passwordCheck(loginDto.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }
    const payload = {
      _id: user._id,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);
    this.setJwtCookie(res, token);
    return { message: 'Login successful' };
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      searchField,
      searchText,
      page = 1,
      limit = 10,
      sort,
    } = paginationDto;
    const query = {};
    if (searchField && searchText) {
      query[searchField] = { $regex: searchText, $options: 'i' };
    }
    const users = await this.userModel
      .find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sort);

    const total = await this.userModel.countDocuments();
    return {
      users,
      total,
    };
  }
}
