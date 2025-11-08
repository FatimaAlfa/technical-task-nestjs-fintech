import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BearerAuthPackDecorator } from 'src/common/decorators/swagger.decorator';
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
  @ApiOperation({ summary: 'Update a merchant' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMerchantDto: UpdateMerchantDto,
  ) {
    return this.merchantService.update(id, updateMerchantDto);
  }

  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get a merchant by id' })
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.merchantService.findById(id);
  }
}
