import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type {
  CreateSupplierInput,
  SupplierDTO,
  UpdateSupplierInput,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(restaurantId: string): Promise<SupplierDTO[]> {
    try {
      const items = await this.prisma.supplier.findMany({
        where: { restaurantId },
        include: { categories: { include: { category: true } } },
        orderBy: { name: 'asc' },
      });
      return items.map((item) => this.toDto(item));
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to list suppliers');
    }
  }

  async create(input: CreateSupplierInput): Promise<SupplierDTO> {
    try {
      const { categoryIds, ...data } = input;
      const item = await this.prisma.supplier.create({
        data: {
          restaurantId: data.restaurantId,
          name: data.name,
          contactName: data.contactName ?? null,
          phone: data.phone ?? null,
          email: data.email ?? null,
          address: data.address ?? null,
          supplyingCategories: data.supplyingCategories ?? null,
          status: data.status ?? 'ACTIVE',
          categories: categoryIds?.length
            ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
            : undefined,
        },
        include: { categories: { include: { category: true } } },
      });
      return this.toDto(item);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to create supplier');
    }
  }

  async update(
    id: string,
    restaurantId: string,
    input: UpdateSupplierInput,
  ): Promise<SupplierDTO> {
    try {
      const current = await this.prisma.supplier.findFirst({
        where: { id, restaurantId },
      });

      if (!current) {
        throw new NotFoundException('Supplier not found');
      }

      const { categoryIds, ...data } = input;

      const item = await this.prisma.supplier.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.contactName !== undefined && { contactName: data.contactName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.supplyingCategories !== undefined && {
            supplyingCategories: data.supplyingCategories,
          }),
          ...(data.status !== undefined && { status: data.status }),
          ...(categoryIds !== undefined && {
            categories: {
              deleteMany: {},
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
          }),
        },
        include: { categories: { include: { category: true } } },
      });

      return this.toDto(item);
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to update supplier');
    }
  }

  async remove(id: string, restaurantId: string): Promise<void> {
    try {
      const current = await this.prisma.supplier.findFirst({
        where: { id, restaurantId },
      });

      if (!current) {
        throw new NotFoundException('Supplier not found');
      }

      await this.prisma.supplierCategoryAssignment.deleteMany({ where: { supplierId: id } });
      await this.prisma.supplier.delete({ where: { id } });
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('Failed to delete supplier');
    }
  }

  private toDto(item: {
    id: string;
    restaurantId: string;
    name: string;
    contactName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    supplyingCategories: string | null;
    status: SupplierDTO['status'];
    createdAt: Date;
    updatedAt: Date;
    categories?: { category: { id: string; name: string } }[];
  }): SupplierDTO {
    return {
      id: item.id,
      restaurantId: item.restaurantId,
      name: item.name,
      contactName: item.contactName,
      phone: item.phone,
      email: item.email,
      address: item.address,
      supplyingCategories: item.supplyingCategories,
      status: item.status,
      categoryIds: item.categories?.map((c) => c.category.id) ?? [],
      categoryNames: item.categories?.map((c) => c.category.name) ?? [],
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
