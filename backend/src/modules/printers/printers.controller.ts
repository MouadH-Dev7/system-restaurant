import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
import { PrintersService } from './printers.service';

@Controller('printers')
export class PrintersController {
  constructor(private readonly printersService: PrintersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.printersService.list(user.restaurantId);
  }

  @Get('history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.printersService.history(user.restaurantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() input: CreatePrinterDto, @CurrentUser() user: AuthenticatedUser) {
    return this.printersService.create({
      ...input,
      restaurantId: user.restaurantId,
    });
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param() params: IdParamDto,
    @Body() input: UpdatePrinterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.printersService.update(params.id, user.restaurantId, input);
  }

  @Post('test')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  printTest(
    @CurrentUser() user: AuthenticatedUser,
    @Query('printerName') printerName?: string,
  ) {
    return this.printersService.printTest(user.restaurantId, printerName);
  }
}
