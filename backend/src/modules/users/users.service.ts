import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogModule } from '@prisma/client';
import type { CreateStaffInput, StaffMemberDTO, UpdateStaffInput } from '@repo/shared-types';
import * as bcrypt from 'bcrypt';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AuditTrailService } from '../logs/audit-trail.service';
import { PrismaService } from '../../prisma/prisma.service';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  private optionalText(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private normalizeStaffCode(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed.toUpperCase() : null;
  }

  private requiredStaffCode(value?: string | null) {
    const staffCode = this.normalizeStaffCode(value);
    if (!staffCode) {
      throw new BadRequestException('Staff code is required');
    }

    return staffCode;
  }

  private buildSystemEmail(staffCode: string) {
    return `${staffCode.toLowerCase()}@staff.local`;
  }

  private optionalDate(value?: string | null) {
    const trimmed = value?.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  async findByRestaurant(restaurantId: string): Promise<StaffMemberDTO[]> {
    const users = await this.prisma.user.findMany({
      where: { restaurantId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });

    return users.map((user) => this.toStaffMember(user));
  }

  async findById(id: string, restaurantId: string): Promise<StaffMemberDTO> {
    const user = await this.prisma.user.findFirst({ where: { id, restaurantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toStaffMember(user);
  }

  async create(input: CreateStaffInput, actor?: AuthenticatedUser): Promise<StaffMemberDTO> {
    const staffCode = this.requiredStaffCode(input.staffCode);
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ staffCode }, { email: this.buildSystemEmail(staffCode) }],
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Staff code is already in use');
    }

    const user = await this.prisma.user.create({
      data: {
        restaurantId: input.restaurantId,
        name: input.name.trim(),
        email: this.buildSystemEmail(staffCode),
        password: await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS),
        role: input.role,
        phone: this.optionalText(input.phone),
        nationalId: this.optionalText(input.nationalId),
        birthDate: this.optionalDate(input.birthDate),
        hireDate: this.optionalDate(input.hireDate),
        address: this.optionalText(input.address),
        staffCode,
        salaryType: input.salaryType ?? null,
        salaryAmount: input.salaryAmount ?? null,
        emergencyContactName: this.optionalText(input.emergencyContactName),
        emergencyContactPhone: this.optionalText(input.emergencyContactPhone),
        notes: this.optionalText(input.notes),
        isActive: input.isActive ?? true,
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId: input.restaurantId,
        userId: actor?.sub ?? null,
        userName: actor?.name ?? 'System',
        role: actor?.role ?? 'SYSTEM',
        staffCode: actor?.staffCode ?? null,
        sessionId: actor?.sessionId ?? null,
      },
      module: AuditLogModule.STAFF,
      action: 'USER_CREATED',
      actionType: 'CREATE_USER',
      entityType: 'USER',
      entityId: user.id,
      after: this.toStaffMember(user),
      details: {
        targetUserId: user.id,
        targetStaffCode: user.staffCode,
        targetRole: user.role,
      },
      context: {
        ipAddress: actor?.ipAddress,
        userAgent: actor?.userAgent,
      },
    });

    return this.toStaffMember(user);
  }

  async update(
    id: string,
    restaurantId: string,
    input: UpdateStaffInput,
    actor?: AuthenticatedUser,
  ): Promise<StaffMemberDTO> {
    const existing = await this.prisma.user.findFirst({ where: { id, restaurantId } });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const before = this.toStaffMember(existing);

    const nextStaffCode =
      input.staffCode !== undefined
        ? this.requiredStaffCode(input.staffCode)
        : existing.staffCode;

    if (!nextStaffCode) {
      throw new BadRequestException('Staff code is required');
    }

    if (nextStaffCode !== existing.staffCode) {
      const duplicate = await this.prisma.user.findFirst({
        where: {
          OR: [
            { staffCode: nextStaffCode },
            { email: this.buildSystemEmail(nextStaffCode) },
          ],
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException('Staff code is already in use');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        email: this.buildSystemEmail(nextStaffCode),
        ...(input.password !== undefined
          ? { password: await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS) }
          : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.phone !== undefined ? { phone: this.optionalText(input.phone) } : {}),
        ...(input.nationalId !== undefined
          ? { nationalId: this.optionalText(input.nationalId) }
          : {}),
        ...(input.birthDate !== undefined ? { birthDate: this.optionalDate(input.birthDate) } : {}),
        ...(input.hireDate !== undefined ? { hireDate: this.optionalDate(input.hireDate) } : {}),
        ...(input.address !== undefined ? { address: this.optionalText(input.address) } : {}),
        staffCode: nextStaffCode,
        ...(input.salaryType !== undefined ? { salaryType: input.salaryType } : {}),
        ...(input.salaryAmount !== undefined ? { salaryAmount: input.salaryAmount } : {}),
        ...(input.emergencyContactName !== undefined
          ? { emergencyContactName: this.optionalText(input.emergencyContactName) }
          : {}),
        ...(input.emergencyContactPhone !== undefined
          ? { emergencyContactPhone: this.optionalText(input.emergencyContactPhone) }
          : {}),
        ...(input.notes !== undefined ? { notes: this.optionalText(input.notes) } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    await this.auditTrailService.record({
      actor: {
        restaurantId,
        userId: actor?.sub ?? null,
        userName: actor?.name ?? 'System',
        role: actor?.role ?? 'SYSTEM',
        staffCode: actor?.staffCode ?? null,
        sessionId: actor?.sessionId ?? null,
      },
      module: AuditLogModule.STAFF,
      action: input.isActive === false ? 'USER_DISABLED' : 'USER_UPDATED',
      actionType: input.role !== undefined ? 'CHANGE_USER_ROLE' : 'UPDATE_USER',
      entityType: 'USER',
      entityId: user.id,
      before,
      after: this.toStaffMember(user),
      details: {
        targetUserId: user.id,
        targetStaffCode: user.staffCode,
        targetRole: user.role,
      },
      context: {
        ipAddress: actor?.ipAddress,
        userAgent: actor?.userAgent,
      },
    });

    return this.toStaffMember(user);
  }

  private toStaffMember(user: {
    id: string;
    name: string;
    role: string;
    phone: string | null;
    nationalId: string | null;
    birthDate: Date | null;
    hireDate: Date | null;
    address: string | null;
    staffCode: string | null;
    salaryType: string | null;
    salaryAmount: number | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    notes: string | null;
    isActive: boolean;
    restaurantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): StaffMemberDTO {
    return {
      id: user.id,
      name: user.name,
      role: user.role as StaffMemberDTO['role'],
      phone: user.phone,
      nationalId: user.nationalId,
      birthDate: user.birthDate?.toISOString() ?? null,
      hireDate: user.hireDate?.toISOString() ?? null,
      address: user.address,
      staffCode: user.staffCode ?? '',
      salaryType: (user.salaryType as StaffMemberDTO['salaryType']) ?? null,
      salaryAmount: user.salaryAmount,
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
      notes: user.notes,
      isActive: user.isActive,
      restaurantId: user.restaurantId,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
