import { http } from '@/lib/http';
import { useAuthStore } from './store';
import type { AuthSession } from './types';

type LoginInput = {
  staffCode: string;
  password: string;
};

export async function login(input: LoginInput) {
  const { data } = await http.post<AuthSession>('/auth/login', input);
  return data;
}

export async function logout() {
  const session = useAuthStore.getState().session;

  try {
    if (session?.refreshToken) {
      await http.post('/auth/logout', {
        refreshToken: session.refreshToken,
      });
    }
  } catch {
    // Clear local state even if the remote logout fails.
  } finally {
    useAuthStore.getState().clearSession();
  }
}
