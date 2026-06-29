import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateCustomerProfileInput,
  CustomerProfileDTO,
  UpdateCustomerProfileInput,
} from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(restaurantId: string): Promise<CustomerProfileDTO[]> {
    const customers = await this.prisma.customerProfile.findMany({
      where: { restaurantId },
      orderBy: [{ totalSpent: 'desc' }, { name: 'asc' }],
      take: 300,
    });

    return customers.map((customer) => this.toDto(customer));
  }

  async create(input: CreateCustomerProfileInput): Promise<CustomerProfileDTO> {
    const customer = await this.prisma.customerProfile.create({
      data: {
        restaurantId: input.restaurantId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        tier: input.tier ?? 'NEW',
        notes: input.notes?.trim() || null,
      },
    });

    return this.toDto(customer);
  }

  async update(
    id: string,
    restaurantId: string,
    input: UpdateCustomerProfileInput,
  ): Promise<CustomerProfileDTO> {
    const existing = await this.prisma.customerProfile.findFirst({
      where: { id, restaurantId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    const customer = await this.prisma.customerProfile.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
        ...(input.tier !== undefined ? { tier: input.tier } : {}),
        ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      },
    });

    return this.toDto(customer);
  }

  private toDto(customer: {
    id: string;
    restaurantId: string;
    name: string;
    phone: string;
    email: string | null;
    tier: CustomerProfileDTO['tier'];
    notes: string | null;
    totalOrders: number;
    totalSpent: number | { toNumber(): number };
    lastVisitAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): CustomerProfileDTO {
    return {
      id: customer.id,
      restaurantId: customer.restaurantId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      tier: customer.tier,
      notes: customer.notes,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent),
      lastVisitAt: customer.lastVisitAt?.toISOString() ?? null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
