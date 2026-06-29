import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SupplierCategoryController } from './supplier-category.controller';
import { SupplierCategoryService } from './supplier-category.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupplierCategoryController],
  providers: [SupplierCategoryService],
  exports: [SupplierCategoryService],
})
export class SupplierCategoryModule {}
