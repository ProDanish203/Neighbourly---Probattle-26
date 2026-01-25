import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { UserModule } from './user/user.module';
import { BookingModule } from './booking/booking.module';
import { ServiceModule } from './service/service.module';
import { MailerModule } from './mailer/mailer.module';
import { ServiceCategoryModule } from './service-category/service-category.module';
import { ChatModule } from './chat/chat.module';
import { BullMQModule } from './common/modules/bullmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullMQModule,
    AuthModule,
    StorageModule,
    UserModule,
    BookingModule,
    ServiceModule,
    MailerModule,
    ServiceCategoryModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
