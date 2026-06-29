import type {
  CreateModifierIngredientInput,
  ModifierIngredientDTO,
  UpdateModifierIngredientInput,
} from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listModifierIngredients(modifierOptionId: string) {
  const { data } = await http.get<ModifierIngredientDTO[]>('/modifier-ingredients', {
    params: { modifierOptionId },
  });
  return data;
}

export async function createModifierIngredient(input: CreateModifierIngredientInput) {
  const { data } = await http.post<ModifierIngredientDTO>('/modifier-ingredients', input);
  return data;
}

export async function updateModifierIngredient(
  id: string,
  input: UpdateModifierIngredientInput,
) {
  const { data } = await http.patch<ModifierIngredientDTO>(`/modifier-ingredients/${id}`, input);
  return data;
}

export async function deleteModifierIngredient(id: string) {
  await http.delete(`/modifier-ingredients/${id}`);
}
