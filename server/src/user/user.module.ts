import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from 'src/common/services/prisma.service';
import { StorageService } from 'src/storage/storage.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, StorageService],
  exports: [UserService],
})
export class UserModule {}
