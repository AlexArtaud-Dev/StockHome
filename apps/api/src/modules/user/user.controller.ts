import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ChangePasswordDto, UpdateProfileDto, UserService } from './user.service';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.userService.findOne(user.sub);
  }

  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: JwtPayload) {
    return this.userService.updateProfile(user.sub, dto);
  }

  @Post('me/change-password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: JwtPayload) {
    return this.userService.changePassword(user.sub, dto);
  }
}
