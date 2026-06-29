import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ModifierIngredientsController } from './modifier-ingredients.controller';
import { ModifierIngredientsService } from './modifier-ingredients.service';

@Module({
  imports: [PrismaModule],
  controllers: [ModifierIngredientsController],
  providers: [ModifierIngredientsService],
  exports: [ModifierIngredientsService],
})
export class ModifierIngredientsModule {}
