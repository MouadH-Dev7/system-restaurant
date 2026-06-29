import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findByRestaurant(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findByRestaurant(user.restaurantId);
  }

  @Get(':id')
  findById(@Param() params: IdParamDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(params.id, user.restaurantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() input: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create({
      ...input,
      restaurantId: user.restaurantId,
    }, user);
  }

  @Patch(':id')
  update(
    @Param() params: IdParamDto,
    @Body() input: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.update(params.id, user.restaurantId, input, user);
  }
}
