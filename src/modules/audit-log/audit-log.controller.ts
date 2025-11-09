import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { BearerAuthPackDecorator } from 'src/common/decorators/swagger.decorator';
import { PaginationDto } from 'src/utilities/classes';
import { AuditLogService } from './audit-log.service';

@BearerAuthPackDecorator('audit-log')
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOperation({ summary: 'Get all audit logs' })
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.auditLogService.findAll(paginationDto);
  }
}
