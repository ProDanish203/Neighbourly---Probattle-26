import { Module } from '@nestjs/common';
import { ServiceCategoryController } from './service-category.controller';
import { ServiceCategoryService } from './service-category.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { RedisService } from 'src/common/services/redis.service';
import { StorageService } from 'src/storage/storage.service';
@Module({
  controllers: [ServiceCategoryController],
  providers: [ServiceCategoryService, PrismaService, RedisService, StorageService],
  exports: [ServiceCategoryService],
})
export class ServiceCategoryModule {}
