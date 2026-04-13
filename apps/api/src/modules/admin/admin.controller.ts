import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService } from './admin.service';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query('search') search?: string) {
    return this.adminService.listUsers(search);
  }

  @Post('users/:id/ban')
  ban(@Param('id') id: string) {
    return this.adminService.ban(id);
  }

  @Post('users/:id/unban')
  unban(@Param('id') id: string) {
    return this.adminService.unban(id);
  }

  @Post('users/:id/promote')
  promote(@Param('id') id: string) {
    return this.adminService.promote(id);
  }

  @Post('users/:id/demote')
  demote(@Param('id') id: string) {
    return this.adminService.demote(id);
  }

  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string) {
    return this.adminService.resetPassword(id);
  }

  @Post('users/:id/resend-confirmation')
  resendConfirmation(@Param('id') id: string) {
    return this.adminService.resendConfirmation(id);
  }
}
