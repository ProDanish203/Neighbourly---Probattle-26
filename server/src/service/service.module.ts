import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { StorageService } from 'src/storage/storage.service';

@Module({
  controllers: [ServiceController],
  providers: [ServiceService, PrismaService, StorageService],
  exports: [ServiceService],
})
export class ServiceModule {}
