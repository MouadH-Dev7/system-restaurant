import type { DraftLine, DraftModifierDetail } from '@/store/waiter.store';
import type { ModifierGroupDTO, ModifierOptionDTO, OrderResponse } from '@repo/shared-types';

function sameCartSelection(
  left: Pick<DraftLine, 'menuItemId' | 'modifierOptionIds' | 'notes'>,
  right: Pick<DraftLine, 'menuItemId' | 'modifierOptionIds' | 'notes'>,
) {
  const leftModifiers = [...(left.modifierOptionIds ?? [])].sort().join('|');
  const rightModifiers = [...(right.modifierOptionIds ?? [])].sort().join('|');

  return (
    left.menuItemId === right.menuItemId &&
    leftModifiers === rightModifiers &&
    (left.notes ?? '').trim() === (right.notes ?? '').trim()
  );
}

function mapOrderItemToDraftLine(order: OrderResponse): DraftLine[] {
  return order.items.map((item) => ({
    cartLineId: item.id,
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    notes: item.notes ?? undefined,
    modifierOptionIds: item.modifiers?.flatMap((modifier) =>
      modifier.modifierOptionId ? [modifier.modifierOptionId] : [],
    ),
    name: item.menuItem?.name ?? `Item ${item.menuItemId.slice(0, 6)}`,
    nameEn: item.menuItem?.nameEn,
    nameFr: item.menuItem?.nameFr,
    nameAr: item.menuItem?.nameAr,
    image: item.menuItem?.image ?? null,
    unitPrice: item.price,
    modifierDetails: (item.modifiers ?? []).map((modifier, index) => ({
      id: modifier.id ?? `modifier-${index}`,
      modifierOptionId: modifier.modifierOptionId,
      groupName: modifier.groupName,
      groupNameEn: modifier.groupNameEn,
      groupNameFr: modifier.groupNameFr,
      groupNameAr: modifier.groupNameAr,
      optionName: modifier.optionName,
      optionNameEn: modifier.optionNameEn,
      optionNameFr: modifier.optionNameFr,
      optionNameAr: modifier.optionNameAr,
      priceDelta: modifier.priceDelta,
    })),
  }));
}

function mergeDraftLines(baseLines: DraftLine[], addedLines: DraftLine[]) {
  const merged = [...baseLines];

  for (const line of addedLines) {
    const existingIndex = merged.findIndex((entry) => sameCartSelection(entry, line));

    if (existingIndex === -1) {
      merged.push(line);
      continue;
    }

    merged[existingIndex] = {
      ...merged[existingIndex]!,
      quantity: merged[existingIndex]!.quantity + line.quantity,
    };
  }

  return merged;
}

function getDraftTotal(lines: DraftLine[]) {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

function buildDraftModifierDetails(optionIds: string[], groups: ModifierGroupDTO[]) {
  const optionsById = new Map<string, { option: ModifierOptionDTO; group: ModifierGroupDTO }>();

  for (const group of groups) {
    for (const option of group.options) {
      optionsById.set(option.id, { option, group });
    }
  }

  return optionIds.flatMap((optionId) => {
    const match = optionsById.get(optionId);

    if (!match) {
      return [];
    }

    return [
      {
        id: optionId,
        modifierOptionId: match.option.id,
        groupName: match.group.name,
        groupNameEn: match.group.nameEn,
        groupNameFr: match.group.nameFr,
        groupNameAr: match.group.nameAr,
        optionName: match.option.name,
        optionNameEn: match.option.nameEn,
        optionNameFr: match.option.nameFr,
        optionNameAr: match.option.nameAr,
        priceDelta: match.option.priceDelta,
      } satisfies DraftModifierDetail,
    ];
  });
}

export {
  buildDraftModifierDetails,
  getDraftTotal,
  mapOrderItemToDraftLine,
  mergeDraftLines,
  sameCartSelection,
};
