import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MenuItemIngredientsController } from './menu-item-ingredients.controller';
import { MenuItemIngredientsService } from './menu-item-ingredients.service';

@Module({
  imports: [PrismaModule],
  controllers: [MenuItemIngredientsController],
  providers: [MenuItemIngredientsService],
  exports: [MenuItemIngredientsService],
})
export class MenuItemIngredientsModule {}
