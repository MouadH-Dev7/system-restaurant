import type { CreateStaffInput, StaffMemberDTO, UpdateStaffInput } from '@repo/shared-types';
import { http } from '@/lib/http';

export async function listStaff(restaurantId: string) {
  const { data } = await http.get<StaffMemberDTO[]>('/users');
  return data;
}

export async function createStaff(input: CreateStaffInput) {
  const { data } = await http.post<StaffMemberDTO>('/users', input);
  return data;
}

export async function updateStaff(staffId: string, input: UpdateStaffInput) {
  const { data } = await http.patch<StaffMemberDTO>(`/users/${staffId}`, input);
  return data;
}
