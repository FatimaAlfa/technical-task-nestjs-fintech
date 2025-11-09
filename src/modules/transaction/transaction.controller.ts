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
import { MerchantService } from '../merchant/merchant.service';
import type { UserDocument } from '../user/entities/user.entity';
import { UserRole } from '../user/enums/user.enum';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionService } from './transaction.service';

@BearerAuthPackDecorator('transaction')
@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly merchantService: MerchantService,
  ) {}

  @ApiOperation({ summary: 'Create a new transaction' })
  @Roles(UserRole.PARTNER, UserRole.MERCHANT)
  @Post()
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @GetUser() user: UserDocument,
  ) {
    const merchant = await this.merchantService.findOneWithoutPopulate(
      createTransactionDto.merchantId,
    );
    if (
      user.role === UserRole.MERCHANT &&
      merchant.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
    return this.transactionService.create(createTransactionDto);
  }

  @ApiOperation({ summary: 'Trigger approval for a transaction' })
  @Roles(UserRole.MERCHANT)
  @Patch(':id/approve')
  async triggerApproval(
    @Param('id') id: string,
    @GetUser() user: UserDocument,
  ) {
    const transaction =
      await this.transactionService.findOneWithoutPopulate(id);
    const merchant = await this.merchantService.findOneWithoutPopulate(
      transaction.merchantId,
    );
    if (
      user.role !== UserRole.MERCHANT ||
      merchant.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
    return await this.transactionService.triggerApproval(id);
  }

  @ApiOperation({ summary: 'Trigger decline for a transaction' })
  @Roles(UserRole.MERCHANT)
  @Patch(':id/decline')
  async triggerDecline(@Param('id') id: string, @GetUser() user: UserDocument) {
    const transaction =
      await this.transactionService.findOneWithoutPopulate(id);
    const merchant = await this.merchantService.findOneWithoutPopulate(
      transaction.merchantId,
    );
    if (
      user.role !== UserRole.MERCHANT ||
      merchant.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
    return await this.transactionService.triggerDecline(id);
  }

  @ApiOperation({ summary: 'Get transactions by merchant id' })
  @Roles(UserRole.MERCHANT, UserRole.ADMIN)
  @Get('merchant/:merchantId')
  async findByMerchantId(
    @Param('merchantId') merchantId: string,
    @GetUser() user: UserDocument,
  ) {
    const merchant =
      await this.merchantService.findOneWithoutPopulate(merchantId);
    if (
      (user.role !== UserRole.MERCHANT && user.role !== UserRole.ADMIN) ||
      merchant.userId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this resource',
      );
    }
    return await this.transactionService.findByMerchantId(merchantId);
  }
}
