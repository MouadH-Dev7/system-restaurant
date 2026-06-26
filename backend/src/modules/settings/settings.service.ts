import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { SettingsDTO, UpsertSettingsInput } from '@repo/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(restaurantId: string): Promise<SettingsDTO | null> {
    let settings;

    try {
      settings = await this.prisma.restaurantSettings.findUnique({
        where: { restaurantId },
      });
    } catch (error) {
      if (this.isLegacyKitchenPrintingColumnIssue(error)) {
        const legacySettings = (await this.prisma.$queryRawUnsafe(
          `
            SELECT id, "restaurantId", "restaurantName", "contactPhone", "contactEmail",
                   "businessAddress", "receiptLogoUrl", "receiptFooterMessage",
                   "openingHours", "closingHours", currency, "salesTax",
                   "defaultDiscountLabel", "maxAutoDiscountPercent", "refundAlertThreshold",
                   language, direction, locale, "dateFormat", "acceptsCash",
                   "acceptsCard", "acceptsQrOrdering", "stripeEnabled",
                   "whatsappEnabled", "smtpEnabled", "createdAt", "updatedAt"
            FROM restaurant_settings
            WHERE "restaurantId" = $1
            LIMIT 1
          `,
          restaurantId,
        )) as Array<Record<string, unknown>>;

        const first = legacySettings[0];
        if (!first) {
          return null;
        }

        return this.toDto({
          ...first,
          kitchenPrintingEnabled: true,
        });
      }

      throw error;
    }

    return settings ? this.toDto(settings) : null;
  }

  async upsert(input: UpsertSettingsInput): Promise<SettingsDTO> {
    const settings = await this.prisma.restaurantSettings.upsert({
      where: { restaurantId: input.restaurantId },
      update: {
        ...input,
      },
      create: {
        ...input,
      },
    });

    return this.toDto(settings);
  }

  private isLegacyKitchenPrintingColumnIssue(error: unknown) {
    const prismaError = error as { code?: string; message?: string } | null;

    return (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      typeof prismaError?.message === 'string'
    )
      ? (prismaError?.code === 'P2021' ||
          prismaError?.code === 'P2022' ||
          prismaError?.message?.includes('kitchenPrintingEnabled') === true)
      : false;
  }

  private toDto(settings: any): SettingsDTO {
    return {
      id: settings.id,
      restaurantId: settings.restaurantId,
      restaurantName: settings.restaurantName,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      businessAddress: settings.businessAddress,
      receiptLogoUrl: settings.receiptLogoUrl,
      receiptFooterMessage: settings.receiptFooterMessage,
      openingHours: settings.openingHours,
      closingHours: settings.closingHours,
      currency: settings.currency,
      salesTax: settings.salesTax,
      defaultDiscountLabel: settings.defaultDiscountLabel,
      maxAutoDiscountPercent: settings.maxAutoDiscountPercent,
      refundAlertThreshold: settings.refundAlertThreshold,
      language: settings.language,
      direction: settings.direction as SettingsDTO['direction'],
      locale: settings.locale,
      dateFormat: settings.dateFormat,
      acceptsCash: settings.acceptsCash,
      acceptsCard: settings.acceptsCard,
      acceptsQrOrdering: settings.acceptsQrOrdering,
      kitchenPrintingEnabled: settings.kitchenPrintingEnabled ?? true,
      stripeEnabled: settings.stripeEnabled,
      whatsappEnabled: settings.whatsappEnabled,
      smtpEnabled: settings.smtpEnabled,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }
}
