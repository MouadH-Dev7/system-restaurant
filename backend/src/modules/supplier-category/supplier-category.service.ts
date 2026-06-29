import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type {
  CreateSupplierCategoryInput,
  SupplierCategoryDTO,
  UpdateSupplierCategoryInput,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupplierCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(restaurantId: string): Promise<SupplierCategoryDTO[]> {
    try {
      const items = await this.prisma.supplierCategory.findMany({
        where: { restaurantId },
        orderBy: { name: 'asc' },
      });
      return items.map((item) => this.toDto(item));
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to list supplier categories');
    }
  }

  async create(input: CreateSupplierCategoryInput): Promise<SupplierCategoryDTO> {
    try {
      const item = await this.prisma.supplierCategory.create({
        data: {
          restaurantId: input.restaurantId,
          name: input.name,
        },
      });
      return this.toDto(item);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to create supplier category');
    }
  }

  async update(id: string, input: UpdateSupplierCategoryInput): Promise<SupplierCategoryDTO> {
    try {
      const current = await this.prisma.supplierCategory.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Supplier category not found');

      const item = await this.prisma.supplierCategory.update({
        where: { id },
        data: { ...(input.name !== undefined && { name: input.name }) },
      });
      return this.toDto(item);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to update supplier category');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const current = await this.prisma.supplierCategory.findUnique({ where: { id } });
      if (!current) throw new NotFoundException('Supplier category not found');
      await this.prisma.supplierCategory.delete({ where: { id } });
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to delete supplier category');
    }
  }

  private toDto(item: {
    id: string;
    restaurantId: string;
    name: string;
    createdAt: Date;
  }): SupplierCategoryDTO {
    return {
      id: item.id,
      restaurantId: item.restaurantId,
      name: item.name,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
