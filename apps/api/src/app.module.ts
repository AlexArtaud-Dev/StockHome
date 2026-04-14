import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { HouseholdModule } from './modules/household/household.module';
import { UserModule } from './modules/user/user.module';
import { RoomModule } from './modules/room/room.module';
import { ContainerModule } from './modules/container/container.module';
import { ItemModule } from './modules/item/item.module';
import { CategoryModule } from './modules/category/category.module';
import { TagModule } from './modules/tag/tag.module';
import { StockRuleModule } from './modules/stock-rule/stock-rule.module';
import { QrModule } from './modules/qr/qr.module';
import { SearchModule } from './modules/search/search.module';
import { MovementLogModule } from './modules/movement-log/movement-log.module';
import { UploadModule } from './modules/upload/upload.module';
import { AdminModule } from './modules/admin/admin.module';
import { ExportModule } from './modules/export/export.module';
import { NotificationModule } from './modules/notification/notification.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    DatabaseModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(process.env['UPLOAD_DIR'] ?? './data/uploads'),
      serveRoot: '/uploads',
    }),
    EmailModule,
    AuthModule,
    HouseholdModule,
    UserModule,
    RoomModule,
    ContainerModule,
    ItemModule,
    CategoryModule,
    TagModule,
    StockRuleModule,
    QrModule,
    SearchModule,
    MovementLogModule,
    UploadModule,
    AdminModule,
    ExportModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
