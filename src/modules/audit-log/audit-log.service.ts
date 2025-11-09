import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from 'src/utilities/classes';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLog, AuditLogDocument } from './entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  create(createAuditLogDto: CreateAuditLogDto) {
    return this.auditLogModel.create(createAuditLogDto);
  }

  async findAll(paginationDto: PaginationDto) {
    const {
      searchField,
      searchText,
      page = 1,
      limit = 10,
      sort,
    } = paginationDto;
    const skip = (page - 1) * limit;
    const query = {};
    if (searchField && searchText) {
      query[searchField] = { $regex: searchText, $options: 'i' };
    }
    const auditLogs = await this.auditLogModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort);
    const total = await this.auditLogModel.countDocuments();
    return {
      data: auditLogs,
      total,
    };
  }
}
