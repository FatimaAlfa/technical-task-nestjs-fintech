import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BearerAuthPackDecorator } from 'src/common/decorators/swagger.decorator';
import type { UserDocument } from '../user/entities/user.entity';
import { UserRole } from '../user/enums/user.enum';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantService } from './merchant.service';

@BearerAuthPackDecorator('merchant')
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new merchant' })
  @Post()
  create(@Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(createMerchantDto);
  }

  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get a merchant by id' })
  @Get(':id')
  async findById(@Param('id') id: string, @GetUser() user: UserDocument) {
    const merchant = await this.merchantService.findOneWithoutPopulate(id);
    if (
      user.role !== UserRole.ADMIN &&
      merchant.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
    return merchant;
  }

  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Update a merchant' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMerchantDto: UpdateMerchantDto,
    @GetUser() user: UserDocument,
  ) {
    const merchant = await this.merchantService.findOneWithoutPopulate(id);
    if (
      user.role !== UserRole.ADMIN &&
      merchant.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
    return this.merchantService.update(id, updateMerchantDto);
  }
}
