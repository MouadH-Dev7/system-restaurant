import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { PrintJobDTO, PrintReceiptInput } from '@repo/shared-types';
import { IdParamDto } from '../../common/dto/uuid-param.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PrintingService } from './printing.service';

@Controller('printing')
export class PrintingController {
  constructor(private readonly printingService: PrintingService) {}

  @Post('receipt/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  printReceipt(
    @Param() params: IdParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: PrintReceiptInput,
    @Query('printerName') printerName?: string,
  ): Promise<PrintJobDTO> {
    return this.printingService.printReceipt(
      params.id,
      user.restaurantId,
      input.language,
      printerName ?? input.printerName,
    );
  }

  @Post('kitchen-ticket/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.CHEF)
  printKitchenTicket(
    @Param() params: IdParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('printerName') printerName?: string,
  ): Promise<PrintJobDTO | null> {
    return this.printingService.printKitchenTicket(params.id, user.restaurantId, printerName);
  }

  @Post('test')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  printTest(
    @CurrentUser() user: AuthenticatedUser,
    @Query('printerName') printerName?: string,
  ): Promise<PrintJobDTO> {
    return this.printingService.printTest(user.restaurantId, printerName);
  }

  @Get('jobs/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  getPrintJob(@Param() params: IdParamDto): Promise<PrintJobDTO> {
    return this.printingService.getPrintJob(params.id);
  }
}
