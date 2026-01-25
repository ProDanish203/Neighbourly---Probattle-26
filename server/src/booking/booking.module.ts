import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { RedisService } from 'src/common/services/redis.service';
import { StorageService } from 'src/storage/storage.service';
@Module({
  controllers: [BookingController],
  providers: [BookingService, PrismaService, RedisService, StorageService],
  exports: [BookingService],
})
export class BookingModule {}
